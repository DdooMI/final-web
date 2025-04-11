import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { axiosDeleteApi } from '../axios/axiosConfig';

/**
 * Fetch all designers from Firestore
 * @returns {Promise<Array>} Array of designer objects
 */
export const fetchDesigners = async () => {
  try {
    // Query the users collection for designers
    const designersQuery = query(
      collection(db, "users"),
      where("role", "==", "designer")
    );
    
    const querySnapshot = await getDocs(designersQuery);
    const designersData = [];
    
    // Process each designer document
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
      designersData.push({
        id: docRef.id,
        name: (profileInfoData.name || 'Unknown Designer').trim(),
        email: userData.email,
        balance: userData.balance || 0,
        joiningDate: userData.createdAt?.toDate() || new Date(),
        role: userData.role || "designer",
        rating: userData.rating || 0,
        avatar: profileInfoData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileInfoData.name || 'Designer')}&background=random`
      });
    }
    
    return designersData;
  } catch (error) {
    console.error("Firestore fetch error [Designers-001]:", error);
    throw error;
  }
};

/**
 * Get a single designer by ID
 * @param {string} designerId - The ID of the designer to fetch
 * @returns {Promise<Object>} Designer object
 */
export const getDesignerById = async (designerId) => {
  try {
    const designerRef = doc(db, "users", designerId);
    const designerSnap = await getDoc(designerRef);
    
    if (!designerSnap.exists()) {
      throw new Error("Designer not found");
    }
    
    const userData = designerSnap.data();
    
    // Get designer profile info data
    const profileInfoRef = doc(db, "users", designerId, "profile", "profileInfo");
    const profileInfoSnap = await getDoc(profileInfoRef);
    const profileInfoData = profileInfoSnap.exists() ? profileInfoSnap.data() : {};
    
    return {
      id: designerId,
      name: (profileInfoData.name || 'Unknown Designer').trim(),
      email: userData.email,
      balance: userData.balance || 0,
      joiningDate: userData.createdAt?.toDate() || new Date(),
      role: userData.role || "designer",
      avatar: profileInfoData.photoURL || ``,
      ...profileInfoData
    };
  } catch (error) {
    console.error("Firestore fetch error [Designer-002]:", error);
    throw error;
  }
};

/**
 * Add a new designer to Firebase Authentication and Firestore
 * @param {Object} designerData - The designer data to add
 * @returns {Promise<string>} The ID of the newly created designer
 */
export const addDesigner = async (designerData) => {
  try {
    // Get password from input
    const password = designerData.password;
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      designerData.email,
      password
    );
    
    const userId = userCredential.user.uid;
    
    // Create the user document in Firestore
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      email: designerData.email,
      role: "designer",
      balance: designerData.balance || 0,
      createdAt: serverTimestamp()
    });
    
    // Create the profileInfo document in the profile subcollection
    const profileInfoRef = doc(db, "users", userId, "profile", "profileInfo");
    await setDoc(profileInfoRef, {
      name: designerData.name,
      photoURL: designerData.photoURL || "",
      updatedAt: serverTimestamp()
    });
    
    console.log(`Designer created with email: ${designerData.email}`);
    return userId;
  } catch (error) {
    console.error("Firebase operation failed [Designer-003]:", error);
    throw error;
  }
};

/**
 * Update an existing designer in Firestore
 * @param {string} designerId - The ID of the designer to update
 * @param {Object} designerData - The updated designer data
 * @returns {Promise<void>}
 */
export const updateDesigner = async (designerId, designerData) => {
  try {
    // Update the user document with basic properties
    const userRef = doc(db, "users", designerId);
    const updateData = {
      updatedAt: serverTimestamp()
    };
    
    // Only update these fields if they are provided
    // Email updates disabled for existing designers
// if (designerData.email) updateData.email = designerData.email;
    if (designerData.balance !== undefined) updateData.balance = designerData.balance;
    
    await updateDoc(userRef, updateData);
    
    // Update the profileInfo document
    const profileInfoRef = doc(db, "users", designerId, "profile", "profileInfo");
    const profileInfoSnap = await getDoc(profileInfoRef);
    
    const profileUpdateData = {
      updatedAt: serverTimestamp()
    };
    
    // Only update these fields if they are provided
    if (designerData.name) profileUpdateData.name = designerData.name;
    if (designerData.photoURL) profileUpdateData.photoURL = designerData.photoURL;
    
    if (profileInfoSnap.exists()) {
      // Update existing profileInfo
      await updateDoc(profileInfoRef, profileUpdateData);
    } else {
      // Create new profileInfo if it doesn't exist
      profileUpdateData.createdAt = serverTimestamp();
      await setDoc(profileInfoRef, profileUpdateData);
    }
  } catch (error) {
    console.error("Firestore operation failed [Designer-004]:", error);
    throw error;
  }
};

/**
 * Delete a designer from both Firebase Authentication and Firestore
 * @param {string} designerId - The ID of the designer to delete
 * @returns {Promise<void>}
 */
export const deleteDesigner = async (designerId) => {
  try {
    // Get user reference properly
    const userRef = doc(db, "users", designerId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("Designer not found in Firestore");
    }

    // Delete from Firestore first
    await deleteDoc(userRef);
    const profileCollection = collection(db, "users", designerId, "profile");
    const profileDocs = await getDocs(profileCollection);
    await Promise.all(profileDocs.docs.map(d => deleteDoc(d.ref)));
    try {
        const response = await axiosDeleteApi.delete(`/delete-user/${designerId}`);
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