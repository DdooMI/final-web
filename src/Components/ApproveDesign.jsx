/* eslint-disable react/prop-types */
import { useState } from "react";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createNotification } from "../firebase/notifications";
import { FiCheck } from "react-icons/fi";

const ApproveDesign = ({ projectId, designerId, onApproveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleApproveClick = () => {
    setShowConfirmation(true);
  };

  const handleCancelApprove = () => {
    setShowConfirmation(false);
  };

  const handleConfirmApprove = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the current proposal data
      const proposalRef = doc(db, "designProposals", projectId);
      const proposalSnap = await getDoc(proposalRef);

      if (!proposalSnap.exists()) {
        throw new Error("Proposal not found");
      }

      // Update the proposal status
      await updateDoc(proposalRef, {
        status: "approved",
        approvedAt: serverTimestamp(),
        projectStatus: "approved",
      });

      // Create notification for the designer
      await createNotification({
        userId: designerId,
        title: "Design Approved",
        message: `The client has approved your design. You can now proceed with the final delivery.`,
        type: "success",
        relatedId: projectId,
      });

      // Call the success callback
      if (onApproveSuccess) {
        onApproveSuccess();
      }

      setShowConfirmation(false);
    } catch (err) {
      console.error("Error approving design:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Design Approval
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {showConfirmation ? (
        <div>
          <p className="mb-4 text-gray-700">
            Are you sure you want to approve this design? This action cannot be
            undone.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancelApprove}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center"
              disabled={loading}
            >
              {loading ? (
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
                  Processing...
                </span>
              ) : (
                <>
                  <FiCheck className="mr-2" />
                  Confirm Approval
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-700">
            Once you approve this design, the designer will be notified and can
            proceed with the final delivery.
          </p>

          <button
            onClick={handleApproveClick}
            className="w-full px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition flex items-center justify-center"
          >
            <FiCheck className="mr-2" />
            Approve Design
          </button>
        </div>
      )}
    </div>
  );
};

export default ApproveDesign;
