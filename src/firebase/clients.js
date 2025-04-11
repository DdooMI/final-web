import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { axiosDeleteApi } from '../axios/axiosConfig';

/**
 * Fetch all clients from Firestore
 * @returns {Promise<Array>} Array of client objects
 */
export const fetchClients = async () => {
  try {
    // Query the users collection for clients
    const clientsQuery = query(
      collection(db, "users"),
      where("role", "==", "client")
    );
    
    const querySnapshot = await getDocs(clientsQuery);
    const clientsData = [];
    
    // Process each client document
    for (const docRef of querySnapshot.docs) {
      const userData = docRef.data();
      
      // Get profileInfo document from profile collection
      const profileInfoRef = doc(db, "users", docRef.id, "profile", "profileInfo");
      const profileInfoSnap = await getDoc(profileInfoRef);
      
      let profileInfoData = {};
      if (profileInfoSnap.exists()) {
        profileInfoData = profileInfoSnap.data();
      }
      // Combine user and profile data
      clientsData.push({
        id: docRef.id,
        name: (profileInfoData.name || 'Unknown Client').trim(),
        email: userData.email,
        balance: userData.balance || 0,
        joiningDate: userData.createdAt?.toDate() || new Date(),
        role: userData.role || "client",
        rating: userData.rating || 0,
        avatar: profileInfoData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileInfoData.name || 'Client')}&background=random`
      });
    }
    
    return clientsData;
  } catch (error) {
    console.error("Firestore fetch error [Clients-001]:", error);
    throw error;
  }
};

/**
 * Get a single client by ID
 * @param {string} clientId - The ID of the client to fetch
 * @returns {Promise<Object>} Client object
 */
export const getClientById = async (clientId) => {
  try {
    const clientRef = doc(db, "users", clientId);
    const clientSnap = await getDoc(clientRef);
    
    if (!clientSnap.exists()) {
      throw new Error("Client not found");
    }
    
    const userData = clientSnap.data();
    
    // Get client profile info data
    const profileInfoRef = doc(db, "users", clientId, "profile", "profileInfo");
    const profileInfoSnap = await getDoc(profileInfoRef);
    const profileInfoData = profileInfoSnap.exists() ? profileInfoSnap.data() : {};
    
    return {
      id: clientId,
      name: (profileInfoData.name || 'Unknown Client').trim(),
      email: userData.email,
      balance: userData.balance || 0,
      joiningDate: userData.createdAt?.toDate() || new Date(),
      role: userData.role || "client",
      avatar: profileInfoData.photoURL || ``,
      ...profileInfoData
    };
  } catch (error) {
    console.error("Firestore fetch error [Client-002]:", error);
    throw error;
  }
};

/**
 * Add a new client to Firebase Authentication and Firestore
 * @param {Object} clientData - The client data to add
 * @returns {Promise<string>} The ID of the newly created client
 */
export const addClient = async (clientData) => {
  try {
    // Get password from input
    const password = clientData.password;
    
    if (!password) {
      throw new Error("Password is required");
    }
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, clientData.email, password);
    const uid = userCredential.user.uid;
    
    // Create user document in Firestore
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      email: clientData.email,
      role: "client",
      balance: clientData.balance || 0,
      rating: clientData.rating || 0,
      createdAt: serverTimestamp()
    });
    
    // Create profile document in Firestore
    const profileDocRef = doc(db, "users", uid, "profile", "profileInfo");
    await setDoc(profileDocRef, {
      name: clientData.name,
      photoURL: clientData.photoURL || ""
    });
    
    return uid;
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
};

/**
 * Update an existing client in Firestore
 * @param {string} clientId - The ID of the client to update
 * @param {Object} clientData - The client data to update
 * @returns {Promise<void>}
 */
export const updateClient = async (clientId, clientData) => {
  try {
    // Update user document in Firestore
    const userDocRef = doc(db, "users", clientId);
    await updateDoc(userDocRef, {
      balance: clientData.balance || 0,
      updatedAt: serverTimestamp()
    });
    
    // Update profile document in Firestore
    const profileDocRef = doc(db, "users", clientId, "profile", "profileInfo");
    await updateDoc(profileDocRef, {
      name: clientData.name,
      photoURL: clientData.photoURL || ""
    });
    
    return clientId;
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

/**
 * Delete a client from Firebase Authentication and Firestore
 * @param {string} clientId - The ID of the client to delete
 * @returns {Promise<void>}
 */
export const deleteClient = async (clientId) => {
    try {
        // Get user reference properly
        const userRef = doc(db, "users", clientId);
        const userSnap = await getDoc(userRef);
    
        if (!userSnap.exists()) {
          throw new Error("Designer not found in Firestore");
        }
    
        // Delete from Firestore first
        await deleteDoc(userRef);
        const profileCollection = collection(db, "users", clientId, "profile");
        const profileDocs = await getDocs(profileCollection);
        await Promise.all(profileDocs.docs.map(d => deleteDoc(d.ref)));
        try {
            const response = await axiosDeleteApi.delete(`/delete-user/${clientId}`);
            const data = response.data; 
            alert(data.message);
          } catch (err) {
            console.error(err);
            alert("Failed to delete user.");
          }
          
        
        return true;
      } catch (error) {
        console.error("Firebase operation failed [Designer-005]:", error);
        throw error;
      }
};