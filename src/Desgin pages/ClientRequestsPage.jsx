import React, { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, Link } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { FiMessageSquare, FiCheck, FiX } from "react-icons/fi";

import { db } from "../firebase/firebaseConfig";
import { createNotification } from "../firebase/notifications";

function ClientRequestsPage() {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [proposals, setProposals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Handle updating proposal status (accept/reject)
  const handleUpdateProposalStatus = async (proposalId, newStatus) => {
    if (!proposalId) return;
    
    setUpdateLoading(true);
    setError(null);
    
    try {
      const proposalRef = doc(db, "designProposals", proposalId);
      const proposalSnap = await getDoc(proposalRef);
      
      if (!proposalSnap.exists()) {
        throw new Error("Proposal not found");
      }
      
      const proposalData = proposalSnap.data();
      
      // Update proposal status
      await updateDoc(proposalRef, {
        status: newStatus,
      });
      
      // Create notification for designer
      await createNotification({
        userId: proposalData.designerId,
        title: `Proposal ${newStatus}`,
        message: newStatus === "accepted" 
          ? `Your proposal for "${selectedRequest.title}" has been accepted by the client. You can now access the project page.` 
          : newStatus === "completed" 
          ? `Your proposal for "${selectedRequest.title}" has been confirmed as completed by the client.`
          : `Your proposal for "${selectedRequest.title}" has been ${newStatus} by the client.`,
        type: newStatus === "accepted" || newStatus === "completed" ? "success" : "info",
        relatedId: proposalId,
      });
      
      // If accepting a proposal, initialize project status and update request status
      if (newStatus === "accepted") {
        await updateDoc(proposalRef, {
          projectStatus: "in_progress",
        });
        
        // Update the request status to in_progress
        const requestRef = doc(db, "designRequests", selectedRequest.id);
        await updateDoc(requestRef, {
          status: "in_progress"
        });
        
        // Update local state for the request
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === selectedRequest.id ? { ...req, status: "in_progress" } : req
          )
        );
      } else if (newStatus === "completed") {
        // Update the request status to completed
        const requestRef = doc(db, "designRequests", selectedRequest.id);
        await updateDoc(requestRef, {
          status: "completed"
        });
        
        // Update local state for the request
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === selectedRequest.id ? { ...req, status: "completed" } : req
          )
        );
      }
      
      // Update local state
      setProposals((prevProposals) => {
        const updatedProposals = { ...prevProposals };
        
        // Update the specific proposal in the correct request
        if (updatedProposals[selectedRequest.id]) {
          updatedProposals[selectedRequest.id] = updatedProposals[selectedRequest.id].map((p) =>
            p.id === proposalId ? { ...p, status: newStatus } : p
          );
        }
        
        return updatedProposals;
      });
      
      // If accepting a proposal, reject all other pending proposals for this request
      if (newStatus === "accepted") {
        const otherProposals = proposals[selectedRequest.id].filter(
          (p) => p.id !== proposalId && p.status === "pending"
        );
        
        for (const proposal of otherProposals) {
          const otherProposalRef = doc(db, "designProposals", proposal.id);
          await updateDoc(otherProposalRef, {
            status: "rejected",
          });
          
          // Create notification for other designers
          await createNotification({
            userId: proposal.designerId,
            title: "Proposal rejected",
            message: `Another proposal has been accepted for "${selectedRequest.title}".`,
            type: "info",
            relatedId: proposal.id,
          });
        }
        
        // Update local state for other proposals
        setProposals((prevProposals) => {
          const updatedProposals = { ...prevProposals };
          
          if (updatedProposals[selectedRequest.id]) {
            updatedProposals[selectedRequest.id] = updatedProposals[selectedRequest.id].map((p) =>
              p.id !== proposalId && p.status === "pending" ? { ...p, status: "rejected" } : p
            );
          }
          
          return updatedProposals;
        });
      }
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };



  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Get client's requests
        const q = query(
          collection(db, "designRequests"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const requestsData = [];

        querySnapshot.forEach((doc) => {
          requestsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt
            ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true })
            : "Unknown date",
          });
        });

        setRequests(requestsData);
        
        // Check if there's a requestId in the URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const requestId = urlParams.get('requestId');
        
        if (requestId) {
          // Find the request with the matching ID
          const requestToSelect = requestsData.find(req => req.id === requestId);
          if (requestToSelect) {
            setSelectedRequest(requestToSelect);
          }
        }

        // Get proposals for each request
        const proposalsData = {};
        for (const request of requestsData) {
          const proposalsQuery = query(
            collection(db, "designProposals"),
            where("requestId", "==", request.id)
          );
          const proposalsSnapshot = await getDocs(proposalsQuery);

          const requestProposals = [];
          proposalsSnapshot.forEach((doc) => {
            requestProposals.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt
              ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true })
              : "Unknown date",
            });
          });

          proposalsData[request.id] = requestProposals;
        }

        setProposals(proposalsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user.uid]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Track the status of your design requests and view designer proposals
          </p>
          <Link
            to="/client-request"
            className="px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition"
          >
            New Request
          </Link>
        </div>

        {updateSuccess && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Proposal status updated successfully.</span>
          </div>
        )}
        
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-lg text-gray-700">
              You haven't submitted any design requests yet.
            </p>
            <Link
              to="/client-request"
              className="mt-4 inline-block px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition"
            >
              Submit Your First Request
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Request List */}
            <div className="bg-white shadow rounded-lg p-6 overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Requests
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 cursor-pointer transition hover:border-[#C19A6B] ${
                      selectedRequest?.id === request.id
                        ? "border-[#C19A6B] bg-[#C19A6B]/5"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900">
                        {request.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>Budget: ${request.budget}</span>
                      <span>Room: {request.roomType}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>Posted: {request.createdAt}</span>
                      <span>
                        {proposals[request.id]?.length || 0} proposals
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal Details */}
            {selectedRequest ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Request Details
                </h2>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">
                      {selectedRequest.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                        selectedRequest.status
                      )}`}
                    >
                      {selectedRequest.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedRequest.description}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Budget:</span> $
                      {selectedRequest.budget}
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>{" "}
                      {selectedRequest.duration} days
                    </div>
                    <div>
                      <span className="text-gray-500">Room Type:</span>{" "}
                      {selectedRequest.roomType}
                    </div>
                    <div>
                      <span className="text-gray-500">Posted:</span>{" "}
                      {selectedRequest.createdAt}
                    </div>
                  </div>
                  {selectedRequest.additionalDetails && (
                    <div className="mt-3">
                      <span className="text-gray-500">Additional Details:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedRequest.additionalDetails}
                      </p>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Designer Proposals
                </h3>
                {proposals[selectedRequest.id]?.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {proposals[selectedRequest.id].map((proposal) => (
                      <div
                        key={proposal.id}
                        className="border rounded-lg p-4 hover:border-[#C19A6B] transition"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">
                            Proposal from {proposal.designerEmail}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                              proposal.status
                            )}`}
                          >
                            {proposal.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {proposal.description}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Price:</span> $
                            {proposal.price}
                          </div>
                          <div>
                            <span className="text-gray-500">
                              Estimated Time:
                            </span>{" "}
                            {proposal.estimatedTime} days
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted:</span>{" "}
                            {proposal.createdAt}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          {proposal.status !== "rejected" && (
                            <button
                              className="px-4 py-2 border border-[#C19A6B] text-[#C19A6B] rounded-md hover:bg-[#C19A6B]/10 transition flex items-center gap-2 shadow-sm"
                              onClick={async () => {
                                try {
                                  // Import needed only when the function is called
                                  const { sendMessage } = await import("../firebase/messages");
                                  
                                  // Start a new conversation with the designer
                                  const conversationId = await sendMessage({
                                    senderId: user.uid,
                                    receiverId: proposal.designerId,
                                    content: `Hello, I'm interested in your proposal for my "${selectedRequest.title}" request.`,
                                  });
                                  
                                  // Navigate to the conversation
                                  window.location.href = `/messages/${conversationId}`;
                                } catch (error) {
                                  console.error("Error starting conversation:", error);
                                  alert("Failed to start conversation. Please try again.");
                                }
                              }}
                            >
                              <FiMessageSquare className="text-[#C19A6B]" />
                              <span>Message Designer</span>
                            </button>
                          )}

                          {proposal.status === "pending" && (
                            <div className="flex space-x-2">
                              <button
                                className="px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition flex items-center gap-2 shadow-sm font-medium"
                                onClick={() => handleUpdateProposalStatus(proposal.id, "accepted")}
                                disabled={updateLoading}
                              >
                                <FiCheck className="text-white" />
                                <span>{updateLoading ? "Processing..." : "Accept"}</span>
                              </button>
                              <button
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition flex items-center gap-2 shadow-sm font-medium"
                                onClick={() => handleUpdateProposalStatus(proposal.id, "rejected")}
                                disabled={updateLoading}
                              >
                                <FiX className="text-white" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No proposals received yet for this request.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Select a request from the list to view details and proposals
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientRequestsPage;
