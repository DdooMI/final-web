/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect, useRef } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import { motion } from "framer-motion";
import { getMessageById, markMessageAsRead, sendMessage, getConversationMessages } from "../firebase/messages";
import { formatDistanceToNow } from "date-fns";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function MessageDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [senderInfo, setSenderInfo] = useState({ name: "User", photoURL: "/person.gif" });
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get message status icon
  const getMessageStatusIcon = (message) => {
    if (!message.isSender) return null;
    
    const iconClasses = "w-4 h-4";
    
    if (message.status === 'read') {
      return (
        <img
          src="/double-check.svg"
          alt="Read"
          className={`${iconClasses} text-blue-500`}
        />
      );
    } else if (message.delivered) {
      return (
        <img
          src="/check-mark.svg"
          alt="Delivered"
          className={`${iconClasses} text-gray-500`}
        />
      );
    } else {
      return (
        <svg
          className={`${iconClasses} text-gray-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
  };

  // Handle reply submission
  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      setSendingReply(true);

      // Determine recipient ID (the other person in the conversation)
      const recipientId = message.isSender ? message.recipientId : message.senderId;

      // Send the reply message with the same conversationId
      const messageId = await sendMessage({
        senderId: user.uid,
        recipientId,
        content: replyText,
        subject: `Re: ${message.subject}`,
        conversationId: message.conversationId
      });

      // Clear the reply text
      setReplyText("");
      
      // Add the new message to the conversation without reloading the page
      const newMessage = {
        id: messageId,
        content: replyText,
        subject: `Re: ${message.subject}`,
        timestamp: "just now",
        isSender: true
      };
      
      setConversationMessages(prev => [...prev, newMessage]);
      
      // Don't redirect, stay on the conversation page
    } catch (err) {
      console.error("Error sending reply:", err);
      setError("Failed to send reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true);

        // Get message data
        const messageData = await getMessageById(id);

        if (!messageData) {
          setError("Message not found");
          setLoading(false);
          return;
        }

        // Format message for display
        const formattedMessage = {
          id: messageData.id,
          senderId: messageData.senderId,
          recipientId: messageData.recipientId,
          content: messageData.content,
          subject: messageData.subject || "(No subject)",
          read: messageData.read,
          timestamp: messageData.createdAt ? formatDistanceToNow(messageData.createdAt.toDate(), { addSuffix: true }) : "Unknown time",
          isSender: messageData.senderId === user.uid,
          attachments: messageData.attachments || [],
          conversationId: messageData.conversationId || null
        };

        // Mark message as read if recipient is viewing it
        if (!formattedMessage.read && formattedMessage.recipientId === user.uid) {
          await markMessageAsRead(id);
          formattedMessage.read = true;
        }

        setMessage(formattedMessage);

        // Get sender/recipient profile info
        const profileUserId = formattedMessage.isSender ? formattedMessage.recipientId : formattedMessage.senderId;

        try {
          // Get user's profile info
          const profileRef = collection(db, "users", profileUserId, "profile");
          const profileSnap = await getDocs(profileRef);
          let profileData = { name: "User", photoURL: "/person.gif" };

          if (!profileSnap.empty) {
            profileData = profileSnap.docs[0].data();
          }

          setSenderInfo(profileData);
          
          // Set up real-time listener for conversation messages
          const unsubscribe = getConversationMessages(user.uid, profileUserId, (messages) => {
            const formattedMessages = messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              subject: msg.subject || "(No subject)",
              timestamp: msg.createdAt ? formatDistanceToNow(msg.timestamp, { addSuffix: true }) : "Unknown time",
              isSender: msg.isSender,
              status: msg.status || 'sent',
              delivered: msg.delivered || false
            }));
            setConversationMessages(formattedMessages);
            scrollToBottom();
          });
          
          return () => unsubscribe();
        } catch (err) {
          console.error(`Error fetching profile or conversation for user ${profileUserId}:`, err);
        }
      } catch (err) {
        console.error("Error fetching message:", err);
        setError("Failed to load message. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchMessage();
    }
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A67B5B]"></div>
      </div>
    );
  }

  if (!message) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Message Not Found
        </h2>
        <Link
          to="/messages"
          className="text-[#A67B5B] hover:text-[#8B6B4A] transition-colors"
        >
          ← Back to Messages
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Message Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                {getMessageStatusIcon(message)}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {message.subject}
                  </h1>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-sm text-gray-500">
                      {message.timestamp}
                    </span>
                    {message.isSender && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Sent
                      </span>
                    )}
                    {!message.read && !message.isSender && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                to="/messages"
                className="text-[#A67B5B] hover:text-[#8B6B4A] transition-colors"
              >
                ← Back to Messages
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <img
                src={senderInfo.photoURL || "/person.gif"}
                alt={senderInfo.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h2 className="font-medium text-gray-900">
                  {message.isSender ? `To: ${senderInfo.name}` : senderInfo.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="flex flex-col h-[calc(100vh-200px)] bg-white">
            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <div className="space-y-4">
                {conversationMessages.length > 0 ? (
                  conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end space-x-2 ${msg.isSender ? "justify-end" : "justify-start"}`}
                    >
                      {!msg.isSender && (
                        <img
                          src={senderInfo.photoURL || "/person.gif"}
                          alt={senderInfo.name}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.isSender
                          ? "bg-[#A67B5B] text-white ml-2 shadow-md"
                          : "bg-gray-100 text-gray-800 mr-2 shadow-sm"}`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${msg.isSender ? "text-white/70" : "text-gray-500"}`}>
                          <span className="text-xs">
                            {msg.timestamp}
                          </span>
                          {getMessageStatusIcon(msg)}
                        </div>
                      </div>
                      {msg.isSender && (
                        <img
                          src={user.photoURL || "/person.gif"}
                          alt="You"
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Attachments ({message.attachments.length})
                </h3>
                <div className="space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-6 h-6 text-gray-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.size}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {/* Reply Section */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reply</h3>
              <div className="mb-4">
                <textarea
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C19A6B] focus:border-transparent"
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <button
                className={`px-4 py-2 rounded-md ${sendingReply
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#C19A6B] hover:bg-[#A0784A]"} text-white transition-colors`}
                onClick={handleReply}
                disabled={sendingReply}
              >
                {sendingReply ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MessageDetailPage;
