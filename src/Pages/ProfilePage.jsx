"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import { axiosApi } from "../axios/axiosConfig";
import UserBalance from "../payment/user-balance";
import { subscribeToUnreadMessageCount } from "../firebase/messages";
import { formatDistanceToNow } from "date-fns";

export default function ProfilePage() {

  const { user, role, profile, updateProfile, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [newBio, setNewBio] = useState(profile?.bio || "");
  const [newSpecialization, setNewSpecialization] = useState(profile?.specialization || "");
  const [newExperience, setNewExperience] = useState(profile?.experience || "");
  const [imageFile, setImageFile] = useState();
  const [fileName, setFileName] = useState("Choose an image");
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Fetch notifications and unread messages count
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.docs.length);
      
      // Get the 5 most recent notifications for the dropdown
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
      
      setNotifications(notificationsData);
    });

    // Subscribe to unread message count
    const unsubscribeMessages = subscribeToUnreadMessageCount(user.uid, (count) => {
      setUnreadMessages(count);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeMessages();
    };
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (role === 'designer' && user?.uid) {
        // Define status filter based on active tab
        let statusFilter;
        if (activeTab === "completed") {
          statusFilter = ["completed"];
        } else if (activeTab === "in_progress") {
          statusFilter = ["accepted"];
        } else {
          // "all" tab shows both completed and in-progress projects
          statusFilter = ["completed", "accepted"];
        }

        const q = query(
          collection(db, 'designProposals'),
          where('designerId', '==', user.uid),
          where('status', 'in', statusFilter)
        );

        const querySnapshot = await getDocs(q);
        const projectsData = await Promise.all(querySnapshot.docs.map(async docu => {
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
            clientName
          };
        }));

        setProjects(projectsData);
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user?.uid, role, activeTab]);
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImageFile(file);
    setFileName(file.name);
  };
  const handleSave = async () => {
    try {
      if (!imageFile && newName === profile.name) {
        setEditMode(false);
        return;
      }

      let uploadedImageUrl = profile.photoURL;

      if (imageFile) {
        const imageData = new FormData();
        imageData.append("file", imageFile);
        imageData.append("upload_preset", "home_customization");
        imageData.append("cloud_name", "dckwbkqjv");

        const res = await axiosApi.post("", imageData);

        uploadedImageUrl = res.data.secure_url;
      }

      await updateProfile({
        name: newName,
        photoURL: uploadedImageUrl,
        bio: newBio,
        specialization: newSpecialization,
        experience: newExperience
      });

      setEditMode(false);
      setFileName("Choose an image");
      setImageFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header/Navigation */}
      <header className="bg-gradient-to-r from-[#A67B5B] to-[#C19A6B] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl text-white">Portfolio</div>
            <div className="flex items-center space-x-4">
              {/* Notifications Button with Dropdown */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  className="text-white hover:text-gray-200 transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-[#C19A6B] text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                        <NavLink to="/notifications" className="text-xs text-[#A67B5B] hover:underline">
                          View all
                        </NavLink>
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <NavLink
                          key={notification.id}
                          to={`/notifications?id=${notification.relatedId || ''}`}
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 bg-[#A67B5B]/10 p-2 rounded-full">
                              <svg className="w-5 h-5 text-[#A67B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-3 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : 'Just now'}
                              </p>
                            </div>
                          </div>
                        </NavLink>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Messages Button */}
              <div className="relative mr-4">
                <NavLink to="/messages" className="text-white hover:text-gray-200 transition-colors group relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-[#C19A6B] text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Messages
                  </span>
                </NavLink>
              </div>
 
              
              {/* Logout Button */}
              <button
                className="text-white hover:text-gray-200 transition-colors group relative"
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    logout(navigate);
                  }
                }}
                title="Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 p-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-xl transition-transform duration-300 hover:scale-105">
                <img
                  src={profile?.photoURL || "/person.gif"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {editMode && (
                <label className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2 2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              )}
            </div>

            <div className="flex-1 w-full">
              {editMode ? (
                <div className="space-y-4 w-full">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] focus:border-[#A67B5B] outline-none transition"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Professional Bio</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] focus:border-[#A67B5B] outline-none transition resize-none"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Specialization</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] focus:border-[#A67B5B] outline-none transition"
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] focus:border-[#A67B5B] outline-none transition"
                        value={newExperience}
                        onChange={(e) => setNewExperience(e.target.value)}
                      />
                    </div>
                  </div>
                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="fileInput"
                    className="border px-2 py-1 rounded cursor-pointer bg-gray-100 hover:bg-gray-200"
                  >
                    {fileName}
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile?.name}
                  </h1>
                  <p className="text-gray-600 text-lg">{user?.email}</p>
                  <p className="text-gray-600 leading-relaxed">
                    {profile?.bio || "No bio available"}
                  </p>
                  {role === 'designer' && (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <svg className="w-5 h-5 mr-2 text-[#A67B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Specialization
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{profile?.specialization || "Interior Design"}</dd>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <svg className="w-5 h-5 mr-2 text-[#A67B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Experience
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{profile?.experience || "Not specified"}</dd>
                      </div>
                    </dl>
                  )}

                </div>
              )}

              <div className="mt-3">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${role === "designer"
                      ? "bg-[#A67B5B]/10 text-[#A67B5B]"
                      : "bg-[#A67B5B]/10 text-[#c1916d]"
                    }`}
                >
                  {role?.charAt(0).toUpperCase() + role?.slice(1)}
                </span>
              </div>
            </div>

            <div className=" flex flex-col sm:flex-row gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#A67B5B] text-white rounded-md"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-[#A67B5B] text-white rounded-md"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Balance Section */}
        <UserBalance />

        {/* Projects Section */}
        {role === 'designer' && (
          <div className="bg-white shadow rounded-lg">
            <div className="border-b">
              <div className="px-6 py-4 flex space-x-4">
                <button
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === "all" ? "border-[#A67B5B] text-[#A67B5B]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setActiveTab("all")}
                >
                  All Projects
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === "completed" ? "border-[#A67B5B] text-[#A67B5B]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setActiveTab("completed")}
                >
                  Completed
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === "in_progress" ? "border-[#A67B5B] text-[#A67B5B]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setActiveTab("in_progress")}
                >
                  In Progress
                </button>
              </div>
            </div>
            <div className="p-6">
              {loadingProjects ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A67B5B] mx-auto"></div>
                </div>
              ) : projects.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No projects to display
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} navigate={navigate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

const ProjectCard = ({ project, navigate }) => (
  <div
    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    onClick={() => navigate(`/project/${project.id}`)}
  >
    <div className="relative h-48 overflow-hidden rounded-t-lg">
      <img
        src={project.referenceImageUrl || '/project-placeholder.jpg'}
        alt={project.title}
        className="w-full h-full object-cover"
      />
      <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm ${project.status === 'completed'
          ? 'bg-green-100 text-green-800'
          : 'bg-blue-100 text-blue-800'
        }`}>
        {project.status}
      </span>
    </div>
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {project.description}
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>${project.price}</span>
        <span className="text-[#A67B5B] font-medium">{project.clientName}</span>
      </div>
    </div>
  </div>
);
