import { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { FaRegEnvelope, FaEnvelope, FaSearch, FaUser } from "react-icons/fa";
import { subscribeToUserConversations } from "../firebase/messages";

function MessagesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    // Subscribe to user conversations
    const unsubscribe = subscribeToUserConversations(user.uid, (conversationsData) => {
      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Group conversations by otherUser.id and keep only the most recent one
  const groupedConversations = conversations.reduce((acc, conversation) => {
    const existingConversation = acc.find(c => c.otherUser.id === conversation.otherUser.id);
    
    if (!existingConversation) {
      acc.push(conversation);
    } else if (conversation.timestamp > existingConversation.timestamp) {
      // Replace with more recent conversation
      const index = acc.findIndex(c => c.otherUser.id === conversation.otherUser.id);
      acc[index] = conversation;
    }
    
    return acc;
  }, []);
  
  // Filter conversations based on search term
  const filteredConversations = groupedConversations.filter((conversation) => {
    if (!searchTerm) return true;
    return conversation.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#C19A6B]/10 mb-4">
                <FaRegEnvelope className="h-8 w-8 text-[#C19A6B]" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user.role === "client" 
                  ? "Start a conversation with a designer by viewing their profile or proposal."
                  : "Wait for clients to message you about their design needs."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ backgroundColor: "#f9f5f1" }}
                  className="py-4 cursor-pointer p-2 rounded-lg"
                  onClick={() => navigate(`/messages/${conversation.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {conversation.otherUser.photoURL ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={conversation.otherUser.photoURL}
                          alt={conversation.otherUser.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-[#C19A6B]/20 flex items-center justify-center">
                          <FaUser className="h-6 w-6 text-[#C19A6B]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.otherUser.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(conversation.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessageContent}
                        </p>
                      </div>
                      <p className="text-xs text-[#C19A6B]">
                        {conversation.otherUser.role === "designer" ? "Designer" : "Client"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;