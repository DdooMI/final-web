import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createNotification } from "../firebase/notifications";
import { FiMessageSquare, FiCheck, FiX, FiSettings } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

function ProjectPage() {
  const { proposalId } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [request, setRequest] = useState(null);
  const [designer, setDesigner] = useState(null);
  const [client, setClient] = useState(null);
  const [projectStatus, setProjectStatus] = useState("in_progress"); // in_progress, completed_by_designer, completed
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!proposalId) {
          throw new Error("Proposal ID is required");
        }

        // Get proposal data
        const proposalRef = doc(db, "designProposals", proposalId);
        const proposalSnap = await getDoc(proposalRef);

        if (!proposalSnap.exists()) {
          throw new Error("Proposal not found");
        }

        const proposalData = proposalSnap.data();
        setProposal({
          id: proposalSnap.id,
          ...proposalData,
          createdAt: proposalData.createdAt
            ? formatDistanceToNow(proposalData.createdAt.toDate(), { addSuffix: true })
            : "Unknown date",
        });

        // Get request data
        if (proposalData.requestId) {
          const requestRef = doc(db, "designRequests", proposalData.requestId);
          const requestSnap = await getDoc(requestRef);

          if (requestSnap.exists()) {
            const requestData = requestSnap.data();
            setRequest({
              id: requestSnap.id,
              ...requestData,
              createdAt: requestData.createdAt
                ? formatDistanceToNow(requestData.createdAt.toDate(), { addSuffix: true })
                : "Unknown date",
            });
          }
        }

        // Get designer data
        if (proposalData.designerId) {
          const designerRef = doc(db, "users", proposalData.designerId);
          const designerSnap = await getDoc(designerRef);

          if (designerSnap.exists()) {
            const designerData = designerSnap.data();
            
            // Get designer profile
            const profileRef = collection(db, "users", proposalData.designerId, "profile");
            const profileSnap = await getDocs(profileRef);
            let designerProfile = {};
            
            if (!profileSnap.empty) {
              designerProfile = profileSnap.docs[0].data();
            }
            
            setDesigner({
              id: designerSnap.id,
              ...designerData,
              ...designerProfile,
            });
          }
        }

        // Get client data
        if (proposalData.clientId) {
          const clientRef = doc(db, "users", proposalData.clientId);
          const clientSnap = await getDoc(clientRef);

          if (clientSnap.exists()) {
            const clientData = clientSnap.data();
            
            // Get client profile
            const profileRef = collection(db, "users", proposalData.clientId, "profile");
            const profileSnap = await getDocs(profileRef);
            let clientProfile = {};
            
            if (!profileSnap.empty) {
              clientProfile = profileSnap.docs[0].data();
            }
            
            setClient({
              id: clientSnap.id,
              ...clientData,
              ...clientProfile,
            });
          }
        }

        // Check project status
        if (proposalData.projectStatus) {
          setProjectStatus(proposalData.projectStatus);
        }
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [proposalId]);

  // Handle marking project as completed by designer
  const handleMarkAsCompletedByDesigner = async () => {
    if (!proposal) return;
    
    setUpdateLoading(true);
    setError(null);
    
    try {
      const proposalRef = doc(db, "designProposals", proposal.id);
      
      // Update proposal status
      await updateDoc(proposalRef, {
        projectStatus: "completed_by_designer",
      });
      
      // Create notification for client
      await createNotification({
        userId: proposal.clientId,
        title: "Project Completed by Designer",
        message: `The designer has completed your project "${request?.title || 'Design Project'}". Please review and mark it as completed if you're satisfied.`,
        type: "success",
        relatedId: proposal.id,
      });
      
      // Update local state
      setProjectStatus("completed_by_designer");
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle marking project as completed by client
  const handleMarkAsCompleted = async () => {
    if (!proposal) return;
    
    setUpdateLoading(true);
    setError(null);
    
    try {
      const proposalRef = doc(db, "designProposals", proposal.id);
      
      // Update proposal status
      await updateDoc(proposalRef, {
        projectStatus: "completed",
        status: "completed",
      });
      
      // Update the request status to completed
      if (proposal.requestId) {
        const requestRef = doc(db, "designRequests", proposal.requestId);
        await updateDoc(requestRef, {
          status: "completed"
        });
      }
      
      // Create notification for designer
      await createNotification({
        userId: proposal.designerId,
        title: "Project Marked as Completed",
        message: `The client has marked the project "${request?.title || 'Design Project'}" as completed. Thank you for your work!`,
        type: "success",
        relatedId: proposal.id,
      });
      
      // Update local state
      setProjectStatus("completed");
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Start a conversation with the other party
  const startConversation = async () => {
    try {
      // Import needed only when the function is called
      const { sendMessage } = await import("../firebase/messages");
      
      // Determine sender and receiver based on user role
      const senderId = user.uid;
      const receiverId = role === "client" ? proposal.designerId : proposal.clientId;
      
      // Start a new conversation
      const conversationId = await sendMessage({
        senderId,
        receiverId,
        content: `Hello, I'm messaging about the project "${request?.title || 'Design Project'}".`,
      });
      
      // Navigate to the conversation
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setError("Failed to start conversation. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!proposal || (!designer && role === "client") || (!client && role === "designer")) {
    return (
      <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Not Found</h2>
          <p className="text-gray-700">The project you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with navigation */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Project: {request?.title || "Design Project"}
            </h1>
            <p className="text-gray-600 mt-1">
              {role === "client" ? "Designer" : "Client"}: {role === "client" ? designer?.name || designer?.email : client?.name || client?.email}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={startConversation}
              className="px-4 py-2 border border-[#C19A6B] text-[#C19A6B] rounded-md hover:bg-[#C19A6B]/10 transition flex items-center gap-2 shadow-sm"
            >
              <FiMessageSquare />
              <span>Message</span>
            </button>
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition flex items-center gap-2 shadow-sm"
              onClick={() => navigate(-1)}
            >
              <span>Back</span>
            </button>
          </div>
        </div>

        {updateSuccess && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Project status updated successfully.</span>
          </div>
        )}

        {/* Project Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${getStatusBannerClass(projectStatus)}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">{getStatusTitle(projectStatus)}</h2>
              <p>{getStatusDescription(projectStatus, role)}</p>
            </div>
            {renderStatusActions()}
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Details</h2>
              
              {request && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Request Information</h3>
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Budget:</span> ${request.budget}
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span> {request.duration} days
                    </div>
                    <div>
                      <span className="text-gray-500">Room Type:</span> {request.roomType}
                    </div>
                    <div>
                      <span className="text-gray-500">Posted:</span> {request.createdAt}
                    </div>
                  </div>
                  {request.additionalDetails && (
                    <div className="mt-3">
                      <span className="text-gray-500">Additional Details:</span>
                      <p className="text-sm text-gray-600 mt-1">{request.additionalDetails}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Proposal Information</h3>
                <p className="text-gray-600 mb-3">{proposal.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Price:</span> ${proposal.price}
                  </div>
                  <div>
                    <span className="text-gray-500">Estimated Time:</span> {proposal.estimatedTime} days
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span> {proposal.createdAt}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Timeline/Updates - Placeholder for future enhancement */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Timeline</h2>
              <div className="text-center py-8 text-gray-500">
                <p>Project updates and timeline will be displayed here.</p>
                <p className="text-sm mt-2">This feature will be available soon.</p>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Info & Actions */}
          <div>
            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {role === "client" ? "Designer Information" : "Client Information"}
              </h2>
              
              {role === "client" && designer && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm">Name</h3>
                    <p className="font-medium">{designer.name || "Not provided"}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm">Email</h3>
                    <p className="font-medium">{designer.email}</p>
                  </div>
                  {designer.phone && (
                    <div className="mb-4">
                      <h3 className="text-gray-600 text-sm">Phone</h3>
                      <p className="font-medium">{designer.phone}</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/designer-portfolio/${designer.id}`)}
                    className="w-full mt-2 px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition"
                  >
                    View Portfolio
                  </button>
                </div>
              )}
              
              {role === "designer" && client && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm">Name</h3>
                    <p className="font-medium">{client.name || "Not provided"}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-gray-600 text-sm">Email</h3>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  {client.phone && (
                    <div className="mb-4">
                      <h3 className="text-gray-600 text-sm">Phone</h3>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Project Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Project Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/projects')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  <FiSettings />
                  <span>Project Panel</span>
                </button>
                
                {role === "designer" && projectStatus === "in_progress" && (
                  <button
                    onClick={handleMarkAsCompletedByDesigner}
                    className="w-full px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition flex items-center justify-center gap-2"
                    disabled={updateLoading}
                  >
                    <FiCheck />
                    <span>{updateLoading ? "Processing..." : "Mark as Completed"}</span>
                  </button>
                )}
                
                {role === "client" && projectStatus === "completed_by_designer" && (
                  <button
                    onClick={handleMarkAsCompleted}
                    className="w-full px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition flex items-center justify-center gap-2"
                    disabled={updateLoading}
                  >
                    <FiCheck />
                    <span>{updateLoading ? "Processing..." : "Confirm Completion"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions
  function getStatusBannerClass(status) {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed_by_designer":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusTitle(status) {
    switch (status) {
      case "in_progress":
        return "Project In Progress";
      case "completed_by_designer":
        return "Ready for Review";
      case "completed":
        return "Project Completed";
      default:
        return "Project Status";
    }
  }

  function getStatusDescription(status, userRole) {
    switch (status) {
      case "in_progress":
        return userRole === "designer" 
          ? "You are currently working on this project. Mark it as completed when you're done." 
          : "The designer is currently working on your project.";
      case "completed_by_designer":
        return userRole === "designer" 
          ? "You've marked this project as completed. Waiting for client confirmation." 
          : "The designer has completed the project. Please review and confirm completion.";
      case "completed":
        return "This project has been completed and signed off by both parties.";
      default:
        return "Current status of the project.";
    }
  }

  function renderStatusActions() {
    if (projectStatus === "completed") {
      return (
        <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
          Completed
        </span>
      );
    }
    
    if (role === "designer" && projectStatus === "in_progress") {
      return (
        <button
          onClick={handleMarkAsCompletedByDesigner}
          className="px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition flex items-center gap-2 shadow-sm"
          disabled={updateLoading}
        >
          <FiCheck className="text-white" />
          <span>{updateLoading ? "Processing..." : "Mark as Completed"}</span>
        </button>
      );
    }
    
    if (role === "client" && projectStatus === "completed_by_designer") {
      return (
        <button
          onClick={handleMarkAsCompleted}
          className="px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition flex items-center gap-2 shadow-sm"
          disabled={updateLoading}
        >
          <FiCheck className="text-white" />
          <span>{updateLoading ? "Processing..." : "Confirm Completion"}</span>
        </button>
      );
    }
    
    return null;
  }
}

export default ProjectPage;