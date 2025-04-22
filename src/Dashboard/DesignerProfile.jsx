import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, BriefcaseIcon, CalendarIcon, StarIcon } from '@heroicons/react/24/outline';
import { getDesignerById } from '../firebase/designers';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export default function DesignerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchDesigner = async () => {
      try {
        setLoading(true);
        const designerData = await getDesignerById(id);
        if (!designerData) {
          throw new Error('Designer not found');
        }
        setDesigner(designerData);
        await fetchProjects(id);
      } catch (err) {
        console.error('Error fetching designer:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigner();
  }, [id]);

  const fetchProjects = async (designerId) => {
    try {
      // Query for completed and accepted projects
      const q = query(
        collection(db, 'designProposals'),
        where('designerId', '==', designerId),
        where('status', 'in', ['completed', 'accepted','rejected','pending'])
      );

      const querySnapshot = await getDocs(q);
      const projectsData = await Promise.all(querySnapshot.docs.map(async docu => {
        const proposalData = docu.data();
        
        // Get the original request data for the reference image
        const requestRef = doc(db, 'designRequests', proposalData.requestId);
        const requestSnap = await getDoc(requestRef);
        
        // Get client profile
        const clientProfileRef = doc(db, 'users', proposalData.clientId, 'profile', 'profileInfo');
        const clientProfileSnap = await getDoc(clientProfileRef);
        console.log(proposalData);
        console.log(requestSnap.data());
        return {
          id: docu.id,
          ...proposalData,
          referenceImageUrl: requestSnap.exists()
            ? requestSnap.data().referenceImageUrl
            : '/project-placeholder.jpg',
          clientName: clientProfileSnap.exists() ? clientProfileSnap.data().name : 'Unknown Client',
          clientAvatar: clientProfileSnap.exists() ? clientProfileSnap.data().photoURL : '/person.gif',
          completedAt: proposalData.updatedAt ? proposalData.updatedAt.toDate() : new Date(),
          rating: proposalData.clientRating || 0,
          budget: requestSnap.data().budget || 0
        };
      }));

      setProjects(projectsData.sort((a, b) => b.completedAt - a.completedAt));
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const formatDate = (date) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(d);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B82F6] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading designer profile...</p>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Designer not found</h2>
        <p className="mt-2 text-gray-600">{error || 'The requested designer could not be found.'}</p>
        <button 
          onClick={() => navigate('/dashboard/designers')}
          className="mt-4 px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-[#2563EB]"
        >
          Return to Designers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={designer.photoURL || '/person.gif'}
            alt={designer.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-[#3B82F6]"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{designer.name}</h1>
            <p className="text-gray-600">Designer</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href={`mailto:${designer.email}`} className="text-[#3B82F6] hover:text-[#2563EB]">
                  {designer.email}
                </a>
              </div>
              {designer.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <a href={`tel:${designer.phone}`} className="text-[#3B82F6] hover:text-[#2563EB]">
                    {designer.phone}
                  </a>
                </div>
              )}
              {designer.location && (
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">{designer.location}</span>
                </div>
              )}
              {designer.specialties && (
                <div className="flex items-center">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">{designer.specialties.join(', ')}</span>
                </div>
              )}
              {designer.joiningDate && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    Joined {new Date(designer.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Balance Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-[#3B82F6]">
              ${designer.balance?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={project.referenceImageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{project.title}</h3>
                    <div className="flex items-center mb-2">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium text-gray-700">{project.rating}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      <p>Client: {project.clientName}</p>
                      <p>Completed: {formatDate(project.completedAt)}</p>
                      <p>Status: {project.status}</p>
                    </div>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Client Budget:</span>
                          <span className="ml-1 text-[#3B82F6] font-medium">
                            ${ project.budget|| '0.00'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Designer Price:</span>
                          <span className="ml-1 text-[#3B82F6] font-medium">
                            ${ project.price || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No projects found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
