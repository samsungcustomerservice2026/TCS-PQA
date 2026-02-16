"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { App, ConfigProvider, theme, message as antdMessage } from 'antd';
import {
  Users,
  ShieldCheck,
  Search,
  BarChart3,
  Plus,
  LogOut,
  ChevronRight,
  Settings,
  Activity,
  Award,
  X,
  Save,
  Edit2,
  Eye,
  Download,
  Upload,
  Calendar,
  Layers,
  UserPlus,
  UserCircle,
  Trash2,
  Camera
} from 'lucide-react';
import { INITIAL_ENGINEERS, calculateTCS, getTier, getTierColor } from '../constants';
import { getEngineers, getHiddenEngineers, saveEngineer as saveEngineerToDb, archiveEngineer, getAdmins, saveAdmin as saveAdminToDb, deleteAdmin as deleteAdminFromDb } from '../services/firestoreService';
import { uploadPhoto } from '../services/storageService';

// --- Sub-components ---

const Header = ({ onHome }) => (
  <header className="sticky top-0 z-[100] px-6 py-4 md:px-12 md:py-6 bg-black/95 backdrop-blur-3xl border-b border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="max-w-[1400px] mx-auto">
      {/* Logos Row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-3">
          <div
            className="flex items-center cursor-pointer group"
            onClick={onHome}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <img src="./sam_logo.png" alt="Logo" className="h-8 md:h-12 w-auto object-contain brightness-110 group-hover:scale-110 transition-transform duration-500 relative z-10" />
            </div>
          </div>

          {/* Tagline - Mobile Only */}
          <div className="md:hidden">
            <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-black">
              "Earn Your Tier • Own Your Title"
            </p>
          </div>
        </div>

        <div className="flex items-center group">
          <img src="./fawzy-logo.png" alt="Logo" className="h-16 md:h-32 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-500 relative z-10" />
        </div>
      </div>

      {/* Tagline - Desktop Center */}
      <div className="hidden md:flex justify-center -mt-10 relative z-0 pointer-events-none">
        <div className="pointer-events-auto px-5 py-1.5 rounded-full">
          <p className="text-[15px] uppercase tracking-[0.5em] text-zinc-400 text-center font-black">
            "Earn Your Tier • Own Your Title"
          </p>
        </div>
      </div>
    </div>
  </header>
);

const MetricBar = ({ label, value, max = 100, suffix = "", color = "bg-blue-600", inverse = false }) => {
  const displayPercent = inverse ? Math.max(0, 100 - value) : value;
  const barColor = inverse ? (value > 15 ? "bg-red-500" : (value > 5 ? "bg-yellow-500" : "bg-green-500")) : color;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black text-white/90 tracking-widest">{label}</span>
          <span className="text-[7px] uppercase font-bold text-zinc-600 tracking-[0.2em]">{inverse ? 'Inverted Metric : Minimize' : 'Linear Metric : Maximize'}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-black italic tracking-tighter ${inverse && value > 15 ? "text-red-500" : "text-white"}`}>{value}</span>
          <span className="text-[8px] font-black text-zinc-500 uppercase">{suffix}</span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative glass-card">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10% 100%' }}
        />
        <div
          className={`h-full ${barColor} transition-all duration-1000 relative shadow-2xl`}
          style={{ width: `${Math.min(100, (displayPercent / max) * 100)}%` }}
        >
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-white opacity-40" />
        </div>
      </div>
    </div>
  );
};

const PageContent = () => {
  const { message, modal, notification } = App.useApp();
  const [view, setView] = useState('HOME');
  const [engineers, setEngineers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [noEngineers, setNoEngineers] = useState(false);
  const [editingEng, setEditingEng] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ username: '', password: '', name: '' });
  const [fetchedHiddenEngineers, setFetchedHiddenEngineers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [isLogged, setIsLogged] = useState(false);

  // Initial Load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedEngineers = await getEngineers();
        const fetchedHiddenEngineers = await getHiddenEngineers();
        const fetchedAdmins = await getAdmins();

        if (fetchedEngineers.length > 0) {
          setEngineers(fetchedEngineers);
        } else {
          setNoEngineers(true);
        }
        if (fetchedHiddenEngineers.length > 0) {
          setFetchedHiddenEngineers(fetchedHiddenEngineers);
        } else {
          setFetchedHiddenEngineers([]);
        }

        if (fetchedAdmins.length > 0) {
          setAdmins(fetchedAdmins);
        } else {
          const initialAdmin = {
            id: '1',
            username: 'fawzy.m',
            passwordB64: 'QWhsYXd5QDE5MDc=', // Ahlawy@1907
            name: 'Fawzy M.',
            role: 'SUPER_ADMIN',
            createdAt: new Date().toISOString()
          };
          setAdmins([initialAdmin]);
          // Auto-seed admin if empty? Maybe mostly managed via console for safety first time
          // or just let it exist in state until saved.
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortedEngineers = useMemo(() => {
    return [...engineers].sort((a, b) => b.tcsScore - a.tcsScore);
  }, [engineers]);

  const topThree = useMemo(() => {
    return sortedEngineers.slice(0, 3);
  }, [sortedEngineers]);

  const handleSearch = () => {
    const found = engineers.find(e => e.code.trim().toUpperCase() === searchCode.trim().toUpperCase());
    if (found) {
      setSelectedEngineer(found);
      setView('ENGINEER_PROFILE');
    } else {
      message.error("Engineer Code not found.");
    }
  };

  const handleAdminLogin = () => {
    const foundAdmin = admins.find(a =>
      a.username === loginUser && a.passwordB64 === window.btoa(loginPass)
    );

    if (foundAdmin) {
      setCurrentUser(foundAdmin);
      setLoginUser('');
      setLoginPass('');
      // save userName in local storage
      localStorage.setItem('userName', foundAdmin.name);
      setIsLogged(true);
      setView('ADMIN_DASHBOARD');
    } else {
      message.error("User or Password are wrong");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // clear userName from local storage
    localStorage.removeItem('userName');
    setIsLogged(false);
    setView('HOME');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && editingEng) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      // Store the file and the preview URL
      setEditingEng({
        ...editingEng,
        photoUrl: previewUrl,
        pendingFile: file,
        hidden: false
      });
    }
  };

  const saveEngineer = async (updated) => {
    setIsSaving(true);
    const hide = message.loading("Saving engineer data...", 0);

    try {
      const newScore = calculateTCS(updated);
      const newTier = getTier(newScore);

      let finalPhotoUrl = updated.photoUrl;

      // If a new file is pending upload
      if (updated.pendingFile) {
        try {
          // Save directly in /engineers folder with CODE_timestamp filename
          const url = await uploadPhoto(updated.pendingFile, 'engineers', updated.code.toUpperCase() || 'unknown');
          if (url) {
            finalPhotoUrl = url;
          }
        } catch (error) {
          console.error("Failed to upload photo:", error);
          message.warning("Failed to upload photo. Changes will be saved without new photo.");
        }
      }

      const finalEng = {
        ...updated,
        tcsScore: newScore,
        tier: newTier,
        photoUrl: finalPhotoUrl
      };

      // Remove temporary file object before saving to DB
      delete finalEng.pendingFile;

      // Generate a temporary ID if missing for local logic
      if (!finalEng.id) finalEng.id = Date.now().toString();

      const savedId = await saveEngineerToDb(finalEng);

      setEngineers(prev => {
        const existingIdx = prev.findIndex(e => e.id === finalEng.id || (e.code && e.code.toUpperCase() === finalEng.code.toUpperCase()));
        if (existingIdx !== -1) {
          const next = [...prev];
          next[existingIdx] = { ...finalEng, id: prev[existingIdx].id }; // Keep existing ID
          return next;
        }
        return [...prev, { ...finalEng, id: savedId || finalEng.id }];
      });

      setEditingEng(null);
      message.success("Engineer record committed successfully");
    } catch (error) {
      console.error("Error saving engineer:", error);
      message.error("Error saving engineer. Check console.");
    } finally {
      setIsSaving(false);
      hide();
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminData.username || !newAdminData.password || !newAdminData.name) {
      message.warning("Please fill all fields");
      return;
    }
    const newAdmin = {
      id: Date.now().toString(),
      username: newAdminData.username,
      passwordB64: window.btoa(newAdminData.password),
      name: newAdminData.name,
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    };

    try {
      await saveAdminToDb(newAdmin);
      setAdmins(prev => [...prev, newAdmin]);
      setNewAdminData({ username: '', password: '', name: '' });
      setShowAddAdmin(false);
      message.success("New admin added successfully");
    } catch (error) {
      console.error("Error adding admin:", error);
      message.error("Failed to add admin");
    }
  };

  const deleteAdminHandler = async (id) => {
    if (id === currentUser?.id) {
      message.error("You cannot delete yourself");
      return;
    }
    modal.confirm({
      title: 'Remove Admin',
      content: 'Are you sure you want to remove this admin?',
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteAdminFromDb(id);
          setAdmins(prev => prev.filter(a => a.id !== id));
          message.success("Admin removed");
        } catch (error) {
          console.error("Error deleting admin:", error);
          message.error("Failed to delete admin");
        }
      },
    });
  };

  const deleteEngineerHandler = async (id) => {
    modal.confirm({
      title: 'Archive Record',
      content: 'Are you sure you want to archive this engineer record? The data will be hidden but preserved.',
      okText: 'Archive',
      okType: 'danger',
      onOk: async () => {
        try {
          await archiveEngineer(id);
          const archivedEng = engineers.find(e => e.id === id);
          setEngineers(prev => prev.filter(e => e.id !== id));
          if (archivedEng) {
            setFetchedHiddenEngineers(prev => [...prev, { ...archivedEng, hidden: true }]);
          }
          message.success("Engineer archived");
        } catch (error) {
          console.error("Error deleting engineer:", error);
          message.error("Failed to archive engineer record.");
        }
      }
    });
  };

  const restoreEngineerHandler = async (id) => {
    modal.confirm({
      title: 'Restore Engineer',
      content: 'Are you sure you want to restore this engineer?',
      onOk: async () => {
        try {
          await saveEngineerToDb({ id, hidden: false });
          const restoredEng = fetchedHiddenEngineers.find(e => e.id === id);
          setFetchedHiddenEngineers(prev => prev.filter(e => e.id !== id));
          if (restoredEng) {
            setEngineers(prev => [...prev, { ...restoredEng, hidden: false }]);
          }
          message.success("Engineer restored");
        } catch (error) {
          console.error("Error restoring engineer:", error);
          message.error("Failed to restore engineer.");
        }
      }
    });
  };

  const downloadCSVTemplate = () => {
    const headers = [
      "Name", "Code", "PhotoURL", "ASC", "PartnerName", "Month", "Year",
      "ExamScore", "MonthlyRNPS", "TrainingAttendance", "RRR_Ratio",
      "SSR_Ratio", "IQCSkipRatio", "OQCFailRatio", "CorePartsUsed", "MultiPartUsed", "Product"
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "TCS_Excel_Template_2025.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result;
        const rows = text.split("\n").filter(row => row.trim() !== "");
        const uploadedRecords = rows.slice(1).map((row, index) => {
          const cols = row.split(",").map(c => c.trim());
          const eng = {
            id: '',
            name: cols[0] || "Unknown",
            code: cols[1]?.toUpperCase() || `TEMP-${index}`,
            photoUrl: cols[2] || "https://picsum.photos/200",
            asc: cols[3] || "N/A",
            partnerName: cols[4] || "N/A",
            month: cols[5] || "Active Month",
            year: cols[6] || new Date().getFullYear().toString(),
            examScore: parseFloat(cols[7]) || 0,
            monthlyRNPS: parseFloat(cols[8]) || 0,
            trainingAttendance: parseFloat(cols[9]) || 0,
            repeatedRepairRatio: parseFloat(cols[10]) || 0,
            sameSymptomRedoRatio: parseFloat(cols[11]) || 0,
            iqcSkipRatio: parseFloat(cols[12]) || 0,
            oqcFirstTimeFailRatio: parseFloat(cols[13]) || 0,
            corePartsUsed: parseFloat(cols[14]) || 0,
            multiPartsUsed: parseFloat(cols[15]) || 0,
            product: cols[16] || "N/A",
          };
          eng.tcsScore = calculateTCS(eng);
          eng.tier = getTier(eng.tcsScore);
          return eng;
        });

        if (uploadedRecords.length > 0) {
          // Bulk Save to DB
          // Note: This might be slow if sequential. 
          // For now, let's just loop and await, or Promise.all
          try {
            const promises = uploadedRecords.map(async (rec) => {
              const savedId = await saveEngineerToDb(rec);
              return { ...rec, id: savedId };
            });
            const savedRecords = await Promise.all(promises);

            // Update local state by refetching or merging
            // Merging for responsiveness
            setEngineers(prev => {
              const map = new Map(prev.map(e => [e.code.toUpperCase(), e]));
              savedRecords.forEach(rec => {
                map.set(rec.code.toUpperCase(), rec);
              });
              return Array.from(map.values());
            });

            message.success(`Success: ${uploadedRecords.length} records processed and saved.`);
          } catch (error) {
            console.error("Error uploading CSV data:", error);
            message.error("Error saving CSV data to database.");
          }
        }
      };
      reader.readAsText(file);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black animate-pulse">LOADING TCS SYSTEM...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24 selection:bg-blue-600 selection:text-white">
      <Header onHome={() => setView('HOME')} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">

        {view === 'HOME' && (
          <div className="space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
            {/* Hero & Leaderboard */}
            <section className="relative px-4">
              {/* Creative Background Element */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.03] text-[20vw] font-black tracking-tighter whitespace-nowrap text-white z-0">
                TOP TIER
              </div>

              <div className="relative z-10 text-center space-y-4 mb-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Next-Gen TCS</p>
                </div>
                <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white">
                  Beyond<span className="text-blue-600"> Standards</span><br />Above<span className="text-blue-600"> Average</span>
                </h2>
                <p className="text-zinc-500 text-sm md:text-base font-medium max-w-md mx-auto">
                  “The definitive ranking of technical excellence within the global network.”
                </p>
              </div>

              {/* Minimalist Podium v3 */}
              <div className="relative flex flex-col md:flex-row justify-center items-center md:items-end gap-12 md:gap-4 max-w-5xl mx-auto pt-10">
                {/* Second Place */}
                {topThree[1] && (
                  <div className="group relative flex flex-col items-center animate-in slide-in-from-left-8 duration-700 delay-200 order-2 md:order-1">
                    <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 mb-6">
                      <div className="absolute inset-0 rounded-full bg-zinc-700/20 blur-2xl group-hover:bg-zinc-700/40 transition-all" />
                      <img src={topThree[1].photoUrl} className="relative z-10 w-full h-full rounded-full object-cover border-2 border-zinc-700 grayscale hover:grayscale-0 transition-all duration-500" alt={topThree[1].name} />
                      <div className="absolute -bottom-2 right-0 z-20 bg-zinc-700 text-black text-xs font-black w-10 h-10 rounded-full flex items-center justify-center border-4 border-black">
                        02
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight truncate w-32">{topThree[1].name}</h3>
                      <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">{topThree[1].tier}</h4>
                      <div className="mt-3 py-2 px-6 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-zinc-500 transition-colors shadow-xl">
                        <span className="text-xl font-black text-white">{topThree[1].tcsScore}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* First Place */}
                {topThree[0] && (
                  <div className="group relative flex flex-col items-center z-20 mb-4 md:mb-0 md:-mt-10 scale-110 md:scale-125 animate-in zoom-in-95 duration-1000 order-1 md:order-2">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 mb-8 p-1.5 rounded-full bg-gradient-to-tr from-yellow-500/40 via-transparent to-yellow-500/10">
                      <div className="absolute inset-0 rounded-full bg-yellow-500/5 blur-3xl group-hover:bg-yellow-500/10 transition-all" />
                      <img src={topThree[0].photoUrl} className="relative z-10 w-full h-full rounded-full object-cover border-4 border-yellow-500 shadow-2xl" alt={topThree[0].name} />
                      <div className="absolute -bottom-3 right-0 z-20 bg-yellow-500 text-black text-base font-black w-14 h-14 rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                        01
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-yellow-500 uppercase tracking-tighter truncate max-w-[240px] mx-auto mb-1">
                        <Award className="w-5 h-5 inline-block align-middle mr-1" />
                        <span className="align-middle">{topThree[0].name}</span>
                      </h3>
                      <h4 className="text-yellow-600/60 text-[10px] font-black uppercase tracking-[0.4em] mb-4">{topThree[0].tier}</h4>
                      <div className="py-4 px-10 rounded-3xl bg-yellow-500/5 backdrop-blur-md border border-yellow-500/20 shadow-2xl relative overflow-hidden group/btn hover:scale-105 transition-transform">
                        <div className="absolute inset-0 bg-yellow-500/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                        <span className="relative z-10 text-4xl font-black text-yellow-500 tracking-tighter">{topThree[0].tcsScore}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Third Place */}
                {topThree[2] && (
                  <div className="group relative flex flex-col items-center animate-in slide-in-from-right-8 duration-700 delay-300 order-3 md:order-3">
                    <div className="relative z-10 w-24 h-24 md:w-28 md:h-28 mb-6">
                      <div className="absolute inset-0 rounded-full bg-orange-950/20 blur-2xl group-hover:bg-orange-950/40 transition-all" />
                      <img src={topThree[2].photoUrl} className="relative z-10 w-full h-full rounded-full object-cover border-2 border-orange-900/50 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" alt={topThree[2].name} />
                      <div className="absolute -bottom-1 right-0 z-20 bg-orange-900 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-black">
                        03
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-black text-zinc-400 group-hover:text-white transition-colors uppercase tracking-tight truncate w-32">{topThree[2].name}</h3>
                      <h4 className="text-orange-900/50 text-[10px] font-black uppercase tracking-widest mb-1">{topThree[2].tier}</h4>
                      <div className="mt-3 py-2 px-5 rounded-full bg-zinc-900/50 border border-zinc-800/50 group-hover:border-orange-900/40 transition-colors">
                        <span className="text-lg font-black text-zinc-500 group-hover:text-orange-700 transition-colors">{topThree[2].tcsScore}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* High-Impact Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4 pb-20">
              <button
                onClick={() => setView('ENGINEER_LOOKUP')}
                className="group relative h-64 md:h-80 overflow-hidden rounded-[3rem] bg-zinc-900/50 border border-white/5 hover:border-blue-500/20 transition-all duration-500 p-8 md:p-10 flex flex-col justify-between"
              >
                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-left">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Search className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-white mt-6 md:mt-8 uppercase">Capability<br /><span className="text-blue-500">Audit</span></h3>
                  <p className="text-zinc-500 text-xs md:text-sm font-medium mt-3 md:mt-4 max-w-[200px]">Verify your standing in the global hierarchy.</p>
                </div>
                <div className="relative z-10 self-end flex items-center gap-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                  Access Portal <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={() => setView(isLogged ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN')}
                className="group relative h-64 md:h-80 overflow-hidden rounded-[3rem] bg-white text-black hover:bg-zinc-200 transition-all duration-500 p-8 md:p-10 flex flex-col justify-between"
              >
                <div className="relative z-10 text-left">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter mt-6 md:mt-8 uppercase leading-none">Management<br />Node</h3>
                  <p className="text-zinc-600 text-xs md:text-sm font-medium mt-3 md:mt-4 max-w-[200px]">Unauthorized access is strictly monitored.</p>
                </div>
                <div className="relative z-10 self-end flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                  Initialize Login <LogOut className="w-4 h-4 rotate-180" />
                </div>
              </button>
            </section>
          </div>
        )}

        {view === 'ENGINEER_LOOKUP' && (
          <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
            {/* Header section */}
            <div className=" gap-12 border-b border-white/5 pb-6">



              <button
                onClick={() => setView('HOME')}
                className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-8 py-4 rounded-full border border-white/10"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Return to Hub
              </button>

              <h2 className="text-6xl text-center font-black tracking-tighter text-white uppercase italic leading-none py-12">"Precision Defines Rank."</h2>
            </div>


            {/* Central Verification Unit */}
            <div className="max-w-2xl mx-auto">
              <div className="glass-card rounded-[4rem] p-12 md:p-16 space-y-12 border-blue-500/10 shadow-3xl text-center relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Search className="w-64 h-64 -rotate-12" />
                </div>

                <div className="space-y-4 relative z-10">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Credential Verification</h3>
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Enter unique engineer identification code below</p>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="relative group">
                    <input
                      type="text"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                      placeholder="PROTO_XYZ_000"
                      className="w-full bg-black border border-white/5 rounded-3xl p-6 md:p-8 text-center text-2xl md:text-4xl font-black tracking-[0.2em] md:tracking-[0.4em] focus:border-blue-500 transition-all outline-none placeholder:text-zinc-900 text-white shadow-inner"
                    />
                    <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-0 h-[2px] bg-blue-500 group-focus-within:w-1/2 transition-all duration-700" />
                  </div>

                  <button
                    onClick={handleSearch}
                    className="w-full bg-white text-black py-6 md:py-8 rounded-3xl font-black text-sm uppercase tracking-[0.4em] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl"
                  >
                    Search
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-6 relative z-10">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Nodes Scanned</span>
                    <span className="text-sm font-black text-zinc-400 uppercase">Global_Registry</span>
                  </div>
                  <div className="h-4 w-[1px] bg-zinc-800" />
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Protocol</span>
                    <span className="text-sm font-black text-zinc-400 uppercase">TCS-V7.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-md mx-auto pt-24 space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-left space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-[2px] w-12 bg-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Secure Gateway</span>
              </div>
              <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">TERMINAL<br />LOGIN</h2>
              <p className="text-zinc-600 text-sm font-medium">Authentication required for management node access.</p>
            </div>

            <div className="space-y-6 bg-zinc-900 shadow-3xl p-10 rounded-[3rem] border border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Access ID</label>
                <input
                  type="text"
                  placeholder="USERNAME_ALPHA"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-blue-500 transition-all outline-none placeholder:text-zinc-800 font-bold text-white shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Security Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm focus:border-blue-500 transition-all outline-none placeholder:text-zinc-800 font-bold text-white shadow-inner"
                />
              </div>
              <button
                onClick={handleAdminLogin}
                className="w-full bg-white text-black py-6 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-[0.3em] mt-6"
              >
                Execute Initialization
              </button>
              <button
                onClick={() => setView('HOME')}
                className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors py-4"
              >
                Abort Connection
              </button>
            </div>
          </div>
        )}

        {view === 'ADMIN_DASHBOARD' && currentUser && (
          <div className="space-y-16 animate-in slide-in-from-bottom-8 duration-700">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-[2px] w-12 bg-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Command Center</span>
                </div>
                <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">TCS HUB<br />CONTROL</h2>
              </div>

              <div className="flex items-center gap-6 bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                  <UserCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Authorized Operator</span>
                  <span className="text-sm font-black text-white uppercase">{currentUser.name}</span>
                </div>
                <div className="h-10 w-[1px] bg-zinc-800 mx-2" />
                <button
                  onClick={handleLogout}
                  className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all group"
                >
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Management Suite */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 glass-card rounded-[3rem] p-6 md:p-10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Operations Unit</h3>
                  <button onClick={() => setView('PROFILE_MGMT')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Manage Accounts</button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setEditingEng({
                      id: '', name: '', code: '', photoUrl: 'https://picsum.photos/200', asc: '', partnerName: '', month: 'March', year: '2026',
                      examScore: '', monthlyRNPS: '', trainingAttendance: '', repeatedRepairRatio: '', sameSymptomRedoRatio: '',
                      iqcSkipRatio: '', oqcFirstTimeFailRatio: '', corePartsUsed: '', multiPartsUsed: '',
                      lastQEvaluation: '', tcsScore: 0, tier: 'Bronze'
                    })}
                    className="flex-1 bg-white text-black px-8 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl"
                  >
                    <Plus className="w-4 h-4" /> Manual Provisioning
                  </button>
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-3 bg-zinc-800 text-white px-8 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-zinc-700 transition-all border border-white/5 shadow-2xl">
                    <Upload className="w-4 h-4" /> Bulk Upload (CSV)
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                  </label>
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-10 flex flex-col group hover:border-blue-500/30 transition-all">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all mb-8 shadow-inner">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Schema Integration</h4>
                <p className="text-zinc-500 text-xs font-medium mb-8 leading-relaxed">Download the latest data structure template for system integration.</p>
                <button
                  onClick={downloadCSVTemplate}
                  className="mt-auto px-6 py-4 bg-zinc-800 text-zinc-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Download .CSV Template
                </button>
              </div>
            </div>

            {/* Live Registry Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-zinc-800" />
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Live Engineer Registry</h3>
                </div>
                <button
                  onClick={() => setNoEngineers(!noEngineers)}
                  className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all shadow-xl"
                >
                  <Eye className="w-4 h-4" />
                  {noEngineers ? "Minimize Archives" : "Inspect Archives"}
                </button>
              </div>

              {/* Archive Stack */}
              {noEngineers && fetchedHiddenEngineers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                  {fetchedHiddenEngineers.map(eng => (
                    <div key={eng.id} className="bg-red-950/10 border border-red-900/20 p-6 rounded-3xl flex items-center justify-between group hover:bg-red-900/20 transition-all">
                      <div className="flex items-center gap-5">
                        <img src={eng.photoUrl} className="w-12 h-12 rounded-xl object-cover grayscale opacity-40 shadow-2xl" alt={eng.name} />
                        <div>
                          <p className="text-sm font-black text-zinc-500 uppercase tracking-tight line-through opacity-50">{eng.name}</p>
                          <span className="text-[9px] font-black text-red-500 tracking-widest uppercase mt-1 block">ARCHIVED : {eng.code}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => restoreEngineerHandler(eng.id)}
                        className="p-4 bg-zinc-900 text-zinc-500 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Registry Stack */}
              <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                {sortedEngineers.length === 0 ? (
                  <div className="p-24 text-center text-zinc-700 italic font-black uppercase tracking-[0.3em]">No registry entries detected.</div>
                ) : sortedEngineers.map(eng => (
                  <div key={eng.id} className="bg-black hover:bg-zinc-900/50 transition-all p-4 md:p-8 flex items-center justify-between group">
                    <div className="flex items-center gap-4 md:gap-8">
                      <div className="w-12 h-12 md:w-16 md:h-16 relative flex-shrink-0">
                        <img src={eng.photoUrl} className="w-full h-full rounded-2xl object-cover grayscale-50 group-hover:grayscale-0 transition-all shadow-2xl shadow-black/80" alt={eng.name} />
                        <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full border-4 border-black ${getTierColor(eng.tier)}`} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-sm md:text-lg font-black text-white uppercase tracking-tighter group-hover:text-blue-500 transition-colors uppercase truncate">{eng.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">{eng.code}</span>
                          <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] px-2 md:px-3 py-1 bg-zinc-900 border border-white/5 rounded-full ${getTierColor(eng.tier)}`}>{eng.tier} Specialist</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-12 flex-shrink-0">
                      <div className="text-right flex flex-col items-end">
                        <span className="text-lg md:text-2xl font-black text-white tracking-widest italic">{eng.tcsScore}</span>
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Registry Index</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingEng(eng)}
                          className="p-3 md:p-4 bg-zinc-900 text-zinc-500 rounded-xl md:rounded-2xl hover:bg-white hover:text-black transition-all shadow-xl"
                        >
                          <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => deleteEngineerHandler(eng.id)}
                          className="p-3 md:p-4 bg-zinc-900 text-zinc-500 rounded-xl md:rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'PROFILE_MGMT' && (
          <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 border-b border-white/5 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-[2px] w-12 bg-white" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Security Infrastructure</span>
                </div>
                <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">ADMIN<br />DIRECTORY</h2>
              </div>
              <button
                onClick={() => setView('ADMIN_DASHBOARD')}
                className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all bg-white/5 px-6 py-3 rounded-full border border-white/10"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Return to Command
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-8">
                <div className="glass-card rounded-[3rem] p-10 space-y-10 border-green-500/20 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <UserPlus className="w-4 h-4 text-green-500" /> Provision Node
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Full Identity</label>
                      <input
                        type="text"
                        placeholder="NAME_ALPHA"
                        className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-green-600 font-bold text-white shadow-inner"
                        value={newAdminData.name}
                        onChange={e => setNewAdminData({ ...newAdminData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Access Identifier</label>
                      <input
                        type="text"
                        placeholder="USERNAME_SIGMA"
                        className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-green-600 font-bold text-white shadow-inner"
                        value={newAdminData.username}
                        onChange={e => setNewAdminData({ ...newAdminData, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Secure Key</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-green-600 font-bold text-white shadow-inner"
                        value={newAdminData.password}
                        onChange={e => setNewAdminData({ ...newAdminData, password: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={handleAddAdmin}
                      className="w-full bg-green-600 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-green-500 transition-all shadow-2xl shadow-green-900/40 mt-6"
                    >
                      Initialize Provisioning
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-zinc-800" />
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Active Operations Nodes</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {admins.map(admin => (
                    <div key={admin.id} className="bg-zinc-900/50 hover:bg-zinc-900 transition-all p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-zinc-700 border border-white/5 group-hover:text-blue-500 transition-colors shadow-inner">
                          <UserCircle className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-white uppercase tracking-tighter">{admin.name}</span>
                            {admin.role === 'SUPER_ADMIN' && <span className="text-[8px] bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full border border-blue-600/20 font-black tracking-widest uppercase">System Root</span>}
                          </div>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">@ACCESS_ID: {admin.username}</span>
                        </div>
                      </div>
                      {admin.id !== '1' && (
                        <button
                          onClick={() => deleteAdminHandler(admin.id)}
                          className="p-5 bg-black text-zinc-700 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'ENGINEER_PROFILE' && selectedEngineer && (
          <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
            {/* Dossier Header */}
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-12 border-b border-white/5 pb-16">
              <div className="flex flex-col items-center md:items-start gap-8">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-blue-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                  <img src={selectedEngineer.photoUrl} className="relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] md:rounded-[3.5rem] object-cover border-4 border-zinc-800 shadow-3xl grayscale-50 group-hover:grayscale-0 transition-all duration-500" alt={selectedEngineer.name} />
                  <div className={`absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black shadow-2xl border-4 border-black z-20 ${getTierColor(selectedEngineer.tier)}`}>
                    {selectedEngineer.tier[0]}
                  </div>
                </div>
                <div className="text-center md:text-left space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <div className="h-[1px] w-8 bg-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Personnel Dossier</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">{selectedEngineer.name}</h2>
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.6em]">{selectedEngineer.code}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="glass-card px-10 py-6 rounded-3xl flex flex-col items-end border-blue-500/20 shadow-2xl">
                  <span className="text-6xl font-black text-white italic tracking-tighter">{selectedEngineer.tcsScore}</span>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Aggregate Capability Index</span>
                </div>
                <button
                  onClick={() => setView('ENGINEER_LOOKUP')}
                  className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to Registry
                </button>
              </div>
            </div>

            {/* Capability Metrics Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card rounded-[3rem] p-10 space-y-8 md:col-span-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Activity className="w-4 h-4 text-blue-500" /> Performance Analysis
                  </h3>
                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Ref: CY-2026/01</span>
                </div>

                <div className="space-y-12 py-4">
                  <div className="space-y-6">
                    <MetricBar label="TCS Examination Score" value={selectedEngineer.examScore} suffix=" pts" color="bg-blue-600" />
                    <MetricBar label="Monthly RNPS" value={selectedEngineer.monthlyRNPS} suffix=" pts" color="bg-zinc-100" />
                    <MetricBar label="Core Competency Training" value={selectedEngineer.trainingAttendance} suffix="%" color="bg-green-600" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-12 border-t border-white/5">
                    <MetricBar label="Repeated Repair (RRR)" value={selectedEngineer.repeatedRepairRatio} suffix="%" inverse />
                    <MetricBar label="Same Symptom Redo (SSR)" value={selectedEngineer.sameSymptomRedoRatio} suffix="%" inverse />
                    <MetricBar label="IQC Non-Compliance" value={selectedEngineer.iqcSkipRatio} suffix="%" inverse />
                    <MetricBar label="OQC First Fail Rate" value={selectedEngineer.oqcFirstTimeFailRatio} suffix="%" inverse />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8 border border-blue-600/20">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Global Network Rank</h4>
                  <span className="text-5xl font-black text-white italic tracking-tighter mb-2">#{sortedEngineers.findIndex(e => e.id === selectedEngineer.id) + 1}</span>
                  <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-widest">Top {Math.round(((sortedEngineers.findIndex(e => e.id === selectedEngineer.id) + 1) / engineers.length) * 100)}% of global talent</p>
                </div>

                <div className="glass-card rounded-[3rem] p-10">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10">Audit Metadata</h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Cycle</span>
                      <span className="text-xs font-black text-white uppercase">{selectedEngineer.month} {selectedEngineer.year}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Tier Status</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${getTierColor(selectedEngineer.tier)}`}>{selectedEngineer.tier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Auth Code</span>
                      <span className="text-[10px] font-mono text-zinc-400">0x-SH-{selectedEngineer.code.split('-')[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Watermark */}
            <div className="pt-12 text-center opacity-20 select-none pointer-events-none">
              <p className="text-[8px] font-black uppercase tracking-[1em] text-zinc-500">Official TCS Certification Document • Unauthorized reproduction prohibited</p>
            </div>
          </div>
        )}

        {/* Upsert Modal (Manual Entry) */}
        {editingEng && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-start justify-center p-4 sm:p-12 overflow-y-auto custom-scrollbar pt-12">
            <div className="bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative my-auto overflow-hidden">
              {/* Decorative scanline effect */}
              <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

              <button
                onClick={() => setEditingEng(null)}
                className="absolute top-8 right-8 p-4 bg-zinc-900 text-white rounded-2xl hover:bg-white hover:text-black transition-all shadow-3xl z-[110] group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-20 pt-8 md:pt-0">
                <div className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-8 md:space-y-12 relative z-10">
                  <div className="relative group">
                    <div className="absolute -inset-8 bg-blue-600/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
                    <div
                      className="relative w-32 h-32 md:w-64 md:h-64 rounded-[2.5rem] md:rounded-[4rem] border-4 border-zinc-800 overflow-hidden cursor-pointer shadow-3xl transition-all hover:border-blue-500 group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img src={editingEng.photoUrl} className="w-full h-full object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" alt="Profile" />
                      <div className="absolute inset-0 bg-blue-600/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md">
                        <Camera className="w-10 h-10 text-white mb-2" />
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Update Capture</span>
                      </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </div>

                  <div className="space-y-4 md:space-y-6 w-full text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                      <div className="h-[2px] w-8 md:w-12 bg-blue-500" />
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">Node Provision</span>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-none tracking-tighter">
                        {editingEng.id ? 'UPDATE' : 'GENERATE'}<br />
                        <span className="text-blue-500">PROTOCOL</span>
                      </h2>
                      <p className="text-zinc-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{editingEng.id ? 'Editing existing registry entry' : 'Initializing new personnel node'}</p>
                    </div>

                    <div className="pt-4 md:pt-8 space-y-3 md:space-y-4 max-w-[200px] mx-auto lg:mx-0">
                      <div className="flex items-center justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">
                        <span>Status</span>
                        <span className="text-green-500 font-black">ONLINE</span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">
                        <span>Encryption</span>
                        <span className="text-white font-black">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Full Operational Name</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.name} onChange={e => setEditingEng({ ...editingEng, name: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Engineer Protocol Code</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none uppercase placeholder:text-zinc-800" placeholder="SAM-2026-X" value={editingEng.code} onChange={e => setEditingEng({ ...editingEng, code: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Active Audit Period</label>
                      <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-center">
                        <input className="w-full md:flex-1 bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.month} onChange={e => setEditingEng({ ...editingEng, month: e.target.value })} placeholder="Month" />
                        <input className="w-full md:w-40 bg-black/40 border border-white/10 rounded-2xl p-5 text-base font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.year} onChange={e => setEditingEng({ ...editingEng, year: e.target.value })} placeholder="Year" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 space-y-10 glass-card">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] border-b border-white/5 pb-6">Performance Matrix Allocation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Exam Score</label>
                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.examScore} onChange={e => setEditingEng({ ...editingEng, examScore: e.target.value })} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest ml-1">RNPS Score</label>
                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.monthlyRNPS} onChange={e => setEditingEng({ ...editingEng, monthlyRNPS: e.target.value })} />
                      </div>
                      <div className="space-y-4 md:col-span-2">
                        <label className="text-[10px] font-black text-green-500 uppercase tracking-widest ml-1">Training Attendance</label>
                        <input type="number" step="0.1" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng.trainingAttendance} onChange={e => setEditingEng({ ...editingEng, trainingAttendance: e.target.value })} />
                      </div>
                      {/* Dynamic Metrics */}
                      {[
                        { k: 'repeatedRepairRatio', l: 'RRR', c: 'text-red-500' },
                        { k: 'sameSymptomRedoRatio', l: 'SSR', c: 'text-red-500' },
                        { k: 'iqcSkipRatio', l: 'IQC Non-Comp', c: 'text-red-500' },
                        { k: 'oqcFirstTimeFailRatio', l: 'OQC Fail Rate', c: 'text-red-500' },
                      ].map(item => (
                        <div key={item.k} className="space-y-4">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${item.c}`}>{item.l}</label>
                          <input type="number" step="0.1" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 transition-all outline-none" value={editingEng[item.k]} onChange={e => setEditingEng({ ...editingEng, [item.k]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => saveEngineer(editingEng)}
                    disabled={isSaving}
                    className="w-full bg-white text-black py-8 rounded-[2rem] font-black text-[11px] md:text-sm uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 group"
                  >
                    {isSaving ? <div className="w-6 h-6 border-4 border-zinc-200 border-t-black rounded-full animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                    {isSaving ? 'Synchronizing Node...' : 'Commit Protocol Entry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-sm bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-5 px-10 flex justify-around items-center shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50">
        <button onClick={() => setView('HOME')} className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${view === 'HOME' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <BarChart3 className={`w-6 h-6 ${view === 'HOME' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.1em]">Status</span>
        </button>
        <button onClick={() => setView('ENGINEER_LOOKUP')} className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${view === 'ENGINEER_LOOKUP' || view === 'ENGINEER_PROFILE' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <Search className={`w-6 h-6 ${view === 'ENGINEER_LOOKUP' || view === 'ENGINEER_PROFILE' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.1em]">Search</span>
        </button>
        <button onClick={() => setView(isLogged ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN')} className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${view === 'ADMIN_LOGIN' || view === 'ADMIN_DASHBOARD' || view === 'PROFILE_MGMT' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <ShieldCheck className={`w-6 h-6 ${view === 'ADMIN_LOGIN' || view === 'ADMIN_DASHBOARD' || view === 'PROFILE_MGMT' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.1em]">Secure</span>
        </button>
      </nav>
    </div>
  );
};
const Page = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 16,
        },
      }}
    >
      <App>
        <PageContent />
      </App>
    </ConfigProvider>
  );
};

export default Page;
