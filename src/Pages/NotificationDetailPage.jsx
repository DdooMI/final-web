import { useState, useEffect } from "react";
import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

function NotificationDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const notifications = [
        {
          id: 1,
          type: "info",
          title: "New proposal received",
          message:
            "New proposal received for your living room design request from Designer Sarah. The proposal includes a detailed plan for furniture arrangement, color scheme suggestions, and estimated costs for the project. You can review the full proposal in the attachments section.",
          timestamp: "1 hour ago",
          read: false,
          sender: "System",
          relatedProject: "Living Room Design",
          actions: [
            { label: "View Proposal", action: "view_proposal" },
            { label: "Contact Designer", action: "contact_designer" },
          ],
          attachments: [{ name: "living_room_proposal.pdf", size: "3.2 MB" }],
        },
        {
          id: 2,
          type: "success",
          title: "Project completed",
          message:
            "Your bedroom design project has been completed. Designer Emma has finalized all the designs and uploaded the final files. You can now download the complete design package and proceed with implementation. Don't forget to leave a review for the designer!",
          timestamp: "Yesterday",
          read: false,
          sender: "System",
          relatedProject: "Bedroom Design",
          actions: [
            { label: "Download Files", action: "download_files" },
            { label: "Leave Review", action: "leave_review" },
          ],
          attachments: [{ name: "bedroom_final_design.zip", size: "15.7 MB" }],
        },
        {
          id: 3,
          type: "info",
          title: "Message from designer",
          message:
            "Designer Emma has sent you a message regarding your kitchen renovation. She has some questions about your preferences for cabinet materials and would like to schedule a call to discuss the details further.",
          timestamp: "2 days ago",
          read: true,
          sender: "System",
          relatedProject: "Kitchen Renovation",
          actions: [
            { label: "View Message", action: "view_message" },
            { label: "Schedule Call", action: "schedule_call" },
          ],
          attachments: [],
        },
        {
          id: 4,
          type: "warning",
          title: "Payment reminder",
          message:
            "Your payment for the living room design project is due in 3 days. Please ensure that you complete the payment to avoid any delays in your project timeline. You can use any of the payment methods available in your account settings.",
          timestamp: "3 days ago",
          read: true,
          sender: "Billing Department",
          relatedProject: "Living Room Design",
          actions: [
            { label: "Make Payment", action: "make_payment" },
            { label: "Contact Support", action: "contact_support" },
          ],
          attachments: [{ name: "invoice_LR2023.pdf", size: "0.8 MB" }],
        },
        {
          id: 5,
          type: "info",
          title: "New designer available",
          message:
            "A new designer specializing in modern minimalist designs has joined our platform. Based on your preferences, we think you might be interested in checking out their portfolio and possibly working with them on your future projects.",
          timestamp: "1 week ago",
          read: true,
          sender: "System",
          relatedProject: null,
          actions: [{ label: "View Designer", action: "view_designer" }],
          attachments: [],
        },
      ];

      const foundNotification = notifications.find(
        (n) => n.id === parseInt(id)
      );
      setNotification(foundNotification || null);
      setLoading(false);
    }, 500);
  }, [id]);

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return (
          <div className="bg-green-100 p-3 rounded-full">
            <svg
              className="w-6 h-6 text-green-500"
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
          <div className="bg-yellow-100 p-3 rounded-full">
            <svg
              className="w-6 h-6 text-yellow-500"
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
          <div className="bg-red-100 p-3 rounded-full">
            <svg
              className="w-6 h-6 text-red-500"
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
    }
  };

  const handleActionClick = () => {
    // Handle notification action based on type
    if (notification.relatedId) {
      // Check if it's a proposal notification for a designer
      if (user.role === "designer" && 
          (notification.title.includes("Proposal") && 
           (notification.message.includes("accepted") || notification.message.includes("rejected")))) {
        // Navigate to designer proposals page for designers with the related proposal ID
        navigate(`/designer-proposals?proposalId=${notification.relatedId}`);
      } 
      // Check if it's a proposal acceptance notification for clients
      else if (notification.title === "Proposal accepted" || 
          (notification.title.includes("Proposal") && notification.message.includes("accepted"))) {
        // Navigate to project page
        navigate(`/project/${notification.relatedId}`);
      } else {
        // Navigate to related item
        navigate(`/notifications?id=${notification.relatedId}`);
      }
    }
  };

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A67B5B]"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Notification not found
        </h2>
        <Link
          to="/notifications"
          className="text-[#A67B5B] hover:text-[#8B6B4A] transition-colors"
        >
          ← Back to notifications
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 pt-[7.5rem] pb-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white shadow-lg rounded-xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-start space-x-6">
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {notification.title}
                  </h1>
                  <span className="text-sm font-medium text-gray-500 whitespace-nowrap ml-4">
                    {notification.timestamp}
                  </span>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {notification.message}
                </p>
              </div>
            </div>
  
            {notification.relatedProject && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-100"
              >
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Related Project
                </h3>
                <p className="text-gray-600">{notification.relatedProject}</p>
              </motion.div>
            )}
  
            {notification.actions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    className="px-4 py-2 border border-[#C19A6B] text-[#C19A6B] rounded-lg hover:bg-[#C19A6B]/10 transition-colors duration-200 mr-4 last:mr-0"
                  >
                    {action.label}
                  </button>
                ))}
              </motion.div>
            )}
  
            {notification.attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Attachments
                </h3>
                <div className="space-y-3">
                  {notification.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 group"
                    >
                      <svg
                        className="w-6 h-6 text-gray-400 group-hover:text-[#A67B5B] transition-colors duration-150"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-4 flex-1">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-150">
                          {attachment.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({attachment.size})
                        </span>
                      </div>
                      <button className="ml-4 text-[#A67B5B] hover:text-[#8B6B4A] transition-colors duration-150">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Link
            to="/notifications"
            className="inline-flex items-center text-[#A67B5B] hover:text-[#8B6B4A] transition-colors duration-150"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to notifications
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default NotificationDetailPage;

NotificationDetailPage.propTypes = {
  type: PropTypes.oneOf(['success', 'warning', 'error', 'info'])
};

