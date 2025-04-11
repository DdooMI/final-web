/* eslint-disable no-unused-vars */
import { formatDistanceToNow } from "date-fns";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiCheck, FiCode, FiDollarSign, FiDownload, FiMessageSquare, FiSettings } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import DesignerRating from "../Components/DesignerRating";
import ErrorBoundary from "../Components/ErrorBoundary";
import ImageZoomModal from "../Components/ImageZoomModal";
import { db } from "../firebase/firebaseConfig";
import { createNotification } from "../firebase/notifications";
import { useAuth } from "../zustand/auth";
import { useBalance } from "../zustand/balance";

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
  const [zoomImage, setZoomImage] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [htmlFileName, setHtmlFileName] = useState('');

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
        const processedProposal = {
          id: proposalSnap.id,
          ...proposalData,
          createdAt: proposalData.createdAt
            ? formatDistanceToNow(proposalData.createdAt.toDate(), { addSuffix: true })
            : "Unknown date",
          htmlUpdatedAt: proposalData.htmlUpdatedAt
            ? formatDistanceToNow(proposalData.htmlUpdatedAt.toDate(), { addSuffix: true })
            : "Not updated yet"
        };
        setProposal(processedProposal);

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

        // Get HTML content if any
        if (proposalData.htmlContent) {
          setHtmlContent(proposalData.htmlContent);
          setHtmlFileName(proposalData.htmlFileName || 'design.html');
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
      // Validate HTML content exists
      const proposalSnap = await getDoc(doc(db, "designProposals", proposalId));
      const content = proposalSnap.data()?.htmlContent;

      if (!content) {
        throw new Error('Please upload HTML design before marking as completed');
      }

      const proposalRef = doc(db, "designProposals", proposalId);

      // Update proposal status
      await updateDoc(proposalRef, {
        projectStatus: "completed_by_designer",
        htmlUpdatedAt: serverTimestamp()
      });

      // Refresh proposal data
      const updatedProposal = await getDoc(proposalRef);
      if (updatedProposal.exists()) {
        const updatedData = updatedProposal.data();

        const processedData = {
          ...updatedData,
          htmlUpdatedAt: updatedData.htmlUpdatedAt
            ? formatDistanceToNow(updatedData.htmlUpdatedAt.toDate(), { addSuffix: true })
            : "Recently"
        };

        setProposal(prev => ({
          ...prev,
          ...processedData
        }));
      }

      // Create notification for client
      await createNotification({
        userId: proposal?.clientId,
        title: "Project Completed by Designer",
        message: `The designer has completed your project "${request?.title || 'Design Project'}". Please review and mark it as completed if you're satisfied.`,
        type: "success",
        relatedId: proposalId,
      });

      // Update local state
      setProjectStatus("completed_by_designer");

      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Status update failed:', err);
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
      const proposalRef = doc(db, "designProposals", proposalId);

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
          const clientRef = doc(db, 'users', proposal.clientId);
          const designerRef = doc(db, 'users', proposal.designerId);

          await runTransaction(db, async (transaction) => {
            const clientDoc = await transaction.get(clientRef);
            const designerDoc = await transaction.get(designerRef);

            if (!clientDoc.exists() || !designerDoc.exists()) {
              throw new Error('User documents not found');
            }

            const clientBalance = clientDoc.data().balance || 0;
            const transferAmount = parseFloat(proposal.price);

            if (clientBalance < transferAmount) {
              throw new Error('Client has insufficient balance for transfer');
            }

            // Update client balance
            transaction.update(clientRef, {
              balance: clientBalance - transferAmount
            });

            // Update designer balance
            const designerBalance = designerDoc.data().balance || 0;
            transaction.update(designerRef, {
              balance: designerBalance + transferAmount
            });
          });
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
        userId: proposal?.designerId,
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
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Status update failed:', err);
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle HTML upload success
  const handleHtmlUploadSuccess = async (fileInfo) => {
    // Validate required fields
    if (!fileInfo?.htmlContent) {
      setError('Invalid file upload - missing HTML content');
      return;
    }

    try {
      // Update local state
      setHtmlContent(fileInfo.htmlContent);
      setHtmlFileName(fileInfo.fileName || 'design.html');

      // Update Firestore document
      const proposalRef = doc(db, "designProposals", proposalId);
      await updateDoc(proposalRef, {
        htmlContent: fileInfo.htmlContent,
        htmlFileName: fileInfo.fileName || 'design.html',
        htmlUpdatedAt: serverTimestamp()
      });

      // Show success message
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving HTML content:', err);
      setError(err.message || 'Failed to save HTML content');
    }
  }
 
  // Handle rating submission
  const handleRatingSubmit = (ratingData) => {
    // Hide the rating form after submission
    setShowRatingForm(false);
  };

  // Start a conversation with the other party
  const startConversation = async () => {
    try {
      // Import needed only when the function is called
      const { sendMessage, findExistingConversation } = await import("../firebase/messages");

      // Determine sender and receiver based on user role
      const senderId = user.uid;
      const receiverId = role === "client" ? proposal.designerId : proposal.clientId;

      // Check if there's an existing conversation between these users
      let conversationId = await findExistingConversation(senderId, receiverId);

      // If no existing conversation, create a new one with greeting message
      if (!conversationId) {
        conversationId = await sendMessage({
          senderId,
          receiverId,
          content: `Hello, I'm messaging about the project "${request?.title || 'Design Project'}".`,
        });
      }

      // Navigate to the conversation without sending duplicate message
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
          <p className="text-gray-700 mb-6">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
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
  // Function to safely format timestamp with error handling
  const formatTimestamp = (timestamp) => {
    try {
      if (typeof timestamp === 'string') {
        return timestamp;
      } else if (timestamp?.toDate) {
        // Handle Firestore Timestamp
        const updatedDate = timestamp.toDate();
        return updatedDate.toLocaleString();
      } else if (timestamp?.seconds) {
        // Fallback for raw timestamp
        const updatedDate = new Date(timestamp.seconds * 1000);
        return updatedDate.toLocaleString();
      } else {
        return "recently";
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return "recently";
    }
  };

  let lastUpdatedText = "No HTML design has been uploaded yet.";
  if (htmlContent) {
    if (proposal?.htmlUpdatedAt) {
      lastUpdatedText = `You can view the HTML design below (last updated ${formatTimestamp(proposal.htmlUpdatedAt)})`;
    } else {
      lastUpdatedText = "You can view the HTML design below.";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with navigation */}
        <div className="mb-6 bg-white shadow-md rounded-xl p-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <ErrorBoundary fallback="Project Information">
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
            </ErrorBoundary>
          </div>
          <div className="flex space-x-3">
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


        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="md:col-span-2">

            {/* HTML Content Section */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">HTML Design</h2>
                <ErrorBoundary fallback="HTML design information is available.">
                  <p className="text-gray-600 text-sm">
                    {role === "designer" 
                      ? (projectStatus !== "completed"
                          ? "Upload your HTML design for the client to view."
                          : lastUpdatedText)
                      : "You can view the HTML design below"}
                  </p>
                </ErrorBoundary>

              </div>

              <div className="p-6 bg-gray-50">
                {role === "designer" && projectStatus !== "completed" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C19A6B] transition-colors bg-gray-50">
                      <input
                        type="file"
                        id="html-file"
                        accept=".html,.htm"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;

                          if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
                            setError('Only .html/.htm files are supported');
                            return;
                          }

                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const htmlContent = event.target.result;
                            handleHtmlUploadSuccess({
                              htmlContent,
                              fileName: file.name
                            });
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <label
                        htmlFor="html-file"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <FiCode className="text-4xl text-[#C19A6B] mb-3" />
                        <p className="text-lg font-medium text-gray-700 mb-1">Upload HTML Design</p>
                        <p className="text-sm text-gray-500 mb-4">Click to browse or drag and drop</p>
                        <span className="px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition-colors inline-flex items-center">
                          <FiCode className="mr-2" /> Select HTML File
                        </span>
                      </label>
                    </div>

                    <button
                      onClick={handleMarkAsCompletedByDesigner}
                      className="w-full bg-[#C19A6B] text-white px-4 py-2 rounded-lg hover:bg-[#A0784A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updateLoading || !htmlContent || projectStatus === "completed_by_designer"}
                    >
                      {updateLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </span>
                      ) : projectStatus === "completed_by_designer" ? (
                        <span className="flex items-center justify-center">
                          <FiCheck className="mr-2" />
                          Marked as Completed
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <FiCheck className="mr-2" />
                          Mark as Completed
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* HTML content preview */}
                {htmlContent && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      
                      {(role === "designer" || projectStatus === "completed") && (
                        <>
                        <p className="text-sm text-green-600 font-medium">HTML design has been uploaded successfully</p>
                        <button
                          onClick={() => {
                            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = htmlFileName || 'design.html';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="px-3 py-1.5 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition-colors inline-flex items-center text-sm"
                        >
                          <FiDownload className="mr-1" /> Download HTML
                        </button>
                        </>
                      )}
                    </div>

                    {/* HTML Preview */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{htmlFileName || 'design.html'}</span>
                        <span className="text-xs text-gray-500">HTML Preview</span>
                      </div>
                      <div className="h-[400px] overflow-hidden">
                        <iframe
                          srcDoc={htmlContent}
                          title="HTML Design Preview"
                          className="w-full h-full border-none"
                          sandbox="allow-scripts"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* For client to mark project as completed */}
                {role === "client" && projectStatus === "completed_by_designer" && (
                  <div className="mt-6">
                    <button
                      onClick={handleMarkAsCompleted}
                      className="w-full bg-[#C19A6B] text-white px-4 py-2 rounded-lg hover:bg-[#A0784A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <FiCheck className="mr-2" />
                          Mark Project as Completed
                        </span>
                      )}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      By marking this project as completed, you confirm that the design meets your requirements and the designer will receive payment.
                    </p>
                  </div>
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
                    {/* Reference Image Display */}
                    {request.referenceImageUrl && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Image</h4>
                        <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-300 cursor-pointer">
                          <img
                            src={request.referenceImageUrl}
                            alt="Reference Image"
                            className="w-full h-full object-contain"
                            onClick={() => setZoomImage(request.referenceImageUrl)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Image Zoom Modal */}
                    {zoomImage && (
                      <ImageZoomModal
                        imageUrl={zoomImage}
                        onClose={() => setZoomImage(null)}
                      />
                    )}
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

            {/* Project Actions */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Project Actions</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                <button
                      onClick={() => navigate(`/designer-portfolio/${role === 'client' ? proposal.designerId : proposal.clientId}`)}
                      className="w-full mt-2 px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all transform hover:scale-105"
                    >
                      View Portfolio
                    </button>
                  <button
                    onClick={startConversation}
                    className="w-full px-5 py-3 border border-[#C19A6B] text-[#C19A6B] rounded-lg hover:bg-[#C19A6B]/10 transition-all flex items-center justify-center gap-2"
                  >
                    <FiMessageSquare />
                    <span>Message {role === "client" ? "Designer" : "Client"}</span>
                  </button>

                  {role === "designer" && (
                    <button
                      onClick={() => navigate(`/projects?proposalId=${proposalId}`)}
                      className="w-full px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                      <FiSettings />
                      <span>Project Panel</span>
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

