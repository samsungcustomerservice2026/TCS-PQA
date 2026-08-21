/**
 * Technical Consultants Firestore + Storage service.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import {
  CONSULTANT_FIRESTORE,
  CONSULTANT_STATUS,
  CONSULTANT_STORAGE_PREFIX,
  CONSULTANT_ALLOWED_EXT,
  consultantMatchesProductLine,
} from '../lib/consultants/constants';
import {
  createAnnouncementFromConsultant,
  createEmptyConsultant,
  createEmptyProgress,
  finalizeAttempt,
  progressDocId,
  startAttempt,
  validateConsultant,
} from '../lib/consultants/schema';
import {
  listActiveAnnouncements,
  retrieveConsultantForGoGo,
  searchConsultantsForQuestion,
} from '../lib/consultants/retrieval';

const {
  consultants: CONSULTANTS,
  announcements: ANNOUNCEMENTS,
  progress: PROGRESS,
} = CONSULTANT_FIRESTORE;

function consultantsCol() {
  return collection(db, CONSULTANTS);
}

function announcementsCol() {
  return collection(db, ANNOUNCEMENTS);
}

function progressCol() {
  return collection(db, PROGRESS);
}

function extOf(name = '') {
  const m = String(name).toLowerCase().match(/(\.[a-z0-9]+)$/);
  return m ? m[1] : '';
}

function isImageExt(name = '') {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Compress image in-browser so it fits Firestore (~1MB doc limit). */
async function compressImageForFirestore(file, maxBytes = 750_000) {
  if (!isImageExt(file.name) && !(file.type || '').startsWith('image/')) {
    throw new Error('Not an image');
  }
  if ((file.size || 0) <= maxBytes && (file.size || 0) > 0) {
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl.length <= maxBytes * 1.37) return dataUrl;
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > maxBytes * 1.37 && quality > 0.4) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > maxBytes * 1.37) {
    throw new Error('Photo is too large even after compression. Use a smaller image (under ~1 MB).');
  }
  return dataUrl;
}

export function isAllowedConsultantFile(file) {
  if (!file?.name) return false;
  return CONSULTANT_ALLOWED_EXT.includes(extOf(file.name));
}

export async function listConsultants({ status = null, max = 200 } = {}) {
  try {
    const snap = await getDocs(query(consultantsCol(), limit(max)));
    let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    return rows;
  } catch (err) {
    console.warn('listConsultants failed:', err?.message || err);
    return [];
  }
}

export async function listPublishedConsultants({ productLine = null } = {}) {
  const rows = await listConsultants({ status: CONSULTANT_STATUS.PUBLISHED });
  if (!productLine) return rows;
  return rows.filter((c) => consultantMatchesProductLine(c, productLine));
}

export async function getConsultant(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, CONSULTANTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function upsertConsultant(record, { actor = 'admin' } = {}) {
  const now = new Date().toISOString();
  const base = record?.id
    ? { ...record }
    : createEmptyConsultant({ ...record, actor });
  const next = {
    ...base,
    ...record,
    id: base.id,
    updatedAt: now,
    updatedBy: actor,
    createdAt: base.createdAt || now,
    createdBy: base.createdBy || actor,
  };
  const { ok, errors } = validateConsultant(next);
  if (!ok) throw new Error(errors.join('; '));
  await setDoc(doc(db, CONSULTANTS, next.id), next, { merge: true });
  return next;
}

export async function deleteConsultant(id) {
  const existing = await getConsultant(id);
  if (!existing) return;
  for (const asset of existing.assets || []) {
    if (asset?.storagePath) {
      try {
        await deleteObject(ref(storage, asset.storagePath));
      } catch {
        /* ignore missing */
      }
    }
  }
  if (existing.announcementId) {
    try {
      await deleteDoc(doc(db, ANNOUNCEMENTS, existing.announcementId));
    } catch {
      /* ignore */
    }
  }
  await deleteDoc(doc(db, CONSULTANTS, id));
}

export async function uploadConsultantAsset(consultantId, file, { actor = 'admin' } = {}) {
  if (!isAllowedConsultantFile(file)) {
    throw new Error('Only PDF, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG, WEBP, or GIF files are allowed');
  }
  const consultant = await getConsultant(consultantId);
  if (!consultant) throw new Error('Consultant not found — create/save the draft first');

  const safeName = String(file.name || 'file')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 120);
  const storagePath = `${CONSULTANT_STORAGE_PREFIX}/${consultantId}/${Date.now()}_${safeName}`;
  let url = '';
  let storedPath = storagePath;
  let mime = file.type || 'application/octet-stream';
  let storedAs = 'storage';

  try {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: mime,
    });
    url = await getDownloadURL(storageRef);
  } catch (err) {
    const msg = err?.message || String(err);
    const storageBlocked = /unauthorized|permission|storage\/unauthorized/i.test(msg);
    const canEmbed =
      isImageExt(file.name) || String(mime).startsWith('image/');

    if (!canEmbed) {
      if (storageBlocked) {
        throw new Error(
          'Firebase Storage blocked the upload. For photos, retry — images can be saved without Storage. For PDF/Office, update Storage rules under consultants/.',
        );
      }
      throw new Error(`Upload failed: ${msg}`);
    }

    // Fallback: embed compressed photo in Firestore so employees can see it.
    try {
      url = await compressImageForFirestore(file);
      storedPath = '';
      mime = 'image/jpeg';
      storedAs = 'firestore';
    } catch (embedErr) {
      throw new Error(
        `Photo upload failed (${storageBlocked ? 'Storage blocked' : msg}). ${embedErr?.message || ''}`,
      );
    }
  }

  const asset = {
    id: `asset_${Date.now().toString(36)}`,
    fileName: storedAs === 'firestore' ? safeName.replace(/\.[^.]+$/, '.jpg') : file.name,
    mime,
    size: file.size || 0,
    storagePath: storedPath,
    url,
    storedAs,
    uploadedAt: new Date().toISOString(),
    uploadedBy: actor,
  };
  const assets = [...(consultant.assets || []), asset];
  return upsertConsultant({ ...consultant, assets }, { actor });
}

async function extractSearchText(consultant) {
  const assets = consultant.assets || [];
  if (!assets.length) return { searchText: '', extractStatus: 'empty' };

  const parts = [];
  for (const asset of assets) {
    try {
      const res = await fetch('/api/consultants/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: asset.url,
          fileName: asset.fileName,
          mime: asset.mime,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.text) parts.push(String(data.text));
    } catch (err) {
      console.warn('extract failed for', asset.fileName, err?.message || err);
    }
  }

  const searchText = parts.join('\n\n').replace(/\s+/g, ' ').trim().slice(0, 80_000);
  return {
    searchText,
    extractStatus: searchText ? 'ready' : 'failed',
  };
}

export async function publishConsultant(id, { actor = 'admin', reindex = true } = {}) {
  const consultant = await getConsultant(id);
  if (!consultant) throw new Error('Consultant not found');

  const hasFiles = (consultant.assets || []).length > 0;
  const hasText =
    String(consultant.summary_en || '').trim() ||
    String(consultant.summary_ar || '').trim() ||
    String(consultant.title_en || '').trim();
  if (!hasFiles && !hasText) {
    throw new Error('Add a title/summary or upload a file before publishing / pushing');
  }

  let extract = {
    searchText: consultant.searchText || '',
    extractStatus: consultant.extractStatus || 'pending',
  };

  // Text-only tips: index from title + summary so GOGO can retrieve them.
  if (!hasFiles) {
    const textParts = [
      consultant.title_en,
      consultant.title_ar,
      consultant.summary_en,
      consultant.summary_ar,
      ...(consultant.tags || []),
    ]
      .map((t) => String(t || '').trim())
      .filter(Boolean);
    extract = {
      searchText: textParts.join('\n').slice(0, 80_000),
      extractStatus: 'text_only',
    };
  } else if (reindex) {
    try {
      const raced = await Promise.race([
        extractSearchText(consultant),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                searchText:
                  consultant.searchText ||
                  [consultant.title_en, consultant.summary_en].filter(Boolean).join('\n'),
                extractStatus: 'timeout',
              }),
            20_000,
          ),
        ),
      ]);
      extract = raced;
      if (!extract.searchText) {
        extract = {
          searchText: [consultant.title_en, consultant.summary_en].filter(Boolean).join('\n'),
          extractStatus: extract.extractStatus || 'partial',
        };
      }
    } catch (err) {
      console.warn('publish extract skipped:', err?.message || err);
      extract = {
        searchText: [consultant.title_en, consultant.summary_en].filter(Boolean).join('\n'),
        extractStatus: 'failed',
      };
    }
  }

  const announcement = createAnnouncementFromConsultant(
    { ...consultant, ...extract },
    actor,
  );
  await setDoc(doc(db, ANNOUNCEMENTS, announcement.id), announcement, { merge: true });

  const now = new Date().toISOString();
  const published = {
    ...consultant,
    ...extract,
    status: CONSULTANT_STATUS.PUBLISHED,
    mustComplete: consultant.mustComplete !== false,
    publishedAt: consultant.publishedAt || now,
    announcementId: announcement.id,
    updatedAt: now,
    updatedBy: actor,
  };
  await setDoc(doc(db, CONSULTANTS, id), published, { merge: true });
  return { consultant: published, announcement };
}

export async function unpublishConsultant(id, { actor = 'admin' } = {}) {
  const consultant = await getConsultant(id);
  if (!consultant) throw new Error('Consultant not found');
  if (consultant.announcementId) {
    await setDoc(
      doc(db, ANNOUNCEMENTS, consultant.announcementId),
      { active: false, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  }
  return upsertConsultant(
    {
      ...consultant,
      status: CONSULTANT_STATUS.DRAFT,
      announcementId: consultant.announcementId || null,
    },
    { actor },
  );
}

export async function archiveConsultant(id, { actor = 'admin' } = {}) {
  const consultant = await getConsultant(id);
  if (!consultant) throw new Error('Consultant not found');
  if (consultant.announcementId) {
    await setDoc(
      doc(db, ANNOUNCEMENTS, consultant.announcementId),
      { active: false, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  }
  return upsertConsultant(
    { ...consultant, status: CONSULTANT_STATUS.ARCHIVED },
    { actor },
  );
}

export async function listAnnouncements({ activeOnly = true, max = 100 } = {}) {
  try {
    const snap = await getDocs(query(announcementsCol(), limit(max)));
    let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (activeOnly) rows = listActiveAnnouncements(rows);
    else rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return rows;
  } catch (err) {
    console.warn('listAnnouncements failed:', err?.message || err);
    return [];
  }
}

export async function getProgress(uid, consultantId) {
  const id = progressDocId(uid, consultantId);
  const snap = await getDoc(doc(db, PROGRESS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listProgressForUser(uid, { max = 200 } = {}) {
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(progressCol(), where('uid', '==', uid), limit(max)),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('listProgressForUser failed:', err?.message || err);
    return [];
  }
}

export async function listAllProgress({ max = 2000 } = {}) {
  try {
    const snap = await getDocs(query(progressCol(), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('listAllProgress failed:', err?.message || err);
    return [];
  }
}

export async function beginConsultantAttempt(uid, consultant) {
  if (!uid || !consultant?.id) throw new Error('Missing uid or consultant');
  let progress = await getProgress(uid, consultant.id);
  if (!progress) {
    progress = createEmptyProgress({
      uid,
      consultantId: consultant.id,
      consultantTitle: consultant.title_en || consultant.id,
    });
  }
  // Already passed — do not start a new graded attempt (review-only revisit).
  if (progress.bestResult === 'passed') {
    if (progress.currentAttempt) {
      progress = {
        ...progress,
        currentAttempt: null,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, PROGRESS, progress.id), progress, { merge: true });
    }
    return progress;
  }
  // Resume existing open attempt instead of nesting a new one.
  if (progress.currentAttempt) {
    return progress;
  }
  progress = startAttempt(progress, { minDwellSeconds: consultant.minDwellSeconds });
  await setDoc(doc(db, PROGRESS, progress.id), progress, { merge: true });
  return progress;
}

/** Clear a leftover in-progress attempt after a pass (keeps Passed tab accurate). */
export async function clearStaleAttemptIfPassed(uid, consultantId) {
  if (!uid || !consultantId) return null;
  const progress = await getProgress(uid, consultantId);
  if (!progress || progress.bestResult !== 'passed' || !progress.currentAttempt) return progress;
  const next = {
    ...progress,
    currentAttempt: null,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, PROGRESS, next.id), next, { merge: true });
  return next;
}

export async function heartbeatConsultantAttempt(
  uid,
  consultantId,
  { dwellSeconds, clickCount } = {},
) {
  const progress = await getProgress(uid, consultantId);
  if (!progress?.currentAttempt) return progress;
  const next = {
    ...progress,
    currentAttempt: {
      ...progress.currentAttempt,
      dwellSeconds: Math.max(0, Math.floor(Number(dwellSeconds) || 0)),
      clickCount: Math.max(0, Math.floor(Number(clickCount) || 0)),
    },
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, PROGRESS, next.id), next, { merge: true });
  return next;
}

export async function completeConsultantAttempt(
  uid,
  consultant,
  { dwellSeconds, clickCount, forceFail = false } = {},
) {
  let progress = await getProgress(uid, consultant.id);
  if (!progress) {
    progress = createEmptyProgress({
      uid,
      consultantId: consultant.id,
      consultantTitle: consultant.title_en || consultant.id,
    });
    progress = startAttempt(progress, { minDwellSeconds: consultant.minDwellSeconds });
  }
  if (!progress.currentAttempt) {
    progress = startAttempt(progress, { minDwellSeconds: consultant.minDwellSeconds });
  }

  const minDwell = Number(consultant.minDwellSeconds) || Number(progress.currentAttempt.minDwellSeconds) || 300;
  const dwell = Math.max(0, Math.floor(Number(dwellSeconds) || 0));
  const clicks = Math.max(0, Math.floor(Number(clickCount) || 0));
  const passed = !forceFail && dwell >= minDwell;
  const result = passed ? 'passed' : 'failed';
  const next = finalizeAttempt(progress, { dwellSeconds: dwell, clickCount: clicks, result });
  await setDoc(doc(db, PROGRESS, next.id), next, { merge: true });
  return {
    progress: next,
    passed,
    remainingSeconds: Math.max(0, minDwell - dwell),
    minDwellSeconds: minDwell,
  };
}

export async function buildAttendanceReport() {
  const { listEmployees } = await import('./employeeAuthService');
  const [consultants, progressRows, employees] = await Promise.all([
    listConsultants(),
    listAllProgress(),
    listEmployees({ max: 2000 }),
  ]);

  const empByUid = {};
  for (const e of employees) {
    if (e?.uid) empByUid[e.uid] = e;
  }

  const byConsultant = {};
  for (const c of consultants) {
    byConsultant[c.id] = {
      consultantId: c.id,
      title: c.title_en,
      status: c.status,
      audience: c.audience || 'all',
      minDwellSeconds: c.minDwellSeconds,
      started: 0,
      passed: 0,
      failed: 0,
      inProgress: 0,
      avgDwell: 0,
      avgClicks: 0,
      _dwellSum: 0,
      _clickSum: 0,
      _n: 0,
      attendees: [],
    };
  }

  const attendees = [];

  for (const p of progressRows) {
    const emp = empByUid[p.uid] || {};
    const result =
      p.bestResult === 'passed'
        ? 'passed'
        : p.lastResult === 'passed'
          ? 'passed'
          : p.lastResult === 'failed'
            ? 'failed'
            : p.lastResult === 'in_progress' || p.currentAttempt
              ? 'in_progress'
              : p.lastResult || 'started';

    const lastAttempt = Array.isArray(p.attempts) && p.attempts.length
      ? p.attempts[p.attempts.length - 1]
      : null;

    const attendee = {
      uid: p.uid,
      gspnId: emp.gspnId || '',
      email: emp.email || '',
      phone: emp.phone || '',
      productLine: emp.productLine || '',
      displayName: emp.displayName || emp.gspnId || emp.email || p.uid,
      consultantId: p.consultantId,
      courseTitle: p.consultantTitle || byConsultant[p.consultantId]?.title || p.consultantId,
      result,
      bestResult: p.bestResult || result,
      lastResult: p.lastResult || result,
      attempts: Array.isArray(p.attempts) ? p.attempts.length : 0,
      totalDwellSeconds: Number(p.totalDwellSeconds) || 0,
      totalClicks: Number(p.totalClicks) || 0,
      lastDwellSeconds: Number(lastAttempt?.dwellSeconds) || Number(p.totalDwellSeconds) || 0,
      lastClicks: Number(lastAttempt?.clickCount) || 0,
      updatedAt: p.updatedAt || lastAttempt?.endedAt || '',
      startedAt: lastAttempt?.startedAt || p.createdAt || '',
    };
    attendees.push(attendee);

    const bucket = byConsultant[p.consultantId] || {
      consultantId: p.consultantId,
      title: p.consultantTitle || p.consultantId,
      status: 'unknown',
      audience: 'all',
      minDwellSeconds: null,
      started: 0,
      passed: 0,
      failed: 0,
      inProgress: 0,
      avgDwell: 0,
      avgClicks: 0,
      _dwellSum: 0,
      _clickSum: 0,
      _n: 0,
      attendees: [],
    };
    bucket.started += 1;
    if (result === 'passed') bucket.passed += 1;
    else if (result === 'failed') bucket.failed += 1;
    else if (result === 'in_progress') bucket.inProgress += 1;
    bucket._dwellSum += Number(p.totalDwellSeconds) || 0;
    bucket._clickSum += Number(p.totalClicks) || 0;
    bucket._n += 1;
    bucket.attendees.push(attendee);
    byConsultant[p.consultantId] = bucket;
  }

  const courses = Object.values(byConsultant).map((b) => ({
    ...b,
    avgDwell: b._n ? Math.round(b._dwellSum / b._n) : 0,
    avgClicks: b._n ? Math.round(b._clickSum / b._n) : 0,
    _dwellSum: undefined,
    _clickSum: undefined,
    _n: undefined,
  }));

  attendees.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

  const totalStarted = attendees.length;
  const totalPassed = attendees.filter((a) => a.result === 'passed').length;
  const totalFailed = attendees.filter((a) => a.result === 'failed').length;
  const totalInProgress = attendees.filter((a) => a.result === 'in_progress').length;
  const uniqueEmployees = new Set(attendees.map((a) => a.uid)).size;
  const totalDwell = attendees.reduce((s, a) => s + (a.totalDwellSeconds || 0), 0);
  const totalClicks = attendees.reduce((s, a) => s + (a.totalClicks || 0), 0);

  // Last 6 calendar months for animated trend charts
  const monthKeys = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthKeys.push({
      key,
      label: d.toLocaleString('en', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  const monthly = monthKeys.map((m) => {
    const inMonth = attendees.filter((a) => {
      const raw = a.updatedAt || a.startedAt || '';
      if (!raw) return false;
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) return false;
      return dt.getFullYear() === m.year && dt.getMonth() === m.month;
    });
    return {
      key: m.key,
      label: m.label,
      started: inMonth.length,
      passed: inMonth.filter((a) => a.result === 'passed').length,
      failed: inMonth.filter((a) => a.result === 'failed').length,
      inProgress: inMonth.filter((a) => a.result === 'in_progress').length,
      dwell: inMonth.reduce((s, a) => s + (a.totalDwellSeconds || 0), 0),
      clicks: inMonth.reduce((s, a) => s + (a.totalClicks || 0), 0),
    };
  });

  return {
    courses,
    attendees,
    monthly,
    stats: {
      totalStarted,
      totalPassed,
      totalFailed,
      totalInProgress,
      uniqueEmployees,
      employeeCount: employees.length,
      passRate: totalStarted ? Math.round((totalPassed / totalStarted) * 100) : 0,
      failRate: totalStarted ? Math.round((totalFailed / totalStarted) * 100) : 0,
      avgDwell: totalStarted ? Math.round(totalDwell / totalStarted) : 0,
      avgClicks: totalStarted ? Math.round(totalClicks / totalStarted) : 0,
      totalDwell,
      totalClicks,
    },
  };
}

export async function searchConsultantLibrary(question, { limit = 5 } = {}) {
  const catalog = await listPublishedConsultants();
  return searchConsultantsForQuestion(catalog, question, { limit });
}

export async function retrieveConsultantAnswer(question, lang = 'en') {
  const catalog = await listPublishedConsultants();
  return retrieveConsultantForGoGo(catalog, question, lang);
}

export { PROGRESS_RESULT } from '../lib/consultants/constants';
