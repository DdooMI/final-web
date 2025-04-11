import { BellIcon, TrashIcon, CheckIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../zustand/auth";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, limit } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { formatDistanceToNow } from "date-fns";

export default function Header() {
  const {profile, logout, user} = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  // Profile dropdown state removed as we're navigating directly to AdminProfile
  const navigate = useNavigate();
  
  // Fetch notifications from Firestore
  useEffect(() => {
    if (!user) return;
    
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10) // Limit to most recent 10 notifications
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true }) : "Unknown time"
      }));
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      const notificationRef = doc(db, "notifications", id);
      await updateDoc(notificationRef, { read: true });
      // Local state update will happen automatically via the onSnapshot listener
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const notificationRef = doc(db, "notifications", id);
      await updateDoc(notificationRef, { deleted: true });
      // We're using a soft delete approach by marking it as deleted
      // Local state update will happen via the onSnapshot listener if we filter deleted items
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleLogout = () => {
    logout(navigate);
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type or related content
    if (notification.relatedId) {
      navigate(`/notifications/${notification.relatedId}`);
    } else {
      // For general notifications without specific targets
      navigate('/notifications');
    }
  };

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white">
      <div className="flex flex-1 justify-end px-4">
        <div className="ml-4 flex items-center md:ml-6">
          <div className="relative">
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-500 flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.filter(n => !n.deleted).map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150 ${
                          notification.read ? 'bg-gray-50' : 'bg-white'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                        role="button"
                      >
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title || 'Notification'}</p>
                            <p className="text-sm text-gray-700">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Delete notification"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout button */}
          <div className="ml-3">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center rounded-full bg-white p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              title="Logout"
            >
              <span className="sr-only">Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>

          {/* Profile image with direct navigation */}
          <div className="ml-3">
            <img
              className="h-12 w-12 rounded-full cursor-pointer transition-transform hover:scale-105"
              src={profile.photoURL || "/person.gif"}
              alt={profile.name}
              title={`${profile.name} - Click to view profile`}
              onClick={() => navigate('/dashboard/admin-profile')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
