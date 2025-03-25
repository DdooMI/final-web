/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../zustand/auth";

function DesignerPortfolioPage() {
  const { designerId } = useParams();
  const { user } = useAuth();
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
    <div className="min-h-screen bg-gray-50 pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
        ) : designer ? (
          <>
            {/* Designer Profile Section */}
            <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
              <div className="md:flex">
                <div className="md:flex-shrink-0">
                  <div className="h-48 w-full md:w-48 bg-gray-200 flex items-center justify-center">
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
                        className="h-24 w-24 object-cover rounded-full"
                      />
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <div className="uppercase tracking-wide text-sm text-[#C19A6B] font-semibold">
                    {designer.specialization}
                  </div>
                  <h2 className="mt-1 text-3xl font-bold text-gray-900 leading-tight">
                    {designer.name}
                  </h2>
                  <p className="mt-2 text-gray-600">{designer.email}</p>

                  <div className="mt-4">
                    <span className="inline-block bg-[#C19A6B]/10 text-[#C19A6B] px-3 py-1 rounded-full text-sm font-medium">
                      {designer.experience} Experience
                    </span>
                  </div>

                  <p className="mt-4 text-gray-700">{designer.bio}</p>

                  <div className="mt-6">
                    <button className="px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition mr-3">
                      Contact Designer
                    </button>
                    <button className="px-4 py-2 border border-[#C19A6B] text-[#C19A6B] rounded-md hover:bg-[#C19A6B]/5 transition">
                      Request Design
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b">
                <div className="px-6 py-4 flex">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "all"
                        ? "border-b-2 border-[#C19A6B] text-[#C19A6B]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Projects
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "completed"
                        ? "border-b-2 border-[#C19A6B] text-[#C19A6B]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("completed")}
                  >
                    Completed Projects
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "featured"
                        ? "border-b-2 border-[#C19A6B] text-[#C19A6B]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("featured")}
                  >
                    Featured Projects
                  </button>
                </div>
              </div>

              <div className="p-6">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No projects to display</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="h-48 bg-gray-200">
                          {project.imageUrl ? (
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {project.title || "Untitled Project"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {project.description || "No description available"}
                          </p>

                          <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {project.date
                                ? new Date(
                                    project.date.toDate()
                                  ).toLocaleDateString()
                                : "No date"}
                            </span>

                            {project.status && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  project.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : project.status === "featured"
                                    ? "bg-[#C19A6B]/10 text-[#C19A6B]"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {project.status.charAt(0).toUpperCase() +
                                  project.status.slice(1)}
                              </span>
                            )}
                          </div>

                          <button className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition text-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-lg text-gray-700">Designer not found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignerPortfolioPage;
