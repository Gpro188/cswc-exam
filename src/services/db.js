import { collection, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

// Collection References
export const collections = {
  institutions: collection(db, "institutions"),
  registrations: collection(db, "registrations"),
  previousStudents: collection(db, "previousStudents"),
  timeTable: collection(db, "timeTable")
};

// Generic Document Set (Add/Update)
export const setDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
};

// Generic Document Delete
export const deleteDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Clear an entire collection
export const clearCollection = async (collectionName, currentDataList, idField = "id") => {
  try {
    const batch = writeBatch(db);
    currentDataList.forEach((item) => {
      let id = item[idField];
      if (!id) return;
      const docRef = doc(db, collectionName, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    console.error(`Error clearing ${collectionName}:`, error);
    throw error;
  }
};

// Sync batch items to a collection
export const syncBatchToCollection = async (collectionName, items, idField = "id") => {
  try {
    const batch = writeBatch(db);
    let count = 0;
    
    // Firestore batches have a limit of 500 operations.
    // If we exceed 500, we should commit and start a new batch.
    for (let i = 0; i < items.length; i += 450) {
      const chunk = items.slice(i, i + 450);
      const chunkBatch = writeBatch(db);
      
      chunk.forEach((item) => {
        let id = item[idField];
        if (!id) return; // skip if no ID
        const docRef = doc(db, collectionName, id);
        chunkBatch.set(docRef, item);
      });
      
      await chunkBatch.commit();
      count += chunk.length;
    }
    console.log(`Synced ${count} items to ${collectionName}`);
  } catch (error) {
    console.error(`Error syncing batch to ${collectionName}:`, error);
    throw error;
  }
};
