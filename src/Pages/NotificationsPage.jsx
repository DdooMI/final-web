import { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, Link } from "react-router-dom";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { formatDistanceToNow } from "date-fns";

function NotificationsPage() {
  const { user,role } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true }) : "Unknown time"
      }));
      setNotifications(notificationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
      </div>
    );
  }


  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return false;
  });

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="bg-yellow-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="bg-red-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-blue-500"
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "all"
                  ? "border-b-2 border-[#C19A6B] text-[#C19A6B]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All Notifications
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

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                    !notification.read ? "bg-[#C19A6B]/5" : ""
                  }`}
                  onClick={async () => {
                    try {
                      console.log("Notification clicked:", notification);
                      console.log(":", role);

                     
                      if (!notification.read) {
                        const notificationRef = doc(db, "notifications", notification.id);
                        await updateDoc(notificationRef, { read: true });
                      }
                      
                      // Navigate to the appropriate page based on notification type, related ID, and user role
                      if (notification.relatedId) {
                        // Check if it's a Project Completed notification
                        if (notification.title.includes("Project Completed by Designer") || notification.title.includes("Project Marked as Completed")) {
                          // Navigate directly to the project page
                          window.location.href = `/project/${notification.relatedId}`;
                        }
                        // Check if it's any proposal-related notification for a designer
                        else if (role === "designer" && notification.title.includes("Proposal")) {
                          // Navigate to designer proposals page for designers
                          window.location.href = `/designer-proposals?proposalId=${notification.relatedId}`;
                        } else {
                          // For clients or other notification types, navigate to client requests page
                          window.location.href = `/client-requests?requestId=${notification.relatedId}`;
                        }
                      }
                    } catch (error) {
                      console.error("Error updating notification status:", error);
                    }
                  }}
                >
                  <div className="flex items-start">
                    {getNotificationIcon(notification.type)}
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {notification.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        {!notification.read && (
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
                No notifications found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
