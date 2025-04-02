import { useState, useEffect, useRef } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { FaArrowLeft, FaUser, FaPaperPlane } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  subscribeToConversationMessages,
  markMessagesAsRead,
  sendMessage,
} from "../firebase/messages";

function MessageDetailPage() {
  const { user,profile } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const messagesEndRef = useRef(null);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    if (!conversationId || !user) return;

    setLoading(true);

    // Subscribe to conversation messages
    const unsubscribe = subscribeToConversationMessages(
      conversationId,
      (messagesData) => {
        setMessages(messagesData);
        setLoading(false);

        // Extract other user info from the first message
        if (messagesData.length > 0) {
          const firstMessage = messagesData[0];
          const otherUserId =
            firstMessage.senderId === user.uid
              ? firstMessage.receiverId
              : firstMessage.senderId;

          // Set other user info and fetch their profile data
          setOtherUser({
            id: otherUserId,
          });
          
          // Fetch the other user's profile information
          const fetchOtherUserProfile = async () => {
            try {
              const userRef = await getDoc(doc(db, 'users', otherUserId));
              const profileRef = await getDoc(doc(db, 'users', otherUserId, 'profile', 'profileInfo'));
              
              let userData = { role: '' };
              let profileData = { name: 'User' };
              
              if (userRef.exists()) {
                const userDoc = userRef.data();
                userData = { 
                  ...userData,
                  ...userDoc,
                  photoURL: userDoc.photoURL || null
                };
              }
              
              if (profileRef.exists()) {
                const profileDoc = profileRef.data();
                profileData = {
                  ...profileData,
                  ...profileDoc,
                  photoURL: profileDoc.photoURL || userData.photoURL || null
                };
              }

              // Prioritize photoURL from profile, then user document
              const finalPhotoURL = profileData.photoURL || userData.photoURL || null;
              userData.photoURL = finalPhotoURL;
              profileData.photoURL = finalPhotoURL;
              
              setOtherUserProfile({
                ...userData,
                ...profileData,
                photoURL: finalPhotoURL
              });
            } catch (error) {
              console.error('Error fetching other user profile:', error);
            }
          };
          
          fetchOtherUserProfile();
        }

        // Mark messages as read
        markMessagesAsRead(conversationId, user.uid);
      }
    );

    return () => unsubscribe();
  }, [conversationId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage({
        senderId: user.uid,
        receiverId: messages.length > 0
          ? (messages[0].senderId === user.uid
            ? messages[0].receiverId
            : messages[0].senderId)
          : otherUser?.id,
        content: newMessage,
        conversationId,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center">
          <button
            onClick={() => navigate("/messages")}
            className="mr-4 text-gray-500 hover:text-gray-700 transition"
          >
            <FaArrowLeft />
          </button>
          <div className="flex items-center">
            {messages.length > 0 && (
              <>
                <div className="flex-shrink-0">
                  {otherUserProfile?.photoURL ? (
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={otherUserProfile.photoURL}
                      alt={otherUserProfile?.name || "User"}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23C19A6B' opacity='0.2'/%3E%3Cpath d='M20 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8-8-3.6 8-8 8zm0 4c5.3 0 16 2.7 16 8v4H4v-4c0-5.3 10.7-8 16-8z' fill='%23C19A6B'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={"/person.gif"}
                    alt={otherUserProfile?.name || "User"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23C19A6B' opacity='0.2'/%3E%3Cpath d='M20 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8-8-3.6 8-8 8zm0 4c5.3 0 16 2.7 16 8v4H4v-4c0-5.3 10.7-8 16-8z' fill='%23C19A6B'/%3E%3C/svg%3E";
                    }}
                  />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {otherUserProfile?.name || "User"}
                  </p>
                  <p className="text-xs text-[#C19A6B]">
                    {otherUserProfile?.role === "designer" ? "Designer" : "Client"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 h-[400px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end ${message.senderId === user.uid ? "justify-end" : "justify-start"}`}
                >
                  {/* Show avatar for messages from other user */}
                  {message.senderId !== user.uid && (
                    <div className="flex-shrink-0 mr-2">
                      {otherUserProfile?.photoURL ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={otherUserProfile.photoURL}
                          alt={otherUserProfile?.name || "Sender"}
                        />
                      ) : (
                        <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={"/person.gif"}
                        alt={otherUserProfile?.name || "Sender"}
                      />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${message.senderId === user.uid
                      ? "bg-[#C19A6B] text-white"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${message.senderId === user.uid
                        ? "text-[#f0e6d9]"
                        : "text-gray-500"
                        }`}
                    >
                      {formatDistanceToNow(message.createdAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {/* Show user's own avatar for their messages */}
                  {message.senderId === user.uid && (
                    <div className="flex-shrink-0 ml-2">
                      {profile?.photoURL ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={profile.photoURL}
                          alt="You"
                        />
                      ) : (
                        <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={"/person.gif"}
                        alt="You"
                      />
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C19A6B] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-[#C19A6B] text-white px-4 py-2 rounded-r-lg hover:bg-[#A0784A] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MessageDetailPage;