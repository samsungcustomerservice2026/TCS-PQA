import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const ENGINEERS_COLLECTION = 'engineers';
const ADMINS_COLLECTION = 'admins';

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
    // Call the API route for soft delete
    const response = await fetch(`/api/engineers/${id}?col=${collectionName}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete engineer via API');
    }
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

// Feedback
const FEEDBACK_COLLECTION = 'feedback';

export const saveFeedback = async (feedbackData) => {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
        ...feedbackData,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
};

