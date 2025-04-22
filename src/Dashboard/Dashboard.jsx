import { ChartBarIcon, UserGroupIcon, UserIcon, StarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,

  getDoc,
  doc
} from "firebase/firestore";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDesigners: 0,
    totalClients: 0,
    totalProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
    inProgressProjects: 0,
    totalRevenue: 0
  });
  const [topClients, setTopClients] = useState([]);
  const [topDesigners, setTopDesigners] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [dateFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState("recent");
  const [designerFilter, setDesignerFilter] = useState("top-rated");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await fetchStats();
        await fetchTopClients();
        await fetchTopDesigners();
        await fetchRecentProjects();
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateFilter]);

  const fetchStats = async () => {
    try {
      // Get users statistics
      const usersSnapshot = await getDocs(collection(db, "users"));
      let totalUsers = usersSnapshot.size;
      
      let designers = 0;
      let clients = 0;
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.role === "designer") designers++;
        else if (userData.role === "client") clients++;
        else if (userData.role === "admin") totalUsers--;
      });
      
      // Get projects statistics
      const proposalsSnapshot = await getDocs(collection(db, "designProposals"));
      const totalProjects = proposalsSnapshot.size;
      
      let completed = 0, pending = 0, inProgress = 0, totalRevenue = 0;
      
      proposalsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        if (projectData.status === "completed" || projectData.status === "completed_by_designer") {
          projectData.status === "completed_by_designer" ? pending++ : completed++;
          if (projectData.price) totalRevenue += Number(projectData.price);
        } else if (projectData.status === "pending") pending++;
        else if (projectData.status === "accepted") inProgress++;
      });
      
      setStats({ totalUsers, totalDesigners: designers, totalClients: clients, 
        totalProjects, completedProjects: completed, pendingProjects: pending, 
        inProgressProjects: inProgress, totalRevenue });
    } catch (err) {
      console.error("Error fetching stats:", err);
      throw err;
    }
  };

  const fetchTopClients = async () => {
    try {
      const clientsQuery = query(collection(db, "users"), where("role", "==", "client"));
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = [];
      
      for (const clientDoc of clientsSnapshot.docs) {
        const clientId = clientDoc.id;
        const profileRef = doc(db, "users", clientId, "profile", "profileInfo");
        const profileSnap = await getDoc(profileRef);
        let profileData = profileSnap.exists() ? profileSnap.data() : {};
        
        const projectsQuery = query(collection(db, "designProposals"), where("clientId", "==", clientId));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        clientsData.push({
          id: clientId,
          name: profileData.name || "Unknown Client",
          projects: projectsSnapshot.size,
          avatar: profileData.photoURL || "/person.gif"
        });
      }
      
      setTopClients(clientsData.sort((a, b) => b.projects - a.projects).slice(0, 3));
    } catch (err) {
      console.error("Error fetching top clients:", err);
      throw err;
    }
  };

  const fetchTopDesigners = async () => {
    try {
      const designersQuery = query(collection(db, "users"), where("role", "==", "designer"));
      const designersSnapshot = await getDocs(designersQuery);
      const designersData = [];
      
      for (const designerDoc of designersSnapshot.docs) {
        const designerId = designerDoc.id;
        const profileQuery = query(collection(db, "users", designerId, "profile"));
        const profileSnapshot = await getDocs(profileQuery);
        let profileData = !profileSnapshot.empty ? profileSnapshot.docs[0].data() : {};
        
        const projectsQuery = query(collection(db, "designProposals"), where("designerId", "==", designerId));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const ratingsQuery = query(collection(db, "ratings"), where("designerId", "==", designerId));
        const ratingsSnapshot = await getDocs(ratingsQuery);
        let totalRating = 0;
        ratingsSnapshot.forEach(doc => totalRating += doc.data().rating);
        const rating = ratingsSnapshot.size > 0 ? totalRating / ratingsSnapshot.size : 0;
        
        designersData.push({
          id: designerId,
          name: profileData.name || "Unknown Designer",
          specialty: profileData.specialty || "Interior Design",
          rating: parseFloat(rating.toFixed(1)),
          projects: projectsSnapshot.size,
          avatar: profileData.photoURL || "/person.gif"
        });
      }
      
      setTopDesigners(designersData.sort((a, b) => b.rating - a.rating || b.projects - a.projects).slice(0, 3));
    } catch (err) {
      console.error("Error fetching top designers:", err);
      throw err;
    }
  };

  const fetchRecentProjects = async () => {
    try {
      // Query for completed and accepted projects
      const q = query(
        collection(db, 'designProposals'),
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
        
        // Get designer profile
        const designerProfileRef = doc(db, 'users', proposalData.designerId, 'profile', 'profileInfo');
        const designerProfileSnap = await getDoc(designerProfileRef);

        return {
          id: docu.id,
          ...proposalData,
          referenceImageUrl: requestSnap.exists()
            ? requestSnap.data().referenceImageUrl
            : '/project-placeholder.jpg',
          clientName: clientProfileSnap.exists() ? clientProfileSnap.data().name : 'Unknown Client',
          clientAvatar: clientProfileSnap.exists() ? clientProfileSnap.data().photoURL : '/person.gif',
          designerName: designerProfileSnap.exists() ? designerProfileSnap.data().name : 'Unknown Designer',
          designerAvatar: designerProfileSnap.exists() ? designerProfileSnap.data().photoURL : '/person.gif',
          completedAt: proposalData.updatedAt ? proposalData.updatedAt.toDate() : new Date(),
          rating: proposalData.clientRating || 0
        };
      }));

      setRecentProjects(projectsData.sort((a, b) => b.completedAt - a.completedAt));
    } catch (err) {
      console.error("Error fetching recent projects:", err);
      throw err;
    }
  };


  const formatDate = (date) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'N/A'; // Handle invalid dates
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Total Designers", value: stats.totalDesigners },
    { label: "Total Clients", value: stats.totalClients },
    { label: "Total Projects", value: stats.totalProjects }
  ];

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
      </div>
      
      <div className="w-full px-4 sm:px-6 md:px-8 mt-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-black">Our service statistics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mt-4">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm leading-5 font-medium text-gray-500 truncate dark:black">{stat.label}</dt>
                  <dd className="mt-1 text-3xl leading-9 font-semibold dark:text-[rgb(2,133,199)]">{stat.value}</dd>
                </dl>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-full px-4 sm:px-6 md:px-8 mt-10">
        <div className="card hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2 p-1 rounded-md bg-primary-100">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
              </span>
              Designers ({topDesigners.length})
            </h2>
            <select
              value={designerFilter}
              onChange={(e) => setDesignerFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="top-rated">Top Rated</option>
              <option value="most-projects">Most Projects</option>
            </select>
          </div>
        
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topDesigners.map((designer) => (
              <div
                key={designer.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col"
                onClick={() => navigate(`/designer/${designer.id}`)}
              >
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-center space-x-4">
                    <img
                      src={designer.avatar}
                      alt={designer.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-primary-200"
                    />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{designer.name}</h3>
                      <p className="text-xs text-gray-500">{designer.role}</p>
                      <div className="flex items-center mt-1">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="ml-1 text-sm font-medium text-gray-700">{designer.rating}</span>
                        <span className="mx-1 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{designer.projects} projects</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    
      <div className="w-full px-4 sm:px-6 md:px-8 mt-10">
        <div className="card hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2 p-1 rounded-md bg-primary-100">
                <UserIcon className="h-5 w-5 text-primary-600" />
              </span>
              Clients
            </h2>
          </div>
          
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                onClick={() => navigate(`/client/${client.id}`)}
              >
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-primary-200"
                    />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{client.name}</h3>
                      <p className="text-xs text-gray-500">{client.industry}</p>
                      <div className="flex items-center mt-1">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="ml-1 text-sm font-medium text-gray-700">{client.rating}</span>
                        <span className="mx-1 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{client.projects} projects</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
          
      <div className="w-full px-4 sm:px-6 md:px-8 mt-10">
        <div className="card hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2 p-1 rounded-md bg-primary-100">
                <ChartBarIcon className="h-5 w-5 text-primary-600" />
              </span>
              Completed Projects
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setProjectFilter("recent")}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                  projectFilter === "recent"
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                Recent
              </button>
              <button
                onClick={() => setProjectFilter("top-rated")}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                  projectFilter === "top-rated"
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <StarIcon className="h-4 w-4 mr-1" />
                Top Rated
              </button>
            </div>
          </div>
    
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                <div className="h-60 overflow-hidden">
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
                    <p>Designer: {project.designerName}</p>
                    <p>Completed: {formatDate(project.completedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}