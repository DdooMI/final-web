import { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { formatDistanceToNow } from "date-fns";

function DesignerProposalsPage() {
  const { user, role } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [requestDetails, setRequestDetails] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [clientNames, setClientNames] = useState({});

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        // Get designer's proposals
        const q = query(
          collection(db, "designProposals"),
          where("designerId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const proposalsData = [];

        querySnapshot.forEach((doc) => {
          proposalsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt:
              doc.data().createdAt
                ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true })
                : "Unknown date",
          });
        });

        setProposals(proposalsData);

        // Get request details for each proposal
        const requestDetailsData = {};
        for (const proposal of proposalsData) {
          if (proposal.requestId) {
            const requestDoc = await getDoc(
              doc(db, "designRequests", proposal.requestId)
            );
            if (requestDoc.exists()) {
              const requestData = requestDoc.data();
              requestDetailsData[proposal.requestId] = {
                ...requestData,
                createdAt:
                  requestData.createdAt
                    ? formatDistanceToNow(requestData.createdAt.toDate(), { addSuffix: true })
                    : "Unknown date",
              };
            }
          }
        }

        setRequestDetails(requestDetailsData);

        // Get client names for each proposal
        const clientIds = proposalsData.map(proposal => proposal.clientId).filter(Boolean);
        const uniqueClientIds = [...new Set(clientIds)];
        const clientNamesData = {};

        for (const clientId of uniqueClientIds) {
          // Get client's profile info
          const profileRef = collection(db, "users", clientId, "profile");
          const profileSnap = await getDocs(profileRef);
          let clientName = "Client";

          if (!profileSnap.empty) {
            clientName = profileSnap.docs[0].data().name || "Client";
          }

          clientNamesData[clientId] = clientName;
        }

        setClientNames(clientNamesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
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

  // Filter proposals based on status
  const filteredProposals =
    activeFilter === "all"
      ? proposals
      : proposals.filter((proposal) => proposal.status === activeFilter);

  // Handle marking proposal as completed
  const handleMarkAsCompleted = async (proposalId) => {
    if (!proposalId) return;

    setUpdateLoading(true);
    setError(null);

    try {
      const proposalRef = doc(db, "designProposals", proposalId);
      await updateDoc(proposalRef, {
        status: "completed",
      });

      // Update local state
      setProposals((prevProposals) =>
        prevProposals.map((p) =>
          p.id === proposalId ? { ...p, status: "completed" } : p
        )
      );

      if (selectedProposal?.id === proposalId) {
        setSelectedProposal((prev) => ({ ...prev, status: "completed" }));
      }

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-gray-900 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          My Proposals
        </motion.h1>

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Track the status of your design proposals submitted to clients
          </p>

          <div className="flex space-x-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "all"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "pending"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("pending")}
            >
              Pending
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "accepted"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("accepted")}
            >
              Accepted
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "rejected"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("rejected")}
            >
              Rejected
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "completed"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline">
              {" "}
              Proposal status updated successfully.
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
          </div>
        ) : filteredProposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow rounded-lg p-6 text-center"
          >
            {proposals.length === 0 ? (
              <p className="text-lg text-gray-700">
                You haven&apos;t submitted any design proposals yet.
              </p>
            ) : (
              <p className="text-lg text-gray-700">
                No proposals found with the selected filter.
              </p>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Proposals List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white shadow rounded-lg p-6 overflow-hidden"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Proposals {activeFilter !== "all" && `(${activeFilter})`}
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 p-2">
                {filteredProposals.map((proposal) => (
                  <motion.div
                    key={proposal.id}
                    whileHover={{ scale: 1.02 }}
                    className={`border rounded-lg p-4 cursor-pointer transition hover:border-[#C19A6B] ${selectedProposal?.id === proposal.id
                        ? "border-[#C19A6B] bg-[#C19A6B]/5"
                        : "border-gray-200"
                      }`}
                    onClick={() => setSelectedProposal(proposal)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900">
                        {requestDetails[proposal.requestId]?.title ||
                          "Unknown Request"}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          proposal.status
                        )}`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {proposal.description}
                    </p>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>Price: ${proposal.price}</span>
                      <span>Time: {proposal.estimatedTime} days</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Submitted: {proposal.createdAt}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Proposal Details */}
            {selectedProposal ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow rounded-lg p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Proposal Details
                </h2>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">
                      {requestDetails[selectedProposal.requestId]?.title ||
                        "Unknown Request"}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                        selectedProposal.status
                      )}`}
                    >
                      {selectedProposal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedProposal.description}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Your Price:</span> $
                      {selectedProposal.price}
                    </div>
                    <div>
                      <span className="text-gray-500">Estimated Time:</span>{" "}
                      {selectedProposal.estimatedTime} days
                    </div>
                    <div>
                      <span className="text-gray-500">Client:</span>{" "}
                      {clientNames[selectedProposal.clientId] || "Unknown Client"}
                    </div>
                    <div>
                      <span className="text-gray-500">Submitted:</span>{" "}
                      {selectedProposal.createdAt}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Request Information
                </h3>
                {requestDetails[selectedProposal.requestId] ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      {requestDetails[selectedProposal.requestId].description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Budget:</span> $
                        {requestDetails[selectedProposal.requestId].budget}
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>{" "}
                        {requestDetails[selectedProposal.requestId].duration} days
                      </div>
                      <div>
                        <span className="text-gray-500">Room Type:</span>{" "}
                        {requestDetails[selectedProposal.requestId].roomType}
                      </div>
                      <div>
                        <span className="text-gray-500">Posted:</span>{" "}
                        {requestDetails[selectedProposal.requestId].createdAt}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Request details not available</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  {selectedProposal.status === "accepted" && (
                    <button
                      className="px-3 py-1.5 bg-[#C19A6B] text-white rounded hover:bg-[#A0784A] transition"
                      onClick={() => handleMarkAsCompleted(selectedProposal.id)}
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Updating...
                        </span>
                      ) : (
                        "Mark as Completed"
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow rounded-lg p-6 flex items-center justify-center"
              >
                <p className="text-gray-500 text-center">
                  Select a proposal from the list to view details
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignerProposalsPage;
