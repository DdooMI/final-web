import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import { useBalance } from "../zustand/balance";
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
import { transferFundsToDesigner } from "../firebase/storage";
import { FiMessageSquare, FiCheck, FiX, FiSettings, FiDownload, FiUpload, FiDollarSign } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import ModelUploader from "../Components/ModelUploader";
import ModelDownloader from "../Components/ModelDownloader";
import DesignerRating from "../Components/DesignerRating";

function ProjectPage() {
  const { proposalId } = useParams();
  const { user, role } = useAuth();
  const { balance, fetchBalance } = useBalance();
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
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [modelFiles, setModelFiles] = useState([]);

  useEffect(() => {
    if (user && user.uid) {
      fetchBalance(user.uid);
    }
  }, [user, fetchBalance]);

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
        
        // Get model files if any
        if (proposalData.modelFiles) {
          setModelFiles(proposalData.modelFiles);
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
      
      // Transfer funds from client to designer
      if (proposal.price) {
        try {
          await transferFundsToDesigner(
            proposal.clientId,
            proposal.designerId,
            parseFloat(proposal.price)
          );
          setTransferSuccess(true);
          
          // Refresh client's balance
          if (role === 'client' && user && user.uid) {
            fetchBalance(user.uid);
          }
        } catch (transferError) {
          console.error('Error transferring funds:', transferError);
          // Continue with completion even if transfer fails
          // We'll handle this separately
        }
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
      
      // Show rating form
      setShowRatingForm(true);
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Handle model upload success
  const handleModelUploadSuccess = (fileInfo) => {
    // Update local state with the new file
    setModelFiles(prev => [
      ...prev,
      {
        fileId: fileInfo.fileId,
        fileName: fileInfo.fileName,
        url: fileInfo.url,
        uploadedAt: new Date(),
        size: 0 // Size info might not be available
      }
    ]);
    
    // Update project status
    setProjectStatus('completed_by_designer');
    
    // Show success message
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
  };
  
  // Handle rating submission
  const handleRatingSubmit = (ratingData) => {
    // Hide the rating form after submission
    setShowRatingForm(false);
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-[#C19A6B]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!proposal || (!designer && role === "client") || (!client && role === "designer")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Not Found</h2>
          <p className="text-gray-700 mb-6">The project you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Helper functions for status display
  function getStatusBadgeClass(status) {
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

  function getStatusLabel(status) {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "completed_by_designer":
        return "Ready for Review";
      case "completed":
        return "Completed";
      default:
        return "Unknown Status";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with navigation */}
        <div className="mb-6 bg-white shadow-md rounded-xl p-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {request?.title || "Design Project"}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(projectStatus)}`}>
                {getStatusLabel(projectStatus)}
              </span>
              <p className="text-gray-600">
                {role === "client" ? "Designer: " : "Client: "}
                <span className="font-medium">
                  {role === "client" ? designer?.name || designer?.email : client?.name || client?.email}
                </span>
              </p>
            </div>
            {transferSuccess && (
              <p className="text-green-600 mt-2 flex items-center">
                <FiDollarSign className="mr-1" /> Payment successfully transferred
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={startConversation}
              className="px-4 py-2 border border-[#C19A6B] text-[#C19A6B] rounded-lg hover:bg-[#C19A6B]/10 transition-all flex items-center gap-2 shadow-sm"
            >
              <FiMessageSquare />
              <span>Message</span>
            </button>
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2 shadow-sm"
              onClick={() => navigate(-1)}
            >
              <span>Back</span>
            </button>
          </div>
        </div>

        {updateSuccess && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-5 py-4 rounded-xl mb-6 relative"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline ml-1">
              {transferSuccess ? "Payment successfully transferred to designer!" : "Project status updated successfully."}
            </span>
          </div>
        )}

        {/* Project Status Banner */}
        <div className={`mb-6 p-6 rounded-xl shadow-md ${
          projectStatus === "in_progress" 
            ? "bg-blue-50 text-blue-700 border border-blue-200" 
            : projectStatus === "completed_by_designer" 
            ? "bg-yellow-50 text-yellow-700 border border-yellow-200" 
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="font-semibold text-lg">
                {projectStatus === "in_progress" ? "Project In Progress" : 
                 projectStatus === "completed_by_designer" ? "Ready for Review" : 
                 "Project Completed"}
              </h2>
              <p>
                {projectStatus === "in_progress" ? 
                  (role === "designer" 
                    ? "You are currently working on this project. Mark it as completed when you're done." 
                    : "The designer is currently working on your project.") : 
                 projectStatus === "completed_by_designer" ? 
                  (role === "client" 
                    ? "The designer has completed the project. Please review and confirm completion." 
                    : "You've marked this project as completed. Waiting for client confirmation.") : 
                  "This project has been completed and signed off by both parties."}
              </p>
            </div>
            
            {/* Status Actions */}
            <div>
              {role === "designer" && projectStatus === "in_progress" && (
                <button
                  onClick={handleMarkAsCompletedByDesigner}
                  disabled={updateLoading}
                  className={`px-5 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105 ${updateLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {updateLoading ? "Updating..." : "Mark as Completed"}
                </button>
              )}
              
              {role === "client" && projectStatus === "completed_by_designer" && (
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={updateLoading}
                  className={`px-5 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105 ${updateLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {updateLoading ? "Updating..." : "Confirm Completion"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="md:col-span-2">
            
            {/* Model Files Section */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Design Model</h2>
                <p className="text-gray-600 text-sm">
                  {role === "designer" && projectStatus !== "completed" 
                    ? "Upload your design file for the client to view." 
                    : modelFiles.length > 0 
                    ? "You can view and download the design files below." 
                    : "No design files have been uploaded yet."}
                </p>
              </div>
              
              <div className="p-6 bg-gray-50">
                {role === "designer" && projectStatus !== "completed" ? (
                  <ModelUploader 
                    designerId={user.uid} 
                    projectId={proposalId}
                    onUploadSuccess={handleModelUploadSuccess}
                    onUploadError={(err) => setError(err.message)}
                  />
                ) : (
                  <ModelDownloader modelFiles={modelFiles} />
                )}
              </div>
            </div>
            
            {/* Rating Form - Only show for clients after project completion */}
            {role === "client" && projectStatus === "completed" && showRatingForm && (
              <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Rate Designer</h2>
                <DesignerRating 
                  clientId={user.uid}
                  designerId={proposal?.designerId}
                  projectId={proposalId}
                  onRatingSubmit={handleRatingSubmit}
                />
              </div>
            )}

            <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Details</h2>
              </div>
              
              <div className="p-6">
                {request && (
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900 mb-3">Request Information</h3>
                    <p className="text-gray-600 mb-4">{request.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 block mb-1">Budget:</span>
                        <span className="font-medium text-gray-900">${request.budget}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 block mb-1">Duration:</span>
                        <span className="font-medium text-gray-900">{request.duration} days</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 block mb-1">Room Type:</span>
                        <span className="font-medium text-gray-900">{request.roomType}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 block mb-1">Posted:</span>
                        <span className="font-medium text-gray-900">{request.createdAt}</span>
                      </div>
                    </div>
                    {request.additionalDetails && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <span className="text-gray-500 block mb-1">Additional Details:</span>
                        <p className="text-gray-600">{request.additionalDetails}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Proposal Information</h3>
                  <p className="text-gray-600 mb-4">{proposal.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-500 block mb-1">Price:</span>
                      <span className="font-medium text-gray-900">${proposal.price}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-500 block mb-1">Estimated Time:</span>
                      <span className="font-medium text-gray-900">{proposal.estimatedTime} days</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-500 block mb-1">Submitted:</span>
                      <span className="font-medium text-gray-900">{proposal.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Info & Actions */}
          <div>
            {/* Contact Information */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  {role === "client" ? "Designer Information" : "Client Information"}
                </h2>
              </div>
              
              <div className="p-6">
                {role === "client" && designer && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-gray-500 text-sm mb-1">Name</h3>
                      <p className="font-medium text-gray-900">{designer.name || "Not provided"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-gray-500 text-sm mb-1">Email</h3>
                      <p className="font-medium text-gray-900">{designer.email}</p>
                    </div>
                    {designer.phone && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-gray-500 text-sm mb-1">Phone</h3>
                        <p className="font-medium text-gray-900">{designer.phone}</p>
                      </div>
                    )}
                    {designer.specialization && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-gray-500 text-sm mb-1">Specialization</h3>
                        <p className="font-medium text-gray-900">{designer.specialization}</p>
                      </div>
                    )}
                    {designer.experience && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-gray-500 text-sm mb-1">Experience</h3>
                        <p className="font-medium text-gray-900">{designer.experience} years</p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/designer-portfolio/${designer.id}`)}
                      className="w-full mt-2 px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105"
                    >
                      View Portfolio
                    </button>
                  </div>
                )}
                
                {role === "designer" && client && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-gray-500 text-sm mb-1">Name</h3>
                      <p className="font-medium text-gray-900">{client.name || "Not provided"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-gray-500 text-sm mb-1">Email</h3>
                      <p className="font-medium text-gray-900">{client.email}</p>
                    </div>
                    {client.phone && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-gray-500 text-sm mb-1">Phone</h3>
                        <p className="font-medium text-gray-900">{client.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Project Actions */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Project Actions</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <button
                    onClick={startConversation}
                    className="w-full px-5 py-3 border border-[#C19A6B] text-[#C19A6B] rounded-lg hover:bg-[#C19A6B]/10 transition-all flex items-center justify-center gap-2"
                  >
                    <FiMessageSquare />
                    <span>Message {role === "client" ? "Designer" : "Client"}</span>
                  </button>
                  
                  <button
                    onClick={() => navigate('/projects')}
                    className="w-full px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <FiSettings />
                    <span>Project Panel</span>
                  </button>
                  
                  {role === "designer" && projectStatus === "in_progress" && (
                    <button
                      onClick={handleMarkAsCompletedByDesigner}
                      className="w-full px-5 py-3 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      disabled={updateLoading}
                    >
                      <FiCheck />
                      <span>
                        {updateLoading ? "Processing..." : "Mark as Completed"}
                      </span>
                    </button>
                  )}
                  
                  {role === "client" && projectStatus === "completed_by_designer" && (
                    <button
                      onClick={handleMarkAsCompleted}
                      className="w-full px-5 py-3 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      disabled={updateLoading}
                    >
                      <FiCheck />
                      <span>
                        {updateLoading ? "Processing..." : "Confirm Completion"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectPage;