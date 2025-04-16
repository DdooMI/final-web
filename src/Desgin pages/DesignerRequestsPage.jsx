/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { formatDistanceToNow } from "date-fns";
import { createNotification } from "../firebase/notifications";
import ImageZoomModal from "../Components/ImageZoomModal";

function DesignerRequestsPage() {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [proposalData, setProposalData] = useState({
    price: "",
    estimatedTime: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasProposed, setHasProposed] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    if (selectedRequest) {
      const checkExistingProposal = async () => {
        try {
          const q = query(
            collection(db, "designProposals"),
            where("requestId", "==", selectedRequest.id),
            where("designerId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          setHasProposed(!querySnapshot.empty);
        } catch (err) {
          console.error("Error checking existing proposal:", err);
        }
      };
      checkExistingProposal();
    }
  }, [selectedRequest, user.uid]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(
          collection(db, "designRequests")
        );
        const querySnapshot = await getDocs(q);
        const requestsData = [];

        querySnapshot.forEach((doc) => {
          requestsData.push({
            id: doc.id,
            ...doc.data(),
            createdAtTimestamp: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
            createdAt: doc.data().createdAt
              ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true })
              : "Unknown date",
          });
        });

        // Sort requests from newest to oldest
        requestsData.sort((a, b) => {
          // Handle cases where createdAt might be null
          if (!a.createdAtTimestamp) return 1;
          if (!b.createdAtTimestamp) return -1;
          // Sort in descending order (newest first)
          return b.createdAtTimestamp - a.createdAtTimestamp;
        });

        setRequests(requestsData);
      } catch (err) {
        setError("Failed to load requests: " + err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProposalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();

    if (selectedRequest.status === "completed") {
      setError("Cannot submit proposal for a completed request.");
      return;
    }

    if (Number(proposalData.price) > Number(selectedRequest.budget)) {
      setError(
        "Proposal price cannot exceed client's budget of $" +
          selectedRequest.budget
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Add the proposal to Firestore
      const proposalRef = await addDoc(collection(db, "designProposals"), {
        requestId: selectedRequest.id,
        designerId: user.uid,
        designerEmail: user.email,
        clientId: selectedRequest.userId,
        title: selectedRequest.title,
        price: proposalData.price,
        estimatedTime: proposalData.estimatedTime,
        description: proposalData.description,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Update the request status
      const requestRef = doc(db, "designRequests", selectedRequest.id);
      await updateDoc(requestRef, {
        status: "pending"
      });

      // Create notification for the client
      await createNotification({
        userId: selectedRequest.userId,
        title: "New Design Proposal",
        message: `A designer has submitted a proposal for your ${selectedRequest.title} request.`,
        type: "info",
        relatedId: selectedRequest.id
      });

      setSubmitSuccess(true);
      // Reset form
      setProposalData({
        price: "",
        estimatedTime: "",
        description: "",
      });
      setSelectedRequest(null);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Client Design Requests
        </h1>

        {submitSuccess && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline">
              {" "}
              Your proposal has been submitted successfully.
            </span>
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
              No design requests available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Request List */}
            <div className="bg-white shadow rounded-lg p-6 overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Available Requests
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
                    <div className="mt-1 text-xs text-gray-400">
                      Posted {request.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal Form */}
            {selectedRequest ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {hasProposed ? "Proposal Already Submitted" : "Submit a Proposal"}
                </h2>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">
                    {selectedRequest.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedRequest.description}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
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
                      <span className="text-gray-500">Client:</span>{" "}
                      {selectedRequest.userEmail}
                    </div>
                  </div>
                  
                  {/* Reference Image Display */}
                  {selectedRequest.referenceImageUrl && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Image</h4>
                      <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-300 cursor-pointer">
                        <img
                          src={selectedRequest.referenceImageUrl}
                          alt="Reference Image"
                          className="w-full h-full object-contain"
                          onClick={() => setZoomImage(selectedRequest.referenceImageUrl)}
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
                </div>

                {hasProposed ? (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800">
                      You have already submitted a proposal for this request. You cannot submit multiple proposals for the same request.
                    </p>
                  </div>
                ) : selectedRequest.status === "completed" ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800">
                      This request has been completed. You can view it but cannot submit a proposal.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProposal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Your Price (USD)
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={proposalData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="estimatedTime"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Estimated Time (days)
                      </label>
                      <input
                        type="number"
                        id="estimatedTime"
                        name="estimatedTime"
                        value={proposalData.estimatedTime}
                        onChange={handleChange}
                        required
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Proposal Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={proposalData.description}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
                      placeholder="Describe your approach, ideas, and why you're the right designer for this project..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Proposal"}
                    </button>
                  </div>
                </form>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Select a request from the list to submit your proposal
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignerRequestsPage;