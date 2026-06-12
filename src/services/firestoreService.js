import { db } from '../firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const ENGINEERS_COLLECTION = 'engineers';
const ADMINS_COLLECTION = 'admins';
const TCS_DASHBOARD_WINNERS_COLLECTION = 'tcs_dashboard_winners';

/** Only these collections may be archived from the admin UI (prevents arbitrary path writes). */
const ALLOWED_ENGINEER_COLLECTIONS = new Set([
  'engineers',
  'tcs_mx_receptionists',
  'tcs_mx_galaxy_consultants',
  'tcs_da_engineers',
  'tcs_vd_engineers',
  'pqa_mx_centers',
  'pqa_ce_centers',
]);

// Engineers
export const getEngineers = async (collectionName = ENGINEERS_COLLECTION) => {
    const snapshot = await getDocs(collection(db, collectionName));
    // Filter out soft-deleted items (where hidden === true)
    // We do this in JS to handle legacy docs that might not have the 'hidden' field at all.
    return snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(eng => !eng.hidden);
};

export const getHiddenEngineers = async (collectionName = ENGINEERS_COLLECTION) => {
    const snapshot = await getDocs(collection(db, collectionName));
    // Filter out soft-deleted items (where hidden === true)
    // We do this in JS to handle legacy docs that might not have the 'hidden' field at all.
    return snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(eng => eng.hidden);
};

export const saveEngineer = async (engineer, collectionName = ENGINEERS_COLLECTION) => {
    if (engineer.id && engineer.id.length > 15) { // Firestore IDs are typically 20 chars. Date.now() is 13.
        try {
            const docRef = doc(db, collectionName, engineer.id);
            await setDoc(docRef, engineer, { merge: true });
            return engineer.id;
        } catch (e) {
            console.error("Error saving engineer: ", e);
            throw e;
        }
    } else {
        // Create new
        const docRef = await addDoc(collection(db, collectionName), engineer);
        return docRef.id;
    }
};

export const archiveEngineer = async (id, collectionName = ENGINEERS_COLLECTION) => {
    if (!ALLOWED_ENGINEER_COLLECTIONS.has(collectionName)) {
        throw new Error('Invalid engineer collection');
    }
    const engineerRef = doc(db, collectionName, id);
    await updateDoc(engineerRef, { hidden: true });
};

export const deleteEngineerPermanent = async (id, collectionName = ENGINEERS_COLLECTION) => {
    await deleteDoc(doc(db, collectionName, id));
};


// Admins
export const getAdmins = async () => {
    const snapshot = await getDocs(collection(db, ADMINS_COLLECTION));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const saveAdmin = async (admin) => {
    if (admin.id) {
        const docRef = doc(db, ADMINS_COLLECTION, admin.id);
        await setDoc(docRef, admin, { merge: true });
        return admin.id;
    } else {
        const docRef = await addDoc(collection(db, ADMINS_COLLECTION), admin);
        return docRef.id;
    }
};

export const deleteAdmin = async (id) => {
    await deleteDoc(doc(db, ADMINS_COLLECTION, id));
};

// TCS Dashboard Winners (Top 6 by quarter/product)
export const getTcsDashboardWinners = async () => {
    const snapshot = await getDocs(collection(db, TCS_DASHBOARD_WINNERS_COLLECTION));
    return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const saveTcsDashboardWinners = async (payload) => {
    const quarterKey = String(payload?.quarterKey || '').toUpperCase().trim();
    const product = String(payload?.product || '').toUpperCase().trim();
    if (!/^Q[1-4]-\d{4}$/.test(quarterKey)) {
        throw new Error('Invalid quarterKey. Expected format Q1-2026.');
    }
    if (!['MX', 'DA', 'AV'].includes(product)) {
        throw new Error('Invalid product. Expected MX, DA, or AV.');
    }
    const winners = Array.isArray(payload?.winners)
        ? payload.winners.map((code) => String(code || '').trim()).filter(Boolean)
        : [];
    if (winners.length !== 0 && winners.length !== 6) {
        throw new Error('Provide exactly 6 winner engineer codes, or 0 codes to clear.');
    }
    const docId = `${quarterKey}-${product}`;
    const docRef = doc(db, TCS_DASHBOARD_WINNERS_COLLECTION, docId);
    const normalizedPayload = {
        quarterKey,
        product,
        winners,
        updatedAt: new Date().toISOString(),
        updatedBy: payload?.updatedBy || 'admin',
    };
    await setDoc(docRef, normalizedPayload, { merge: true });
    return docId;
};

// Feedback
const FEEDBACK_COLLECTION = 'feedback';
/** Firestore folder-like path:
 *  samsung_academy_survey (collection) / records (doc) / responses (subcollection)
 */
const SAMSUNG_ACADEMY_SURVEY_ROOT = 'samsung_academy_survey';
const SAMSUNG_ACADEMY_SURVEY_DOC = 'records';
const SAMSUNG_ACADEMY_SURVEYS_SUBCOLLECTION = 'responses';

export const saveFeedback = async (feedbackData) => {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
        ...feedbackData,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
};

export const getFeedbacks = async () => {
    const snapshot = await getDocs(collection(db, FEEDBACK_COLLECTION));
    return snapshot.docs
        .map((item) => ({ ...item.data(), id: item.id }))
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
};

/** Whether the floating Samsung Academy survey shortcut is shown on the TCS portal (default: on). */
export const getAcademySurveySettings = async () => {
    const snap = await getDoc(doc(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC));
    if (!snap.exists()) {
        return { academySurveyPopupEnabled: true, feedbackEnabled: true };
    }
    const data = snap.data() || {};
    return {
        academySurveyPopupEnabled: data.academySurveyPopupEnabled !== false,
        feedbackEnabled: data.feedbackEnabled !== false,
        updatedAt: data.updatedAt || null,
        updatedBy: data.updatedBy || null,
    };
};

export const saveAcademySurveySettings = async (settings, updatedBy = 'admin') => {
    await setDoc(
        doc(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC),
        {
            type: 'SAMSUNG_ACADEMY_SURVEY_CONTAINER',
            updatedAt: new Date().toISOString(),
            updatedBy,
            ...settings,
        },
        { merge: true }
    );
};

export const saveSamsungAcademySurvey = async (surveyData) => {
    // Ensure root document exists so the structure is clear in Firebase console.
    await setDoc(doc(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC), {
        updatedAt: new Date().toISOString(),
        type: 'SAMSUNG_ACADEMY_SURVEY_CONTAINER',
    }, { merge: true });

    const docRef = await addDoc(collection(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC, SAMSUNG_ACADEMY_SURVEYS_SUBCOLLECTION), {
        ...surveyData,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
};

export const getSamsungAcademySurveys = async () => {
    const snapshot = await getDocs(collection(db, SAMSUNG_ACADEMY_SURVEY_ROOT, SAMSUNG_ACADEMY_SURVEY_DOC, SAMSUNG_ACADEMY_SURVEYS_SUBCOLLECTION));
    return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

