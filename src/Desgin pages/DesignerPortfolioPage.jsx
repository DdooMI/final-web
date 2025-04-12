/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../zustand/auth";
import { FiStar } from "react-icons/fi";
import { getDesignerRating } from "../firebase/ratings";
import RatingDetailsModal from "../Components/RatingDetailsModal";

function DesignerPortfolioPage() {
  const { designerId } = useParams();
  const { user, role } = useAuth();
  const [designer, setDesigner] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [designerRating, setDesignerRating] = useState({ averageRating: 0, ratingCount: 0 });
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchDesignerData = async () => {
      try {
        setLoading(true);

        // Get designer's user data
        const designerRef = doc(db, "users", designerId);
        const designerSnap = await getDoc(designerRef);

        if (!designerSnap.exists()) {
          throw new Error("Designer not found");
        }

        const designerData = designerSnap.data();

        // Get designer's profile info
        const profileRef = doc(
          db,
          "users",
          designerId,
          "profile",
          "profileInfo"
        );
        const profileSnap = await getDoc(profileRef);
        let profileData = { name: "Designer", photoURL: "" };

        if (profileSnap.exists()) {
          profileData = profileSnap.data();
        }

        // Combine user and profile data
        setDesigner({
          id: designerId,
          email: designerData.email,
          role: designerData.role,
          name: profileData.name,
          photoURL: profileData.photoURL,
          bio: profileData.bio || "No bio available",
          specialization: profileData.specialization || "Interior Design",
          experience: profileData.experience || "Not specified",
        });

        // Fetch designer rating
        try {
          const rating = await getDesignerRating(designerId);
          setDesignerRating(rating);
        } catch (error) {
          console.error('Error fetching designer rating:', error);
          setDesignerRating({ averageRating: 0, ratingCount: 0 });
        }

        // Get designer's completed projects
        const proposalsRef = collection(db, 'designProposals');
        const q = query(
          proposalsRef,
          where('designerId', '==', designerId),
          where('status', '==', 'completed')
        );

        const proposalsSnap = await getDocs(q);
        const projectsData = await Promise.all(proposalsSnap.docs.map(async (docu) => {
          const proposalData = docu.data();
          const requestRef = doc(db, 'designRequests', proposalData.requestId);
          const requestSnap = await getDoc(requestRef);
          
          // Get client profile
          const clientProfileRef = doc(db, 'users', proposalData.clientId, 'profile', 'profileInfo');
          const clientProfileSnap = await getDoc(clientProfileRef);
          const clientName = clientProfileSnap.exists()
            ? clientProfileSnap.data().name
            : 'Client';

          return {
            id: docu.id,
            ...proposalData,
            referenceImageUrl: requestSnap.exists()
              ? requestSnap.data().referenceImageUrl
              : '/project-placeholder.jpg',
            clientName,
            title: requestSnap.exists() ? requestSnap.data().title : 'Untitled Project'
          };
        }));

        setProjects(projectsData);
      } catch (err) {
        console.error("Error fetching designer data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (designerId) {
      fetchDesignerData();
    }
  }, [designerId]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 fixed top-4 left-1/2 transform -translate-x-1/2 rounded-lg shadow-lg z-50"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
        </div>
      ) : designer ? (
        <>
          {/* Hero Section */}
          <div className="relative h-64 md:h-96 bg-gradient-to-r from-[#C19A6B] to-[#A0784A] mb-8">
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{designer.name}</h1>
                <p className="text-xl md:text-2xl opacity-90">{designer.specialization}</p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {/* Designer Profile Section */}
            <div className="bg-white shadow-xl rounded-xl overflow-hidden transform -mt-24 relative z-10">
              <div className="md:flex">
                <div className="md:flex-shrink-0">
                  <div className="h-64 w-full md:w-64 bg-gray-200 flex items-center justify-center">
                    {designer.photoURL ? (
                      <img
                        src={designer.photoURL}
                        alt={designer.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src="/person.gif"
                        alt="Default profile"
                        className="h-32 w-32 object-cover rounded-full"
                      />
                    )}
                  </div>
                </div>

                <div className="p-8 flex-grow">
                  <div className="flex flex-wrap items-center justify-between mb-6">
                    <div>
                      <div className="uppercase tracking-wide text-sm text-[#C19A6B] font-semibold mb-1">
                        {designer.specialization}
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">{designer.name}</h2>
                      <p className="text-gray-600 mt-1">{designer.email}</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-4">
                      <button className="px-6 py-3 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                        Contact Designer
                      </button>
                      <button className="px-6 py-3 border-2 border-[#C19A6B] text-[#C19A6B] rounded-lg hover:bg-[#C19A6B]/5 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                        Request Design
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    {/* Rating Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <span className="text-3xl font-bold text-[#C19A6B] mr-2">
                              {designerRating.averageRating.toFixed(1)}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FiStar
                                  key={star}
                                  className={`w-6 h-6 ${star <= designerRating.averageRating ? 'text-[#C19A6B] fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {designerRating.ratingCount} {designerRating.ratingCount === 1 ? 'review' : 'reviews'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowRatingModal(true)}
                          className="px-4 py-2 text-sm bg-[#C19A6B]/10 text-[#C19A6B] rounded-lg hover:bg-[#C19A6B]/20 transition-colors"
                        >
                          View Reviews
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{designer.bio}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Experience</h4>
                        <p className="text-gray-600">{designer.experience}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Specialization</h4>
                        <p className="text-gray-600">{designer.specialization}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Portfolio Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="relative h-48">
                      <img 
                        src={project.referenceImageUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-sm">Client: {project.clientName}</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description || 'No description available'}</p>
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          Completed
                        </span>
                        <button 
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="text-[#C19A6B] hover:text-[#A0784A] font-medium"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No projects found in this category.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Designer Not Found</h2>
            <p className="text-gray-600">The designer you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      )}

      {/* Rating Details Modal */}
      {showRatingModal && (
        <RatingDetailsModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          rating={designerRating}
          designerId={designerId}
        />
      )}
    </div>
  );
}

export default DesignerPortfolioPage;
