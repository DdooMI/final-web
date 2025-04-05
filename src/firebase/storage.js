import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc, arrayUnion, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Upload a design file (HTML or 3D model) to Firebase Storage
 * @param {File} file - The file object to upload
 * @param {string} designerId - The ID of the designer who created the model
 * @param {string} projectId - The ID of the project (proposal ID)
 * @param {string} fileType - The type of file ('html' or '3d')
 * @returns {Promise<{url: string, fileName: string, fileId: string}>} - The download URL and metadata
 */
export const uploadModelFile = async (file, designerId, projectId, fileType = 'html') => {
  try {
    if (!file || !designerId || !projectId) {
      throw new Error('Missing required parameters for file upload');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Validate file extension based on type
    const isValidFile = fileType === 'html' 
      ? (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm'))
      : file.name.toLowerCase().endsWith('.glb');
      
    if (!isValidFile) {
      throw new Error(`Only ${fileType === 'html' ? '.html/.htm' : '.glb'} files are supported`);
    }

    const fileId = uuidv4();
    const fileName = `${fileId}_${file.name}`;
    const filePath = `models/${designerId}/${projectId}/${fileName}`;
    
    // Create a reference to the file location in Firebase Storage
    const fileRef = ref(storage, filePath);
    
    // Upload file to Firebase Storage
    await uploadBytes(fileRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(fileRef);

    // Store file metadata in Firestore
    const projectRef = doc(db, 'designProposals', projectId);
    await updateDoc(projectRef, {
      modelFiles: arrayUnion({
        fileId,
        fileName: file.name,
        url: downloadURL,
        uploadedAt: new Date(),
        size: file.size,
        fileType: fileType // Store the file type
      }),
      projectStatus: 'completed_by_designer'
    });

    return {
      url: downloadURL,
      fileName: file.name,
      fileId
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a model file from Firebase Storage
 * @param {string} designerId - The ID of the designer who created the model
 * @param {string} projectId - The ID of the project
 * @param {string} fileName - The name of the file to delete
 * @returns {Promise<void>}
 */
export const deleteModelFile = async (designerId, projectId, fileName) => {
  try {
    const filePath = `models/${designerId}/${projectId}/${fileName}`;
    
    // Create a reference to the file
    const fileRef = ref(storage, filePath);
    
    // Delete the file from Firebase Storage
    await deleteObject(fileRef);

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
