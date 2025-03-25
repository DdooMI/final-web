import { useState } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, Link } from "react-router-dom";

function MessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inbox");

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Sample messages data - in a real app, this would come from a database
  const messages = [
    {
      id: 1,
      sender: "Designer Sarah",
      avatar: "/person.gif",
      content:
        "I've completed the initial design for your living room. Would you like to schedule a call to discuss it?",
      timestamp: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      sender: "Designer Michael",
      avatar: "/person.gif",
      content:
        "Here's the updated kitchen design as requested. Let me know your thoughts!",
      timestamp: "Yesterday",
      read: true,
    },
    {
      id: 3,
      sender: "Designer Emma",
      avatar: "/person.gif",
      content:
        "Would you like to schedule a call to discuss your bedroom design?",
      timestamp: "2 days ago",
      read: true,
    },
    {
      id: 4,
      sender: "Designer John",
      avatar: "/person.gif",
      content:
        "I've sent you some material samples for your consideration. Please let me know which ones you prefer.",
      timestamp: "3 days ago",
      read: true,
    },
    {
      id: 5,
      sender: "Designer Lisa",
      avatar: "/person.gif",
      content:
        "Your project timeline has been updated. Please review the new milestones.",
      timestamp: "1 week ago",
      read: true,
    },
  ];

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
