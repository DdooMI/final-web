import { useState } from "react";
import { useScene } from "../context/SceneContext";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { createNotification } from "../../firebase/notifications";

export default function ClientApproval() {
  const { state, dispatch } = useScene();
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [error, setError] = useState(null);

  const toggleApprovalPanel = () => {
    setShowApprovalPanel((prev) => !prev);
  };

  const handleApprovalSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get client ID from authentication
      const clientId = auth.currentUser ? auth.currentUser.uid : "client-123";

      // Generate a design ID if not available
      // In a real app, this would come from props or context
      const designId = `design-${clientId}-${Date.now()}`;

      // Prepare approval data
      const approvalData = {
        approved: true,
        approvedAt: serverTimestamp(),
        comment: approvalComment,
        clientId: clientId,
        designData: {
          objects: state.objects,
          walls: state.walls,
          floors: state.floors,
          houseDimensions: state.houseDimensions,
        },
      };

      // Create a reference to the design document in Firestore
      const designRef = doc(db, "designs", designId);

      try {
        // Create a new document with the design data
        await setDoc(designRef, {
          designApproval: approvalData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          clientId: clientId,
          designData: approvalData.designData,
        });

        // Create notification for the designer
        // In a real app, you would get the designer ID from the project data
        const designerId = "designer-123"; // Placeholder designer ID
        await createNotification({
          userId: designerId,
          title: "Design Approved",
          message: `The client has approved your design. You can now proceed with the final delivery.`,
          type: "success",
          relatedId: designId,
        });
      } catch (firebaseError) {
        console.error("Firebase operation failed:", firebaseError);
        throw firebaseError;
      }

      // Update local state to reflect approval
      dispatch({
        type: "SET_DESIGN_APPROVAL",
        payload: approvalData,
      });

      // Update the design state in Firestore instead of using localStorage
      // This ensures data consistency across devices and sessions
      try {
        // Get the current user's design state document if it exists
        const userDesignRef = doc(db, "userDesigns", clientId);
        const userDesignSnap = await getDoc(userDesignRef);

        if (userDesignSnap.exists()) {
          // Update existing document
          await updateDoc(userDesignRef, {
            designApproval: approvalData,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create new document if it doesn't exist
          await setDoc(userDesignRef, {
            designApproval: approvalData,
            designData: approvalData.designData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (firestoreError) {
        console.error(
          "Error updating design state in Firestore:",
          firestoreError
        );
        // Continue with the approval process even if this update fails
      }

      setApprovalSuccess(true);
      setTimeout(() => {
        setShowApprovalPanel(false);
        setApprovalSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting approval:", error);
      setError("Failed to submit approval. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute right-4 bottom-4 z-10">
      <button
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-colors duration-200 ${
          showApprovalPanel
            ? "bg-green-500 text-white"
            : "bg-white hover:bg-gray-100"
        }`}
        onClick={toggleApprovalPanel}
        aria-label="Client Approval"
      >
        👍
      </button>

      {showApprovalPanel && (
        <div className="absolute right-0 bottom-16 w-80 bg-white rounded-lg shadow-lg p-4 z-20">
          <h3 className="text-lg font-semibold mb-4">Approve Design</h3>

          {approvalSuccess ? (
            <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
              Design has been approved successfully!
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                By approving this design, you confirm that it meets your
                requirements and is ready for final implementation.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="approvalComment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Comments (optional)
                </label>
                <textarea
                  id="approvalComment"
                  rows="3"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Add any final comments or feedback..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  onClick={() => setShowApprovalPanel(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center"
                  onClick={handleApprovalSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
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
                    </>
                  ) : (
                    "Approve Design"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
