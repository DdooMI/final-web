import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Create a new message
export const sendMessage = async ({
  senderId,
  receiverId,
  content,
  conversationId = null,
}) => {
  try {
    // If no conversationId, create a new conversation
    if (!conversationId) {
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        participants: [senderId, receiverId],
        lastMessageTimestamp: serverTimestamp(),
        lastMessageContent: content,
        createdAt: serverTimestamp(),
      });
      conversationId = conversationRef.id;
    } else {
      // Update the conversation with the latest message info
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessageTimestamp: serverTimestamp(),
        lastMessageContent: content,
      });
    }

    // Add the message to the messages collection
    await addDoc(collection(db, 'messages'), {
      conversationId,
      senderId,
      receiverId,
      content,
      read: false,
      createdAt: serverTimestamp(),
    });

    return conversationId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get all conversations for a user
export const getUserConversations = async (userId) => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conversations = [];

    for (const doc of querySnapshot.docs) {
      const conversationData = doc.data();
      const participants = conversationData.participants;
      
      // Get the other participant's info
      const otherUserId = participants.find(id => id !== userId);
      const userRef = await getDoc(doc(db, 'users', otherUserId));
      const profileRef = await getDoc(doc(db, 'users', otherUserId, 'profile', 'profileInfo'));
      
      let userData = { role: '' };
      let profileData = { name: 'User' };
      
      if (userRef.exists()) {
        userData = userRef.data();
      }
      
      if (profileRef.exists()) {
        profileData = profileRef.data();
      }

      conversations.push({
        id: doc.id,
        ...conversationData,
        otherUser: {
          id: otherUserId,
          name: profileData.name,
          role: userData.role,
          photoURL: profileData.photoURL || '',
        },
        timestamp: conversationData.lastMessageTimestamp ? conversationData.lastMessageTimestamp.toDate() : new Date(),
      });
    }

    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
};

// Get messages for a specific conversation
export const getConversationMessages = async (conversationId) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
    }));
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = [];

    querySnapshot.docs.forEach(document => {
      const messageRef = doc(db, 'messages', document.id);
      batch.push(updateDoc(messageRef, { read: true }));
    });

    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Get unread message count for a user
export const getUnreadMessageCount = async (userId) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    throw error;
  }
};

// Set up a real-time listener for unread message count
export const subscribeToUnreadMessageCount = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.length);
    });
  } catch (error) {
    console.error('Error subscribing to unread messages:', error);
    throw error;
  }
};

// Set up a real-time listener for conversation messages
export const subscribeToConversationMessages = (conversationId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
      }));
      callback(messages);
    });
  } catch (error) {
    console.error('Error subscribing to conversation messages:', error);
    throw error;
  }
};

// Set up a real-time listener for user conversations
export const subscribeToUserConversations = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const conversations = [];
      
      for (const docSnapshot of snapshot.docs) {
        const conversationData = docSnapshot.data();
        const participants = conversationData.participants;
        
        // Get the other participant's info
        const otherUserId = participants.find(id => id !== userId);
        const userRef = await getDoc(doc(db, 'users', otherUserId));
        const profileRef = await getDoc(doc(db, 'users', otherUserId, 'profile', 'profileInfo'));
        
        let userData = { role: '' };
        let profileData = { name: 'User' };
        
        if (userRef.exists()) {
          userData = userRef.data();
        }
        
        if (profileRef.exists()) {
          profileData = profileRef.data();
        }

        conversations.push({
          id: docSnapshot.id,
          ...conversationData,
          otherUser: {
            id: otherUserId,
            name: profileData.name,
            role: userData.role,
            photoURL: profileData.photoURL || '',
          },
          timestamp: conversationData.lastMessageTimestamp ? conversationData.lastMessageTimestamp.toDate() : new Date(),
        });
      }
      
      callback(conversations);
    });
  } catch (error) {
    console.error('Error subscribing to user conversations:', error);
    throw error;
  }
};