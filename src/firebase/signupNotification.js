import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Creates a notification for admin users when a new user signs up
 * @param {Object} userData - The user data of the newly signed up user
 * @returns {Promise<void>}
 */
export const createSignupNotification = async (userData) => {
  try {
    // First, get all admin users
    const adminUsersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    
    const adminSnapshot = await getDocs(adminUsersQuery);
    
    // Create notifications for each admin
    const notificationPromises = adminSnapshot.docs.map(adminDoc => {
      const adminId = adminDoc.id;
      
      return addDoc(collection(db, 'notifications'), {
        userId: adminId,
        title: 'New User Registration',
        message: `${userData.username} has registered as a ${userData.role}.`,
        type: 'info',
        read: false,
        createdAt: serverTimestamp(),
        deleted: false
      });
    });
    
    await Promise.all(notificationPromises);
    console.log('Admin notifications created for new user signup');
  } catch (error) {
    console.error('Error creating signup notification:', error);
  }
};