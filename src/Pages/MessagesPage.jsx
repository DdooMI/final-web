import { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, Link, useLocation } from "react-router-dom";
import { getUserMessages, sendMessage } from "../firebase/messages";
import { formatDistanceToNow } from "date-fns";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function MessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const location = useLocation();

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

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

  // Fetch messages from Firebase
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await getUserMessages(user.uid);
      
      // Get user profiles for all message senders/recipients
      const profiles = {};
      const userIds = new Set();
      
      messagesData.forEach(message => {
        const otherUserId = message.isSender ? message.recipientId : message.senderId;
        userIds.add(otherUserId);
      });
      
      // Fetch profiles for all users
      for (const userId of userIds) {
        try {
          const profileRef = collection(db, "users", userId, "profile");
          const profileSnap = await getDocs(profileRef);
          
          if (!profileSnap.empty) {
            profiles[userId] = profileSnap.docs[0].data();
          } else {
            // Default profile if not found
            profiles[userId] = { name: "User", photoURL: "/person.gif" };
          }
        } catch (err) {
          console.error(`Error fetching profile for user ${userId}:`, err);
          profiles[userId] = { name: "User", photoURL: "/person.gif" };
        }
      }
      
      setUserProfiles(profiles);
      setMessages(messagesData);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  // Filter messages based on active tab
  const filteredMessages = messages.filter((message) => {
    if (activeTab === "inbox") return true;
    if (activeTab === "unread") return !message.read;
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "inbox"
                  ? "border-b-2 border-[#C19A6B] text-[#C19A6B]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("inbox")}
            >
              All Messages
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "unread"
                  ? "border-b-2 border-[#C19A6B] text-[#C19A6B]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("unread")}
            >
              Unread
            </button>
          </div>

          {/* Message List */}
          <div className="divide-y divide-gray-200">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                    !message.read ? "bg-[#C19A6B]/5" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <img
                      src={message.avatar}
                      alt={message.sender}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {message.sender}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {message.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {message.content}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <Link
                          to={`/messages/${message.id}`}
                          className="px-3 py-1 text-xs bg-[#C19A6B] text-white rounded hover:bg-[#A0784A] transition-colors duration-150"
                        >
                          View Details
                        </Link>
                        {!message.read && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No messages found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
