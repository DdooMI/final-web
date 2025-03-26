import { useState, useEffect, useRef } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, Link, useLocation } from "react-router-dom";
import { getUserMessages, sendMessage, getUnreadMessageCount } from "../firebase/messages";
import { formatDistanceToNow } from "date-fns";
import { collection, getDocs, doc, getDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const location = useLocation();

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Function to fetch messages
  const fetchMessages = async () => {
    try {
      const sentQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', user.uid)
      );
      
      const receivedQuery = query(
        collection(db, 'messages'),
        where('recipientId', '==', user.uid)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      handleMessageUpdate(sentSnapshot, true);
      handleMessageUpdate(receivedSnapshot, false);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again later.");
    }
  };

  // Check for query parameters (for new message creation)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const recipientId = queryParams.get('recipient');
    const subject = queryParams.get('subject');
    const requestId = queryParams.get('requestId');
    
    // If we have recipient and subject, create a new message
    if (recipientId && subject && user) {
      const createNewMessage = async () => {
        try {
          // Create a new message
          await sendMessage({
            senderId: user.uid,
            recipientId,
            content: `Hello, I'd like to discuss my design request with you.`,
            subject,
          });
          
          // Reload messages
          fetchMessages();
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, "/messages");
        } catch (err) {
          console.error("Error creating new message:", err);
          setError("Failed to create new message. Please try again.");
        }
      };
      
      createNewMessage();
    }
  }, [location.search, user]);

  // Set up real-time message listener
  const setupMessageListener = () => {
    try {
      const sentQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', user.uid)
      );
      
      const receivedQuery = query(
        collection(db, 'messages'),
        where('recipientId', '==', user.uid)
      );

      const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
        handleMessageUpdate(snapshot, true);
      });

      const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
        handleMessageUpdate(snapshot, false);
      });

      return () => {
        unsubscribeSent();
        unsubscribeReceived();
      };
    } catch (err) {
      console.error("Error setting up message listener:", err);
      setError("Failed to load messages. Please try again later.");
    }
  };

  // Handle message updates
  const handleMessageUpdate = async (snapshot, isSender) => {
    try {
      const updatedMessages = [];
      const newUserIds = new Set();

      snapshot.forEach((doc) => {
        const messageData = doc.data();
        const otherUserId = isSender ? messageData.recipientId : messageData.senderId;
        newUserIds.add(otherUserId);
        
        updatedMessages.push({
          id: doc.id,
          ...messageData,
          isSender
        });
      });

      // Fetch profiles for new users
      for (const userId of newUserIds) {
        if (!userProfiles[userId]) {
          try {
            const profileRef = collection(db, "users", userId, "profile");
            const profileSnap = await getDocs(profileRef);
            
            if (!profileSnap.empty) {
              setUserProfiles(prev => ({
                ...prev,
                [userId]: profileSnap.docs[0].data()
              }));
            } else {
              setUserProfiles(prev => ({
                ...prev,
                [userId]: { name: "User", photoURL: "/person.gif" }
              }));
            }
          } catch (err) {
            console.error(`Error fetching profile for user ${userId}:`, err);
          }
        }
      }

      setConversations(prev => {
        const newMessages = [...prev];
        updatedMessages.forEach(message => {
          const conversationIndex = newMessages.findIndex(
            conv => conv.otherUserId === (isSender ? message.recipientId : message.senderId)
          );

          if (conversationIndex === -1) {
            const otherUserId = isSender ? message.recipientId : message.senderId;
            newMessages.push({
              id: message.conversationId,
              otherUserId,
              messages: [message],
              lastMessage: message,
              unreadCount: !isSender && !message.read ? 1 : 0,
              profile: userProfiles[otherUserId] || { name: "User", photoURL: "/person.gif" }
            });
          } else {
            const conversation = newMessages[conversationIndex];
            const messageIndex = conversation.messages.findIndex(m => m.id === message.id);

            if (messageIndex === -1) {
              conversation.messages.push(message);
            } else {
              conversation.messages[messageIndex] = message;
            }

            conversation.messages.sort((a, b) => b.createdAt - a.createdAt);
            conversation.lastMessage = conversation.messages[0];
            conversation.unreadCount = conversation.messages.filter(
              m => !m.isSender && !m.read
            ).length;
          }
        });

        return newMessages.sort((a, b) => 
          b.lastMessage.createdAt - a.lastMessage.createdAt
        );
      });
    } catch (err) {
      console.error("Error handling message update:", err);
    }
  };

  useEffect(() => {
    if (user) {
      const unsubscribe = setupMessageListener();
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [user]);

  // Group messages by conversation
  const groupMessagesByConversation = (messages) => {
    const conversationMap = {};
    
    messages.forEach(message => {
      const otherUserId = message.isSender ? message.recipientId : message.senderId;
      const conversationId = message.conversationId || `${Math.min(user.uid, otherUserId)}-${Math.max(user.uid, otherUserId)}`;
      
      if (!conversationMap[conversationId]) {
        conversationMap[conversationId] = {
          id: conversationId,
          otherUserId,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          profile: userProfiles[otherUserId] || { name: "User", photoURL: "/person.gif" }
        };
      }
      
      conversationMap[conversationId].messages.push(message);
      if (!message.read && !message.isSender) {
        conversationMap[conversationId].unreadCount++;
      }
    });
    
    // Sort messages and get last message for each conversation
    Object.values(conversationMap).forEach(conv => {
      conv.messages.sort((a, b) => b.createdAt - a.createdAt);
      conv.lastMessage = conv.messages[0];
    });
    
    return Object.values(conversationMap);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Chats</h1>

        {/* Conversation List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/messages/${conversation.lastMessage.id}`}
                  className={`block hover:bg-gray-50 transition-colors duration-150 ${conversation.unreadCount > 0 ? 'bg-[#C19A6B]/5' : ''}`}
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={conversation.profile.photoURL}
                          alt={conversation.profile.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {conversation.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {conversation.profile.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(conversation.lastMessage.createdAt.toDate(), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage.isSender && "You: "}
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No conversations yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
