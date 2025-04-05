import supabase from './supabaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc, arrayUnion, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Constants
const MODELS_BUCKET = 'models';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Initialize the storage bucket if it doesn't exist
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export const initializeStorage = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const modelsBucketExists = buckets?.some(bucket => bucket.name === MODELS_BUCKET);

    if (!modelsBucketExists) {
      const { error } = await supabase.storage.createBucket(MODELS_BUCKET, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE
      });
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.error('Storage initialization error:', error);
    return false;
  }
};

/**
 * Upload a 3D model file (.glb) to Supabase Storage
 * @param {File} file - The file object to upload
 * @param {string} designerId - The ID of the designer who created the model
 * @param {string} projectId - The ID of the project (proposal ID)
 * @returns {Promise<{url: string, fileName: string, fileId: string}>} - The download URL and metadata
 */
export const uploadModelFile = async (file, designerId, projectId) => {
  try {
    if (!file || !designerId || !projectId) {
      throw new Error('Missing required parameters for file upload');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    if (!file.name.toLowerCase().endsWith('.glb')) {
      throw new Error('Only .glb 3D model files are supported');
    }

    const fileId = uuidv4();
    const fileName = `${fileId}_${file.name}`;
    const filePath = `${designerId}/${projectId}/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(MODELS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(MODELS_BUCKET)
      .getPublicUrl(filePath);

    // Store file metadata in Firestore
    const projectRef = doc(db, 'designProposals', projectId);
    await updateDoc(projectRef, {
      modelFiles: arrayUnion({
        fileId,
        fileName: file.name,
        url: publicUrl,
        uploadedAt: new Date(),
        size: file.size,
      }),
      projectStatus: 'completed_by_designer'
    });

    return {
      url: publicUrl,
      fileName: file.name,
      fileId
    };
  } catch (error) {
    console.error('Error uploading model file:', error);
    throw error;
  }
};

/**
 * Delete a model file from Supabase Storage
 * @param {string} designerId - The ID of the designer who created the model
 * @param {string} projectId - The ID of the project
 * @param {string} fileName - The name of the file to delete
 * @returns {Promise<void>}
 */
export const deleteModelFile = async (designerId, projectId, fileName) => {
  try {
    const filePath = `${designerId}/${projectId}/${fileName}`;

    // Delete the file from Supabase storage
    const { error } = await supabase.storage
      .from(MODELS_BUCKET)
      .remove([filePath]);

    if (error) throw error;

    // Update Firestore to remove the file reference
    const projectRef = doc(db, 'designProposals', projectId);
    const projectDoc = await getDoc(projectRef);

    if (projectDoc.exists()) {
      const projectData = projectDoc.data();
      const updatedFiles = (projectData.modelFiles || []).filter(
        file => file.fileName !== fileName
      );

      await updateDoc(projectRef, {
        modelFiles: updatedFiles
      });
    }
  } catch (error) {
    console.error('Error deleting model file:', error);
    throw error;
  }
};

/**
 * Transfer funds from client to designer when project is completed
 * @param {string} clientId - The ID of the client
 * @param {string} designerId - The ID of the designer
 * @param {number} amount - The amount to transfer
 * @returns {Promise<boolean>} - Whether the transfer was successful
 */
export const transferFundsToDesigner = async (clientId, designerId, amount) => {
  try {
    // Get client's current balance
    const clientRef = doc(db, 'users', clientId);
    const clientDoc = await getDoc(clientRef);

    if (!clientDoc.exists()) {
      throw new Error('Client not found');
    }

    const clientData = clientDoc.data();
    const clientBalance = clientData.balance || 0;

    // Ensure client has enough balance
    if (clientBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Get designer's current balance
    const designerRef = doc(db, 'users', designerId);
    const designerDoc = await getDoc(designerRef);

    if (!designerDoc.exists()) {
      throw new Error('Designer not found');
    }

    const designerData = designerDoc.data();
    const designerBalance = designerData.balance || 0;

    // Update client's balance (deduct amount)
    await updateDoc(clientRef, {
      balance: clientBalance - amount
    });

    // Update designer's balance (add amount)
    await updateDoc(designerRef, {
      balance: designerBalance + amount
    });

    // Record the transaction
    await addTransaction(clientId, designerId, amount, 'project_payment');

    return true;
  } catch (error) {
    console.error('Error transferring funds:', error);
    throw error;
  }
};

/**
 * Add a transaction record to Firestore
 * @param {string} fromUserId - The ID of the user sending funds
 * @param {string} toUserId - The ID of the user receiving funds
 * @param {number} amount - The amount transferred
 * @param {string} type - The type of transaction
 * @returns {Promise<void>}
 */
const addTransaction = async (fromUserId, toUserId, amount, type) => {
  try {
    const transactionId = uuidv4();
    const transactionRef = doc(db, 'transactions', transactionId);

    await setDoc(transactionRef, {
      fromUserId,
      toUserId,
      amount,
      type,
      timestamp: new Date(),
      status: 'completed'
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }
};