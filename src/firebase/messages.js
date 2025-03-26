import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Create a new message
export const sendMessage = async ({
  senderId,
  recipientId,
  content,
  subject = '',
  conversationId = null,
}) => {
  try {
    // If no conversationId is provided, create one using the two user IDs
    // This ensures all messages between the same two users are grouped together
    if (!conversationId) {
      // Sort the IDs to ensure consistency regardless of who initiates the conversation
      const sortedIds = [senderId, recipientId].sort();
      conversationId = `${sortedIds[0]}_${sortedIds[1]}`;
    }

    const messageRef = await addDoc(collection(db, 'messages'), {
      senderId,
      recipientId,
      content,
      subject,
      read: false,
      delivered: false,
      conversationId,
      createdAt: serverTimestamp(),
      status: 'sent',
    });
    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      read: true,
      status: 'read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Get a single message by ID
export const getMessageById = async (messageId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (messageSnap.exists()) {
      return {
        id: messageSnap.id,
        ...messageSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

// Get all messages for a user (both sent and received)
export const getUserMessages = async (userId) => {
  try {
    const sentQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', userId)
    );
    
    const receivedQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', userId)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery)
    ]);

    const messages = [];
    
    sentSnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        isSender: true
      });
    });

    receivedSnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        isSender: false
      });
    });

    // Sort messages by createdAt timestamp (newest first)
    return messages.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting user messages:', error);
    throw error;
  }
};

// Get unread message count for a user
export const getUnreadMessageCount = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.length);
    });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    throw error;
  }
};

// Get all messages in a conversation between two users
export const getConversationMessages = (userId1, userId2, callback) => {
  try {
    // Create the conversation ID by sorting the user IDs
    const sortedIds = [userId1, userId2].sort();
    const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;
    
    // Query messages with this conversation ID
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    
    // Set up real-time listener
    return onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        const messageData = doc.data();
        messages.push({
          id: doc.id,
          ...messageData,
          isSender: messageData.senderId === userId1,
          timestamp: messageData.createdAt ? messageData.createdAt.toDate() : new Date()
        });
      });
      
      callback(messages);
    });

  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
};