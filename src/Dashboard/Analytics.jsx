import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

export default function Analytics() {
  // State for analytics data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDesigners: 0,
    totalClients: 0,
    totalProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
    unfinishedProjects: 0,
    totalRevenue: 0
  });
  const [liveRequests, setLiveRequests] = useState(0);
  const [liveMessages, setLiveMessages] = useState(0);
  const [dailyData, setDailyData] = useState([]);
  const [projectData, setProjectData] = useState({
    weekly: [],
    monthly: [],
    yearly: []
  });
  const [projectStatus, setProjectStatus] = useState([]);
  const [dateRange, setDateRange] = useState('monthly'); // 'weekly', 'monthly', 'yearly'

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch users statistics
        await fetchUserStats();
        
        // Fetch projects statistics
        await fetchProjectStats();
        
        // Fetch daily activity data
        await fetchDailyActivityData();
        
        // Fetch project timeline data based on selected date range
        await fetchProjectTimelineData(dateRange);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data");
        setLoading(false);
      }
    };

    fetchAnalyticsData();

    // Set up real-time listeners for live data
    const setupLiveListeners = () => {
      // Listen for new design requests
      const requestsQuery = query(
        collection(db, "designRequests"),
        where("createdAt", ">", Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))))
      );
      
      const requestsUnsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        setLiveRequests(snapshot.size);
      });

      // Listen for new messages
      const messagesQuery = query(
        collection(db, "messages"),
        where("timestamp", ">", Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))))
      );
      
      const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        setLiveMessages(snapshot.size);
      });

      return () => {
        requestsUnsubscribe();
        messagesUnsubscribe();
      };
    };

    const unsubscribe = setupLiveListeners();
    return () => unsubscribe();
  }, [dateRange]);

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;
      
      // Count designers and clients
      let designers = 0;
      let clients = 0;
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.role === "designer") {
          designers++;
        } else if (userData.role === "client") {
          clients++;
        }
      });
      
      setStats(prev => ({
        ...prev,
        totalUsers,
        totalDesigners: designers,
        totalClients: clients
      }));
    } catch (err) {
      console.error("Error fetching user stats:", err);
      throw err;
    }
  };

  // Fetch project statistics
  const fetchProjectStats = async () => {
    try {
      // Get all design proposals (projects)
      const proposalsSnapshot = await getDocs(collection(db, "designProposals"));
      const totalProjects = proposalsSnapshot.size;
      
      // Count projects by status
      let completed = 0;
      let pending = 0;
      let unfinished = 0;
      let totalRevenue = 0;
      
      proposalsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        
        if (projectData.status === "completed") {
          completed++;
          // Add to revenue if price exists
          if (projectData.price) {
            totalRevenue += Number(projectData.price);
          }
        } else if (projectData.status === "pending") {
          pending++;
        } else {
          unfinished++;
        }
      });
      
      setStats(prev => ({
        ...prev,
        totalProjects,
        completedProjects: completed,
        pendingProjects: pending,
        unfinishedProjects: unfinished,
        totalRevenue
      }));
      
      // Set project status data for pie chart
      setProjectStatus([
        { name: 'Completed', value: completed, color: '#10B981' },
        { name: 'Pending', value: pending, color: '#F59E0B' },
        { name: 'Unfinished', value: unfinished, color: '#EF4444' },
      ]);
    } catch (err) {
      console.error("Error fetching project stats:", err);
      throw err;
    }
  };

  // Fetch daily activity data
  const fetchDailyActivityData = async () => {
    try {
      // Get last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Create an array of the last 30 days
      const days = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.unshift({
          date: date.toISOString().split('T')[0],
          formattedDate: `Day ${30-i}`,
          timestamp: Timestamp.fromDate(date),
          requests: 0,
          messages: 0
        });
      }
      
      // Get requests data
      const requestsQuery = query(
        collection(db, "designRequests"),
        where("createdAt", ">", Timestamp.fromDate(thirtyDaysAgo))
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      
      requestsSnapshot.forEach((doc) => {
        const requestData = doc.data();
        if (requestData.createdAt) {
          const requestDate = requestData.createdAt.toDate().toISOString().split('T')[0];
          const dayIndex = days.findIndex(day => day.date === requestDate);
          
          if (dayIndex !== -1) {
            days[dayIndex].requests++;
          }
        }
      });
      
      // Get messages data
      const messagesQuery = query(
        collection(db, "messages"),
        where("timestamp", ">", Timestamp.fromDate(thirtyDaysAgo))
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      messagesSnapshot.forEach((doc) => {
        const messageData = doc.data();
        if (messageData.timestamp) {
          const messageDate = messageData.timestamp.toDate().toISOString().split('T')[0];
          const dayIndex = days.findIndex(day => day.date === messageDate);
          
          if (dayIndex !== -1) {
            days[dayIndex].messages++;
          }
        }
      });
      
      // Format data for charts
      const formattedData = days.map(day => ({
        date: day.formattedDate,
        requests: day.requests,
        messages: day.messages
      }));
      
      setDailyData(formattedData);
    } catch (err) {
      console.error("Error fetching daily activity data:", err);
      throw err;
    }
  };

  // Fetch project timeline data based on selected date range
  const fetchProjectTimelineData = async (range) => {
    try {
      const now = new Date();
      let data = [];
      let startDate;
      
      // Set up date range
      if (range === 'weekly') {
        // Last 7 weeks
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 49); // 7 weeks ago
        
        // Create week buckets
        for (let i = 0; i < 7; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
          data.push({
            name: `Week ${7-i}`,
            startDate: weekStart,
            endDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
            projects: 0
          });
        }
      } else if (range === 'monthly') {
        // Last 12 months
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 11);
        startDate.setDate(1);
        
        // Create month buckets
        for (let i = 0; i < 12; i++) {
          const monthDate = new Date(now);
          monthDate.setMonth(monthDate.getMonth() - i);
          monthDate.setDate(1);
          
          const monthEnd = new Date(monthDate);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          
          data.push({
            name: monthNames[monthDate.getMonth()],
            startDate: monthDate,
            endDate: monthEnd,
            projects: 0
          });
        }
        
        // Reverse to show chronological order
        data.reverse();
      } else if (range === 'yearly') {
        // Last 5 years
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 4);
        startDate.setMonth(0);
        startDate.setDate(1);
        
        // Create year buckets
        for (let i = 0; i < 5; i++) {
          const yearDate = new Date(now);
          yearDate.setFullYear(yearDate.getFullYear() - (4 - i));
          yearDate.setMonth(0);
          yearDate.setDate(1);
          
          const yearEnd = new Date(yearDate);
          yearEnd.setFullYear(yearEnd.getFullYear() + 1);
          yearEnd.setDate(0);
          
          data.push({
            name: yearDate.getFullYear().toString(),
            startDate: yearDate,
            endDate: yearEnd,
            projects: 0
          });
        }
      }
      
      // Get projects created in the date range
      const projectsQuery = query(
        collection(db, "designProposals"),
        where("createdAt", ">", Timestamp.fromDate(startDate))
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      
      projectsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        if (projectData.createdAt) {
          const projectDate = projectData.createdAt.toDate();
          
          // Find which bucket this project belongs to
          const bucketIndex = data.findIndex(bucket => 
            projectDate >= bucket.startDate && projectDate <= bucket.endDate
          );
          
          if (bucketIndex !== -1) {
            data[bucketIndex].projects++;
          }
        }
      });
      
      // Update state with formatted data
      setProjectData({
        ...projectData,
        [range]: data
      });
    } catch (err) {
      console.error(`Error fetching ${range} project data:`, err);
      throw err;
    }
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        <h3 className="text-lg font-medium">Error Loading Analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.totalDesigners} Designers, ${stats.totalClients} Clients`}
          color="blue"
        />
        <StatCard
          title="Completed Projects"
          value={stats.completedProjects}
          change={stats.completedProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}
          isPositive={true}
          color="green"
        />
        <StatCard
          title="Pending Projects"
          value={stats.pendingProjects}
          change={stats.pendingProjects > 0 ? Math.round((stats.pendingProjects / stats.totalProjects) * 100) : 0}
          isPositive={false}
          color="yellow"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtitle="From completed projects"
          color="purple"
        />
      </div>

      {/* Daily Activity Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <ChartCard title="Requests per Day">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#3B82F6" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Live Requests Today</h4>
            <div className="text-2xl font-bold text-blue-600">{liveRequests}</div>
          </div>
        </div>

        <div>
          <ChartCard title="Messages per Day">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="messages" stroke="#10B981" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Live Messages Today</h4>
            <div className="text-2xl font-bold text-green-600">{liveMessages}</div>
          </div>
        </div>
      </div>

      {/* Project Status Pie Chart */}
      <div className="mb-8">
        <ChartCard title="Project Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {projectStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Projects Over Time */}
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Projects Over Time</h2>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${dateRange === "weekly"
                ? "bg-[#C19A6B] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => handleDateRangeChange("weekly")}
            >
              Weekly
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${dateRange === "monthly"
                ? "bg-[#C19A6B] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => handleDateRangeChange("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${dateRange === "yearly"
                ? "bg-[#C19A6B] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => handleDateRangeChange("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>

        <ChartCard title={`Projects ${dateRange === "weekly" ? "per Week" : dateRange === "monthly" ? "per Month" : "per Year"}`}>
          <ResponsiveContainer width="100%" height={300}>
            {dateRange === "monthly" ? (
              <AreaChart data={projectData.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="projects" fill="#818CF8" stroke="#4F46E5" />
              </AreaChart>
            ) : (
              <BarChart data={projectData[dateRange]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="projects" fill={dateRange === "weekly" ? "#6366F1" : "#4F46E5"} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, subtitle, color }) {
  const getColorClass = (color) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      case 'purple': return 'text-purple-600';
      default: return 'text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="flex items-center mt-2">
        <span className={`text-3xl font-bold ${getColorClass(color)}`}>{value}</span>
        {change !== undefined && (
          <span className={`ml-2 flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-700 font-medium mb-4">{title}</h3>
      {children}
    </div>
  );
}
