/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../zustand/auth";

function DesignerPortfolioPage() {
  const { designerId } = useParams();
  const { user, role } = useAuth();
  const [designer, setDesigner] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

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

        // Get designer's projects
        const projectsRef = collection(db, "users", designerId, "projects");
        const projectsSnap = await getDocs(projectsRef);
        const projectsData = [];

        projectsSnap.forEach((doc) => {
          projectsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

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

  // Filter projects based on active tab
  const filteredProjects =
    activeTab === "all"
      ? projects
      : projects.filter((project) => project.status === activeTab);

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
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Portfolio Projects</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${activeTab === 'all' ? 'bg-[#C19A6B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    All Projects
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${activeTab === 'completed' ? 'bg-[#C19A6B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setActiveTab('in-progress')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${activeTab === 'in-progress' ? 'bg-[#C19A6B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    In Progress
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} alt={project.title} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm ${project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {project.status}
                        </span>
                        <button className="text-[#C19A6B] hover:text-[#A0784A] font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProjects.length === 0 && (
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
    </div>
  );
  
}

export default DesignerPortfolioPage;
