import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../zustand/auth';
import { toast } from 'react-hot-toast';
import { saveAs } from 'file-saver';

export default function DesignPreview() {
  const { proposalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [designData, setDesignData] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const fetchDesignData = async () => {
      if (!proposalId || !user) return;

      try {
        const proposalRef = doc(db, 'designProposals', proposalId);
        const proposalSnap = await getDoc(proposalRef);

        if (!proposalSnap.exists()) {
          setError('Design not found');
          return;
        }

        const proposalData = proposalSnap.data();

        // Verify user has permission (must be the client)
        if (proposalData.clientId !== user.uid) {
          setError('You do not have permission to view this design');
          return;
        }

        setDesignData(proposalData);
        if (proposalData.htmlContent) {
          setHtmlContent(proposalData.htmlContent);
        }
      } catch (err) {
        console.error('Error fetching design:', err);
        setError('Failed to load design');
      } finally {
        setLoading(false);
      }
    };

    fetchDesignData();
  }, [proposalId, user]);

  const handleApproveDesign = async () => {
    if (!proposalId || !user || !designData) return;

    setIsApproving(true);
    try {
      const proposalRef = doc(db, 'designProposals', proposalId);
      
      // Update proposal status
      await updateDoc(proposalRef, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.uid
      });

      // Transfer budget to designer's balance
      const designerRef = doc(db, 'users', designData.designerId);
      const designerSnap = await getDoc(designerRef);
      
      if (designerSnap.exists()) {
        const currentBalance = designerSnap.data().balance || 0;
        await updateDoc(designerRef, {
          balance: currentBalance + designData.budget
        });
      }

      // Allow download
      if (htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        saveAs(blob, 'interior-design-scene.html');
      }

      toast.success('Design approved and downloaded successfully');
      navigate(`/client-requests?requestId=${designData.requestId}`);
    } catch (err) {
      console.error('Error approving design:', err);
      toast.error('Failed to approve design');
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Container */}
      <div className="h-[calc(100vh-120px)] bg-white shadow-lg rounded-lg overflow-hidden mx-4 my-4">
        {htmlContent ? (
          <iframe
            srcDoc={htmlContent}
            title="Design Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts"
          />
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No preview available</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleApproveDesign}
            disabled={isApproving || designData?.status === 'approved'}
            className={`px-6 py-2 rounded-lg transition-colors ${isApproving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#C19A6B] hover:bg-[#A0784A] text-white'}`}
          >
            {isApproving ? 'Approving...' : designData?.status === 'approved' ? 'Already Approved' : 'Approve & Download'}
          </button>
        </div>
      </div>
    </div>
  );
}