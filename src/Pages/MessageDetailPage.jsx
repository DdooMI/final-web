/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import { motion } from "framer-motion";

function MessageDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    // In a real app, this would fetch the message from an API
    // For now, we'll use sample data
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Sample messages data
      const messages = [
        {
          id: 1,
          sender: "Designer Sarah",
          avatar: "/person.gif",
          content:
            "I've completed the initial design for your living room. Would you like to schedule a call to discuss it? I'm available tomorrow between 10 AM and 4 PM. Let me know what time works best for you. I've attached some preliminary sketches for your review.",
          timestamp: "2 hours ago",
          read: false,
          subject: "Living Room Design Completion",
          attachments: [
            { name: "living_room_sketch_1.jpg", size: "2.4 MB" },
            { name: "living_room_sketch_2.jpg", size: "1.8 MB" },
          ],
          conversation: [
            {
              sender: "You",
              content: "Hi Sarah, can you help me with my living room design?",
              timestamp: "2 days ago",
            },
            {
              sender: "Designer Sarah",
              content:
                "Of course! I'd be happy to help. Can you share some photos of your current living room?",
              timestamp: "2 days ago",
            },
            {
              sender: "You",
              content:
                "Here are some photos. I'm looking for a modern minimalist design.",
              timestamp: "1 day ago",
            },
          ],
        },
        {
          id: 2,
          sender: "Designer Michael",
          avatar: "/person.gif",
          content:
            "Here's the updated kitchen design as requested. Let me know your thoughts! I've incorporated the changes you suggested regarding the island and cabinet colors. The new layout should provide more counter space while maintaining an open feel.",
          timestamp: "Yesterday",
          read: true,
          subject: "Updated Kitchen Design",
          attachments: [{ name: "kitchen_design_v2.pdf", size: "4.2 MB" }],
          conversation: [
            {
              sender: "Designer Michael",
              content: "I've sent the initial kitchen design. Please review.",
              timestamp: "3 days ago",
            },
            {
              sender: "You",
              content:
                "I like it, but can we make the island bigger and change the cabinet color?",
              timestamp: "2 days ago",
            },
          ],
        },
        {
          id: 3,
          sender: "Designer Emma",
          avatar: "/person.gif",
          content:
            "Would you like to schedule a call to discuss your bedroom design? I have some ideas I'd like to share with you directly.",
          timestamp: "2 days ago",
          read: true,
          subject: "Bedroom Design Consultation",
          attachments: [],
          conversation: [
            {
              sender: "Designer Emma",
              content:
                "I've been assigned to your bedroom design project. Looking forward to working with you!",
              timestamp: "4 days ago",
            },
            {
              sender: "You",
              content:
                "Great! I'm looking for a cozy but elegant bedroom design.",
              timestamp: "3 days ago",
            },
          ],
        },
        {
          id: 4,
          sender: "Designer John",
          avatar: "/person.gif",
          content:
            "I've sent you some material samples for your consideration. Please let me know which ones you prefer.",
          timestamp: "3 days ago",
          read: true,
          subject: "Material Samples for Your Project",
          attachments: [
            { name: "fabric_samples.jpg", size: "3.1 MB" },
            { name: "color_palette.pdf", size: "1.2 MB" },
          ],
          conversation: [],
        },
        {
          id: 5,
          sender: "Designer Lisa",
          avatar: "/person.gif",
          content:
            "Your project timeline has been updated. Please review the new milestones.",
          timestamp: "1 week ago",
          read: true,
          subject: "Updated Project Timeline",
          attachments: [{ name: "project_timeline_v2.pdf", size: "0.8 MB" }],
          conversation: [],
        },
      ];

      const foundMessage = messages.find((m) => m.id === parseInt(id));
      setMessage(foundMessage || null);
      setLoading(false);
    }, 500);
  }, [id]);

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

  // Get message type icon
  const getMessageIcon = () => {
    return (
      <div className="bg-blue-100 p-3 rounded-full">
        <svg
          className="w-6 h-6 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  };

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
                {getMessageIcon()}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {message.subject}
                  </h1>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-sm text-gray-500">
                      {message.timestamp}
                    </span>
                    {!message.read && (
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
                src={message.avatar}
                alt={message.sender}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h2 className="font-medium text-gray-900">{message.sender}</h2>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="p-6 bg-white">
            <p className="text-gray-700 whitespace-pre-wrap mb-6">
              {message.content}
            </p>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-6">
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
                      <button className="px-3 py-1 text-sm text-[#A67B5B] hover:text-[#8B6B4A] transition-colors">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation History */}
            {message.conversation && message.conversation.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Conversation History
                </h3>
                <div className="space-y-4">
                  {message.conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.sender === "You" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.sender === "You"
                            ? "bg-[#A67B5B] text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">
                            {msg.sender}
                          </span>
                          <span className="text-xs opacity-75">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-3">
              <button className="px-4 py-2 bg-[#A67B5B] text-white rounded-md hover:bg-[#8B6B4A] transition-colors flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                Reply
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Forward
              </button>
              {!message.read && (
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Mark as Read
                </button>
              )}
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors ml-auto">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MessageDetailPage;
