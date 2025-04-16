import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { ChartBarIcon, UserGroupIcon, UserIcon, ChatBubbleLeftRightIcon, StarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getDoc,
  doc
} from "firebase/firestore";

export default function Dashboard() {
  const navigate = useNavigate();
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
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', 'year'

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch statistics
        await fetchStats();
        
        // Fetch top clients
        await fetchTopClients();
        
        // Fetch top designers
        await fetchTopDesigners();
        
        // Fetch recent projects
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

  // Fetch statistics
  const fetchStats = async () => {
    try {
      // Get users statistics
      const usersSnapshot = await getDocs(collection(db, "users"));
      let totalUsers = usersSnapshot.size;
      
      // Count designers and clients
      let designers = 0;
      let clients = 0;
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.role === "designer") {
          designers++;
        } else if (userData.role === "client") {
          clients++;
        } else if (userData.role === "admin") {
          // Skip admin users from total count
          totalUsers--;
        }
      });
      
      // Get projects statistics
      const proposalsSnapshot = await getDocs(collection(db, "designProposals"));
      const totalProjects = proposalsSnapshot.size;
      
      // Count completed projects and calculate revenue
      let completed = 0;
      let pending = 0;
      let inProgress = 0;
      let totalRevenue = 0;
      
      proposalsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        
        if (projectData.status === "completed" || projectData.status === "completed_by_designer") {
          if (projectData.status === "completed_by_designer") {
            pending++;
          } else {
            completed++;
          }
          // Add to revenue if price exists
          if (projectData.price) {
            totalRevenue += Number(projectData.price);
          }
        } else if (projectData.status === "pending") {
          pending++;
        } else if (projectData.status === "accepted") {
          inProgress++;
        }
      });
      
      setStats({
        totalUsers,
        totalDesigners: designers,
        totalClients: clients,
        totalProjects,
        completedProjects: completed,
        pendingProjects: pending,
        inProgressProjects: inProgress,
        totalRevenue
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      throw err;
    }
  };

  // Fetch top clients
  const fetchTopClients = async () => {
    try {
      // Get all clients
      const clientsQuery = query(
        collection(db, "users"),
        where("role", "==", "client")
      );
      
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = [];
      
      // Process each client
      for (const clientDoc of clientsSnapshot.docs) {
        const clientId = clientDoc.id;
        
        // Get client profile
        const profileRef = doc(db, "users", clientId, "profile", "profileInfo");
        const profileSnap = await getDoc(profileRef);
        let profileData = {};
        
        if (profileSnap.exists()) {
          profileData = profileSnap.data();
        }
        
        // Get client projects
        const projectsQuery = query(
          collection(db, "designProposals"),
          where("clientId", "==", clientId)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projects = projectsSnapshot.size;
        
        // Calculate average rating
        let totalRating = 0;
        let ratingCount = 0;
        
        projectsSnapshot.forEach(doc => {
          const projectData = doc.data();
          if (projectData.designerRating) {
            totalRating += projectData.designerRating;
            ratingCount++;
          }
        });
        
        const rating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;
        
        // Add all clients, not just those with ratings
        clientsData.push({
          id: clientId,
          name: profileData.name || "Unknown Client",
         
          projects,
          avatar: profileData.photoURL || "/person.gif"
        });
      }
      
      // Sort by rating and projects, then limit to top 3
      const topClients = clientsData
        .sort((a, b) => b.rating - a.rating || b.projects - a.projects)
        .slice(0, 3);
      
      setTopClients(topClients);
    } catch (err) {
      console.error("Error fetching top clients:", err);
      throw err;
    }
  };

  // Fetch top designers
  const fetchTopDesigners = async () => {
    try {
      // Get all designers
      const designersQuery = query(
        collection(db, "users"),
        where("role", "==", "designer")
      );
      
      const designersSnapshot = await getDocs(designersQuery);
      const designersData = [];
      
      // Process each designer
      for (const designerDoc of designersSnapshot.docs) {
        const designerId = designerDoc.id;
        const designerData = designerDoc.data();
        
        // Get designer profile
        const profileQuery = query(collection(db, "users", designerId, "profile"));
        const profileSnapshot = await getDocs(profileQuery);
        let profileData = {};
        
        if (!profileSnapshot.empty) {
          profileData = profileSnapshot.docs[0].data();
        }
        
        // Get designer projects
        const projectsQuery = query(
          collection(db, "designProposals"),
          where("designerId", "==", designerId)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projects = projectsSnapshot.size;
        
        // Get designer ratings from ratings collection
        const ratingsQuery = query(
          collection(db, "ratings"),
          where("designerId", "==", designerId)
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        let totalRating = 0;
        let ratingCount = ratingsSnapshot.size;
        
        ratingsSnapshot.forEach(doc => {
          const ratingData = doc.data();
          totalRating += ratingData.rating;
        });
        
        const rating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;
        
        designersData.push({
          id: designerId,
          name: profileData.name || "Unknown Designer",
          specialty: profileData.specialty || "Interior Design",
          rating: parseFloat(rating),
          projects,
          avatar: profileData.photoURL || "/person.gif"
        });
      }
      
      // Sort by rating and limit to top 3
      const topDesigners = designersData
        .sort((a, b) => b.rating - a.rating || b.projects - a.projects)
        .slice(0, 3);
      
      setTopDesigners(topDesigners);
    } catch (err) {
      console.error("Error fetching top designers:", err);
      throw err;
    }
  };

  // Fetch recent projects
  const fetchRecentProjects = async () => {
    try {
      // Get recent completed projects
      const projectsQuery = query(
        collection(db, "designProposals"),
        where("status", "in", ["completed", "accepted"])
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = [];
      
      // Process each project
      for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id;
        const projectData = projectDoc.data();
        
        // Get client info
        const clientProfileRef = doc(db, "users", projectData.clientId, "profile", "profileInfo");
        const clientProfileSnap = await getDoc(clientProfileRef);
        let clientName = "Unknown Client";
        let clientAvatar = "/person.gif";
        
        if (clientProfileSnap.exists()) {
          const clientProfileData = clientProfileSnap.data();
          clientName = clientProfileData.name || "Unknown Client";
          clientAvatar = clientProfileData.photoURL || "/person.gif";
        }
        
        // Get designer info
        const designerProfileRef = doc(db, "users", projectData.designerId, "profile", "profileInfo");
        const designerProfileSnap = await getDoc(designerProfileRef);
        let designerName = "Unknown Designer";
        let designerAvatar = "/person.gif";
        
        if (designerProfileSnap.exists()) {
          const designerProfileData = designerProfileSnap.data();
          designerName = designerProfileData.name || "Unknown Designer";
          designerAvatar = designerProfileData.photoURL || "/person.gif";
        }
        
        projectsData.push({
          id: projectId,
          title: projectData.title || "Untitled Project",
          clientName,
          clientAvatar,
          designerName,
          designerAvatar,
          completedAt: projectData.updatedAt ? projectData.updatedAt.toDate() : new Date(),
          price: projectData.price || 0,
          rating: projectData.clientRating || 0
        });
      }
      
      setRecentProjects(projectsData);
    } catch (err) {
      console.error("Error fetching recent projects:", err);
      throw err;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
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

  return (
    <div className="p-6 space-y-8">
      {/* Date filter */}
      <div className="flex justify-end">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
          <div className="rounded-full bg-blue-100 p-3">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            <div className="flex items-center mt-1">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-500 ml-1">12%</span>
              <span className="text-xs text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        </div>

        {/* Total Designers */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
          <div className="rounded-full bg-purple-100 p-3">
            <UserGroupIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Designers</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDesigners}</p>
            <div className="flex items-center mt-1">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-500 ml-1">8%</span>
              <span className="text-xs text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
          <div className="rounded-full bg-green-100 p-3">
            <UserGroupIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Clients</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
            <div className="flex items-center mt-1">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-500 ml-1">15%</span>
              <span className="text-xs text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4">
          <div className="rounded-full bg-yellow-100 p-3">
            <ChartBarIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <div className="flex items-center mt-1">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-500 ml-1">23%</span>
              <span className="text-xs text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Projects */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
            <span className="text-sm text-gray-500">{dateFilter === 'all' ? 'All time' : `This ${dateFilter}`}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center px-4">
              <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-bold text-green-600">{stats.completedProjects}</p>
              <p className="text-sm text-gray-600 mt-1">Completed</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingProjects}</p>
              <p className="text-sm text-gray-600 mt-1">In Progress</p>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
          <div className="space-y-4">
            {topClients.length > 0 ? (
              topClients.map((client) => (
                <div key={client.id} className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/client/${client.id}`)}>
                  <img
                    src={client.avatar}
                    alt={client.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{client.name}</h4>
                    <p className="text-xs text-gray-500">{client.industry}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">{client.projects} projects</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No clients data available</p>
            )}
          </div>
        </div>

        {/* Top Designers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Designers</h3>
          <div className="space-y-4">
            {topDesigners.length > 0 ? (
              topDesigners.map((designer) => (
                <div key={designer.id} className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/designer/${designer.id}`)}>
                  <img
                    src={designer.avatar}
                    alt={designer.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{designer.name}</h4>
                    <p className="text-xs text-gray-500">{designer.specialty}</p>
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium ml-1">{designer.rating}</span>
                    <span className="text-xs text-gray-500 ml-2">{designer.projects} projects</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No designers data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={project.clientAvatar}
                          alt={project.clientName}
                          className="h-8 w-8 rounded-full mr-2 object-cover"
                        />
                        <div className="text-sm text-gray-900">{project.clientName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={project.designerAvatar}
                          alt={project.designerName}
                          className="h-8 w-8 rounded-full mr-2 object-cover"
                        />
                        <div className="text-sm text-gray-900">{project.designerName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(project.completedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(project.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{project.rating.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-sm text-gray-500 text-center">
                    No recent projects available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}