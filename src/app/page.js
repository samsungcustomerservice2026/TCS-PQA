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
  <header className="p-8 flex flex-col items-center border-b border-zinc-900 bg-black sticky top-0 z-50">
    <div
      className="flex items-center gap-2 cursor-pointer group transition-all transform active:scale-95"
      onClick={onHome}
    >
      <span className="text-5xl font-black tracking-[-0.08em] text-white animate-pulse-subtle group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        SAMSUNG
      </span>
    </div>
    <h1 className="text-[10px] uppercase tracking-[0.5em] text-zinc-400 mt-3 font-black bg-white/5 px-4 py-1 rounded-full border border-white/10">
      TCS Engineer's Challenge
    </h1>
    <p className="text-[11px] text-zinc-500 italic mt-3 font-medium">“Earn Your Tier Own Your Title”</p>
  </header>
);

const MetricBar = ({ label, value, max = 100, suffix = "", color = "bg-blue-600", inverse = false }) => {
  const displayPercent = inverse ? Math.max(0, 100 - value) : value;
  const barColor = inverse ? (value > 15 ? "bg-red-500" : (value > 5 ? "bg-yellow-500" : "bg-green-500")) : color;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] uppercase font-black text-zinc-500 tracking-tighter">
        <span className="flex items-center gap-1">
          {label}
          <span className="opacity-40 text-[7px] lowercase">({inverse ? 'low is better' : 'high is better'})</span>
        </span>
        <span className={inverse && value > 15 ? "text-red-400" : "text-white"}>{value}{suffix}</span>
      </div>
      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full ${barColor} transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.05)]`}
          style={{ width: `${Math.min(100, (displayPercent / max) * 100)}%` }}
        />
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
      message.error("Engineer Code not found. Please verify your credentials.");
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
      setView('ADMIN_DASHBOARD');
    } else {
      message.error("User or Password are wrong");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
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

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">

        {view === 'HOME' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <section className="relative pt-6 pb-6">
              <div className="text-center space-y-3 mb-12">
                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] opacity-80">Global Tier Leaderboard</h2>
                <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-400 px-5 py-2 rounded-full border border-blue-600/20 shadow-xl shadow-blue-900/5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Cycle: {engineers[0]?.month || "---"} {engineers[0]?.year || ""}
                  </span>
                </div>
              </div>

              <div className="flex justify-center items-end gap-3 md:gap-6">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="relative group cursor-pointer">
                      <img src={topThree[1].photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-zinc-600 object-cover shadow-2xl transition-transform group-hover:scale-105" alt={topThree[1].name} />
                      <div className="absolute -top-2 -right-2 bg-zinc-500 text-black font-black rounded-full w-6 h-6 flex items-center justify-center text-[10px] shadow-lg">2</div>
                    </div>
                    <p className="text-[10px] font-black mt-3 truncate w-20 text-center uppercase tracking-tighter">{topThree[1].name}</p>
                    <p className={`text-[8px] font-black uppercase tracking-[0.1em] ${getTierColor(topThree[1].tier)}`}>{topThree[1].tier}</p>
                    <div className="h-20 w-16 bg-gradient-to-t from-zinc-900 to-zinc-700 rounded-t-2xl mt-3 flex flex-col items-center justify-center border-t border-zinc-700/50">
                      <span className="font-black text-white text-base">{topThree[1].tcsScore}</span>
                      <span className="text-[7px] text-zinc-500 uppercase font-black">TCS Score</span>
                    </div>
                  </div>
                )}
                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-1000">
                    <div className="relative group scale-110 -mt-10 cursor-pointer">
                      <img src={topThree[0].photoUrl} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-yellow-500 object-cover shadow-[0_0_40px_rgba(234,179,8,0.25)] transition-all group-hover:scale-105" alt={topThree[0].name} />
                      <div className="absolute -top-3 -right-3 bg-yellow-500 text-black font-black rounded-full w-9 h-9 flex items-center justify-center text-sm shadow-xl border-2 border-black">1</div>
                    </div>
                    <p className="text-[11px] font-black mt-4 truncate w-28 text-center uppercase tracking-tighter text-yellow-500">{topThree[0].name}</p>
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${getTierColor(topThree[0].tier)}`}>{topThree[0].tier}</p>
                    <div className="h-36 w-24 bg-gradient-to-t from-zinc-900/80 to-yellow-600/30 rounded-t-3xl mt-4 flex flex-col items-center justify-center border-t border-yellow-500/30 backdrop-blur-sm">
                      <span className="font-black text-yellow-500 text-2xl tracking-tighter">{topThree[0].tcsScore}</span>
                      <span className="text-[8px] text-yellow-600 uppercase font-black tracking-widest">Master TCS</span>
                    </div>
                  </div>
                )}
                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    <div className="relative group cursor-pointer">
                      <img src={topThree[2].photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-orange-800 object-cover shadow-2xl transition-transform group-hover:scale-105" alt={topThree[2].name} />
                      <div className="absolute -top-2 -right-2 bg-orange-800 text-white font-black rounded-full w-6 h-6 flex items-center justify-center text-[10px] shadow-lg">3</div>
                    </div>
                    <p className="text-[10px] font-black mt-3 truncate w-20 text-center uppercase tracking-tighter">{topThree[2].name}</p>
                    <p className={`text-[8px] font-black uppercase tracking-[0.1em] ${getTierColor(topThree[2].tier)}`}>{topThree[2].tier}</p>
                    <div className="h-16 w-16 bg-gradient-to-t from-zinc-900 to-orange-900/30 rounded-t-2xl mt-3 flex flex-col items-center justify-center border-t border-orange-900/30">
                      <span className="font-black text-orange-700 text-base">{topThree[2].tcsScore}</span>
                      <span className="text-[7px] text-orange-900 uppercase font-black">TCS Score</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5 pt-8">
              <button onClick={() => setView('ENGINEER_LOOKUP')} className="group relative overflow-hidden flex items-center justify-between p-7 bg-zinc-900/80 rounded-[2rem] border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 transition-all active:scale-[0.98] shadow-2xl">
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/[0.02] transition-colors" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                    <Search className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black tracking-tight uppercase">Tier Verification</h3>
                    <p className="text-[11px] text-zinc-500 font-medium tracking-tight">“Confirm your rank within the Samsung technical ecosystem”</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button onClick={() => setView(currentUser ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN')} className="group relative overflow-hidden flex items-center justify-between p-7 bg-zinc-900/80 rounded-[2rem] border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 transition-all active:scale-[0.98] shadow-2xl">
                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-zinc-700/10 rounded-2xl text-zinc-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black tracking-tight uppercase">Management Node</h3>
                    <p className="text-[11px] text-zinc-500 font-medium tracking-tight">System configuration and engineer capability indexing</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}

        {view === 'ENGINEER_LOOKUP' && (
          <div className="space-y-8 animate-in slide-in-from-right-6 duration-500">
            <button onClick={() => setView('HOME')} className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
            </button>
            <div className="text-center py-10">
              <h2 className="text-4xl font-black tracking-tighter text-white">Capability Audit</h2>
              <p className="text-sm text-zinc-500 mt-2 font-medium">Verify your Tier status in the global ranking</p>
            </div>
            <div className="space-y-6 max-w-sm mx-auto">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="EX: SAM-001"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center text-3xl font-black tracking-[0.4em] focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all placeholder:text-zinc-800 shadow-2xl"
              />
              <button onClick={handleSearch} className="w-full bg-blue-600 py-5 rounded-3xl font-black text-lg hover:bg-blue-500 transition-all active:scale-95 shadow-2xl shadow-blue-900/30 uppercase tracking-[0.3em]">
                INITIATE VERIFICATION
              </button>
            </div>
          </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-sm mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <div className="inline-block p-6 bg-zinc-900 rounded-[2rem] mb-6 shadow-2xl border border-white/5">
                <ShieldCheck className="w-12 h-12 text-blue-500 animate-pulse-subtle" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">Terminal Login</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] mt-2 font-bold opacity-60">Authentication Required</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Admin Identifier</label>
                <input type="text" placeholder="Access ID" value={loginUser} onChange={e => setLoginUser(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-sm focus:border-white focus:bg-zinc-900 transition-all outline-none placeholder:text-zinc-700 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Security Token</label>
                <input type="password" placeholder="System Token" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-sm focus:border-white focus:bg-zinc-900 transition-all outline-none placeholder:text-zinc-700 font-bold" />
              </div>
              <button onClick={handleAdminLogin} className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-[0.2em] mt-4">
                EXECUTE ACCESS
              </button>
              <button onClick={() => setView('HOME')} className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors mt-4">Safe Disconnect</button>
            </div>
          </div>
        )}

        {view === 'ADMIN_DASHBOARD' && currentUser && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
                <Settings className="w-6 h-6 text-blue-500" /> TCS Hub
              </h2>
              <button onClick={handleLogout} className="text-red-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 border border-red-900/20 px-5 py-2 rounded-full bg-red-900/5 hover:bg-red-900/20 transition-all shadow-lg">
                <LogOut className="w-3.5 h-3.5" /> SHUTDOWN
              </button>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                  <UserCircle className="w-10 h-10 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter opacity-60">Admin: @{currentUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setView('PROFILE_MGMT')}
                className="bg-white/5 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all shadow-inner"
              >
                Accounts
              </button>
            </div>

            <div className="flex flex-col gap-6 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.4em]">Inventory Control</h3>
                <button onClick={downloadCSVTemplate} className="flex items-center gap-2 text-[10px] font-black bg-zinc-800 text-zinc-400 border border-white/5 px-5 py-2.5 rounded-2xl hover:bg-zinc-700 transition-all shadow-sm">
                  <Download className="w-4 h-4" /> EXCEL TEMPLATE
                </button>
              </div>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-3 text-[11px] font-black bg-green-600/10 text-green-500 border border-green-600/20 px-6 py-5 rounded-[1.5rem] hover:bg-green-600/20 transition-all uppercase tracking-widest shadow-2xl">
                  <Upload className="w-5 h-5" /> BULK UPSERT
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                </label>
                <button
                  onClick={() => setEditingEng({
                    id: '', name: '', code: '', photoUrl: 'https://picsum.photos/200', asc: '', partnerName: '', month: 'March', year: '2025',
                    examScore: 0, monthlyRNPS: 0, trainingAttendance: 0, repeatedRepairRatio: 0, sameSymptomRedoRatio: 0,
                    iqcSkipRatio: 0, oqcFirstTimeFailRatio: 0, corePartsUsed: 0, multiPartsUsed: 0,
                    lastQEvaluation: 0, tcsScore: 0, tier: 'Bronze'
                  })}
                  className="flex items-center gap-3 text-[11px] font-black bg-blue-600 text-white px-8 py-5 rounded-[1.5rem] hover:bg-blue-500 transition-all uppercase tracking-widest shadow-2xl shadow-blue-900/30"
                >
                  <Plus className="w-5 h-5" /> MANUAL ENTRY
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mb-4">
              <button onClick={() => setNoEngineers(!noEngineers)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                <Eye className="w-4 h-4" />
                {noEngineers ? "Hide Archived" : "Show Archived"}
              </button>
              {fetchedHiddenEngineers.length > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-900 px-2 py-1 rounded-full">
                  {fetchedHiddenEngineers.length}
                </span>
              )}
            </div>

            {noEngineers && (
              fetchedHiddenEngineers.map(eng => (
                <div key={eng.id} className="bg-red-900/10 p-5 rounded-3xl border border-red-900/20 flex items-center justify-between group hover:border-red-500/30 transition-all duration-300 shadow-lg opacity-75 hover:opacity-100">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={eng.photoUrl} className="w-14 h-14 rounded-2xl object-cover grayscale brightness-50" alt={eng.name} />
                    </div>
                    <div>
                      <p className="text-base font-black tracking-tight text-white/50 uppercase line-throughDecoration">{eng.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-zinc-600 font-mono font-black tracking-widest uppercase">{eng.code}</span>
                        <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-full bg-red-900/20 text-red-500 border border-red-900/30">ARCHIVED</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => restoreEngineerHandler(eng.id)} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-green-600 text-zinc-400 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
                    <Upload className="w-3 h-3" /> Restore
                  </button>
                </div>
              ))
            )}


            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar p-2">
              {sortedEngineers.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-500">No engineers found</p>
                </div>
              ) : sortedEngineers.map(eng => (
                <div key={eng.id} className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50 flex items-center justify-between group hover:border-zinc-500/50 hover:bg-zinc-900 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={eng.photoUrl} className="w-14 h-14 rounded-2xl object-cover grayscale-50 group-hover:grayscale-0 transition-all shadow-xl" alt={eng.name} />
                      <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-zinc-900" />
                    </div>
                    <div>
                      <p className="text-base font-black tracking-tight text-white/90 uppercase">{eng.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-zinc-500 font-mono font-black tracking-widest uppercase">{eng.code}</span>
                        <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full bg-black/50 border border-zinc-800/80 ${getTierColor(eng.tier)}`}>{eng.tier}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-black text-blue-500 tracking-tighter">{eng.tcsScore}</p>
                      <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{eng.month} {eng.year}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingEng(eng)} className="p-3.5 bg-zinc-800 rounded-2xl hover:bg-zinc-700 hover:text-white transition-all shadow-inner">
                        <Edit2 className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button onClick={() => deleteEngineerHandler(eng.id)} className="p-3.5 bg-zinc-800 rounded-2xl hover:bg-red-900/20 hover:text-red-500 transition-all shadow-inner group/delete">
                        <Trash2 className="w-4 h-4 text-zinc-400 group-hover/delete:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
              }
            </div>
          </div>
        )}

        {view === 'PROFILE_MGMT' && (
          <div className="space-y-8 animate-in slide-in-from-right-6 duration-500">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('ADMIN_DASHBOARD')} className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:text-white transition-all bg-white/5 px-5 py-2 rounded-full">
                <ChevronRight className="w-4 h-4 rotate-180" /> Dashboard
              </button>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Admin Directory</h3>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-[3rem] p-8 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600/10 rounded-2xl">
                    <UserPlus className="w-6 h-6 text-green-500" />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight">Provision Account</h4>
                </div>
                <button
                  onClick={() => setShowAddAdmin(!showAddAdmin)}
                  className={`p-3 rounded-2xl transition-all shadow-xl ${showAddAdmin ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600 text-white'}`}
                >
                  {showAddAdmin ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {showAddAdmin && (
                <div className="space-y-5 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Legal Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-600 font-bold"
                        value={newAdminData.name}
                        onChange={e => setNewAdminData({ ...newAdminData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Public Identifier</label>
                      <input
                        type="text"
                        placeholder="username"
                        className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-600 font-bold"
                        value={newAdminData.username}
                        onChange={e => setNewAdminData({ ...newAdminData, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Security Key</label>
                      <input
                        type="password"
                        placeholder="********"
                        className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-green-600 font-bold"
                        value={newAdminData.password}
                        onChange={e => setNewAdminData({ ...newAdminData, password: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={handleAddAdmin}
                      className="w-full bg-green-600 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-green-500 transition-all shadow-2xl mt-4"
                    >
                      Authorize Admin Node
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Active Profiles</h4>
                {admins.map(admin => (
                  <div key={admin.id} className="bg-black/40 border border-zinc-800/50 p-6 rounded-[1.5rem] flex items-center justify-between group hover:border-blue-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-600 border border-white/5">
                        <UserCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-white/90">
                          {admin.name}
                          {admin.role === 'SUPER_ADMIN' && <span className="text-[7px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full ml-2 border border-yellow-500/20 font-black">SUPER</span>}
                        </p>
                        <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">@{admin.username}</p>
                      </div>
                    </div>
                    {admin.id !== '1' && (
                      <button
                        onClick={() => deleteAdminHandler(admin.id)}
                        className="p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'ENGINEER_PROFILE' && selectedEngineer && (
          <div className="space-y-10 animate-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('ENGINEER_LOOKUP')} className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Search
              </button>
              <div className={`px-5 py-2 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] shadow-xl ${getTierColor(selectedEngineer.tier)}`}>
                {selectedEngineer.tier} Tier
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <img src={selectedEngineer.photoUrl} className="w-40 h-40 rounded-[3rem] border-4 border-zinc-800 object-cover shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all group-hover:scale-105" alt={selectedEngineer.name} />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-black font-black px-8 py-3 rounded-2xl text-4xl shadow-[0_15px_30px_rgba(255,255,255,0.15)] flex flex-col items-center border border-zinc-300 transform group-hover:-translate-y-1 transition-transform">
                  <span className="tracking-tighter">{selectedEngineer.tcsScore}</span>
                  <span className="text-[10px] uppercase -mt-2 opacity-50 tracking-[0.1em] font-black">Total TCS</span>
                </div>
              </div>
              <div className="text-center mt-10">
                <h2 className="text-4xl font-black tracking-tight uppercase text-white/90">{selectedEngineer.name}</h2>
                <p className="text-sm text-zinc-500 font-mono tracking-[0.5em] uppercase mt-2 opacity-80">{selectedEngineer.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 p-5 rounded-3xl border border-white/5 flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-blue-600/10 rounded-2xl">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[9px] uppercase text-zinc-600 font-black tracking-widest">Active Cycle</p>
                  <p className="font-black text-sm text-white/90 uppercase">{selectedEngineer.month} {selectedEngineer.year}</p>
                </div>
              </div>
              <div className="bg-zinc-900/60 p-5 rounded-3xl border border-white/5 flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-purple-600/10 rounded-2xl">
                  <Layers className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-[9px] uppercase text-zinc-600 font-black tracking-widest">Global Index</p>
                  <p className="font-black text-sm text-white/90">#{sortedEngineers.findIndex(e => e.id === selectedEngineer.id) + 1} / {engineers.length}</p>
                </div>
              </div>
            </div>

            <section className="bg-zinc-900/40 rounded-[3rem] p-8 border border-white/5 space-y-10 shadow-3xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-500" /> Audit Findings
                </h3>
                <span className="text-[10px] text-zinc-700 font-mono font-black tracking-widest">V7.2_FINAL</span>
              </div>
              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Engineer Evaluation Pillar (50%)</h4>
                    <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Performance Weighting</div>
                  </div>
                  <div className="grid grid-cols-1 gap-8 bg-black/40 p-7 rounded-[2rem] border border-white/5 shadow-inner">
                    <MetricBar label="Training Attendance" value={selectedEngineer.trainingAttendance} suffix="%" color="bg-green-600" />
                    <div className="space-y-6 pt-4 border-t border-white/5">
                      <MetricBar label="Repeated Repair (RRR)" value={selectedEngineer.repeatedRepairRatio} suffix="%" inverse />
                      <MetricBar label="Same Symptom Redo (SSR)" value={selectedEngineer.sameSymptomRedoRatio} suffix="%" inverse />
                      <MetricBar label="IQC Skip Ratio" value={selectedEngineer.iqcSkipRatio} suffix="%" inverse />
                      <MetricBar label="OQC First Fail Ratio" value={selectedEngineer.oqcFirstTimeFailRatio} suffix="%" inverse />
                    </div>
                    <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-6">
                      <MetricBar label="Core Parts Used" value={selectedEngineer.corePartsUsed} suffix="%" inverse />
                      <MetricBar label="Multi Parts Used" value={selectedEngineer.multiPartsUsed} suffix="%" inverse />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 pt-6 border-t border-white/5">
                  <MetricBar label="TCS Exam Performance (30%)" value={selectedEngineer.examScore} suffix=" pts" color="bg-blue-600" />
                  <MetricBar label="Monthly RNPS Score (20%)" value={selectedEngineer.monthlyRNPS} suffix=" pts" color="bg-yellow-600" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Upsert Modal (Manual Entry) */}
        {editingEng && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[3.5rem] p-10 shadow-3xl max-h-[92vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white/90">
                  {editingEng.id ? 'Modify Record' : 'Create Record'}
                </h2>
                <button onClick={() => setEditingEng(null)} className="p-3.5 bg-zinc-800 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all shadow-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Photo Edit Section */}
              <div className="flex flex-col items-center mb-10 group">
                <div
                  className="relative w-32 h-32 rounded-[2rem] border-4 border-zinc-800 overflow-hidden cursor-pointer shadow-2xl transition-all hover:border-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={editingEng.photoUrl} className="w-full h-full object-cover" alt="Profile" />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[8px] font-black uppercase text-white tracking-widest">Update</span>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <p className="text-[10px] text-zinc-600 mt-4 font-black uppercase tracking-widest">Engineer Identification Photo</p>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-4">Audit Period (Month & Year)</label>
                    <div className="flex gap-3">
                      <input className="flex-1 bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none font-bold" value={editingEng.month} onChange={e => setEditingEng({ ...editingEng, month: e.target.value })} placeholder="Month" />
                      <input className="w-32 bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none font-bold" value={editingEng.year} onChange={e => setEditingEng({ ...editingEng, year: e.target.value })} placeholder="Year" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-4">Full Name</label>
                    <input className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" value={editingEng.name} onChange={e => setEditingEng({ ...editingEng, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-4">Engineer Code</label>
                    <input className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none" value={editingEng.code} onChange={e => setEditingEng({ ...editingEng, code: e.target.value.toUpperCase() })} />
                  </div>
                </div>

                <div className="space-y-8 bg-black/50 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] border-b border-zinc-800 pb-4 mb-6">Primary Scoring Metrics</h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase ml-3">Exam (30%) (+)</label>
                      <input type="number" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm font-bold focus:border-white transition-all outline-none" value={editingEng.examScore} onChange={e => setEditingEng({ ...editingEng, examScore: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase ml-3">RNPS (20%) (+)</label>
                      <input type="number" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm font-bold focus:border-white transition-all outline-none" value={editingEng.monthlyRNPS} onChange={e => setEditingEng({ ...editingEng, monthlyRNPS: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>

                  <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] pt-6">Engineer Evaluation (50%)</h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase ml-3">Training Attendance (+)</label>
                      <input type="number" step="0.1" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm font-bold focus:border-white transition-all outline-none" value={editingEng.trainingAttendance} onChange={e => setEditingEng({ ...editingEng, trainingAttendance: parseFloat(e.target.value) || 0 })} />
                    </div>
                    {[
                      { k: 'repeatedRepairRatio', l: 'RRR % (-)' },
                      { k: 'sameSymptomRedoRatio', l: 'SSR % (-)' },
                      { k: 'iqcSkipRatio', l: 'IQC Skip % (-)' },
                      { k: 'oqcFirstTimeFailRatio', l: 'OQC Fail % (-)' },
                      { k: 'corePartsUsed', l: 'Core Parts (-)' },
                      { k: 'multiPartsUsed', l: 'Multi Parts (-)' },
                    ].map(item => (
                      <div key={item.k} className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-3">{item.l}</label>
                        <input type="number" step="0.1" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm font-bold focus:border-white transition-all outline-none" value={editingEng[item.k]} onChange={e => setEditingEng({ ...editingEng, [item.k]: parseFloat(e.target.value) || 0 })} />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => saveEngineer(editingEng)}
                  disabled={isSaving}
                  className={`w-full py-6 rounded-3xl font-black text-lg flex items-center justify-center gap-4 transition-all uppercase tracking-[0.3em] shadow-3xl ${isSaving ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-50 hover:bg-blue-500 active:scale-[0.98] shadow-blue-900/40'}`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                      SECURELY SAVING...
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" /> Commit Record
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-sm bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-5 px-10 flex justify-around items-center shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50">
        <button onClick={() => setView('HOME')} className={`flex flex-col items-center gap-2 transition-all ${view === 'HOME' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <BarChart3 className={`w-6 h-6 ${view === 'HOME' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.1em]">Status</span>
        </button>
        <button onClick={() => setView('ENGINEER_LOOKUP')} className={`flex flex-col items-center gap-2 transition-all ${view === 'ENGINEER_LOOKUP' || view === 'ENGINEER_PROFILE' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
          <Search className={`w-6 h-6 ${view === 'ENGINEER_LOOKUP' || view === 'ENGINEER_PROFILE' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-[0.1em]">Search</span>
        </button>
        <button onClick={() => setView(currentUser ? 'ADMIN_DASHBOARD' : 'ADMIN_LOGIN')} className={`flex flex-col items-center gap-2 transition-all ${view === 'ADMIN_LOGIN' || view === 'ADMIN_DASHBOARD' || view === 'PROFILE_MGMT' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
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
