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
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import PropTypes from 'prop-types';

export default function Analytics() {
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
  const [dateRange, setDateRange] = useState('monthly');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        await fetchUserStats();
        await fetchProjectStats();
        await fetchDailyActivityData();
        await fetchProjectTimelineData(dateRange);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data");
        setLoading(false);
      }
    };

    const setupLiveListeners = () => {
      const requestsQuery = query(
        collection(db, "designRequests"),
        where("createdAt", ">", Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))))
      );
      
      const requestsUnsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        setLiveRequests(snapshot.size);
      });

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

    fetchAnalyticsData();
    const unsubscribe = setupLiveListeners();
    return () => unsubscribe();
  }, [dateRange]);

  const fetchUserStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;
      
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

  const fetchProjectStats = async () => {
    try {
      const proposalsSnapshot = await getDocs(collection(db, "designProposals"));
      const totalProjects = proposalsSnapshot.size;
      
      let completed = 0;
      let pending = 0;
      let unfinished = 0;
      let totalRevenue = 0;
      
      proposalsSnapshot.forEach((doc) => {
        const projectData = doc.data();
        
        if (projectData.status === "completed") {
          completed++;
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

  const fetchDailyActivityData = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          formattedDate: `Day ${30-i}`,
          timestamp: Timestamp.fromDate(date),
          requests: 0,
          messages: 0
        };
      }).reverse();
      
      const [requestsSnapshot, messagesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, "designRequests"),
          where("createdAt", ">", Timestamp.fromDate(thirtyDaysAgo))
        )),
        getDocs(query(
          collection(db, "messages"),
          where("timestamp", ">", Timestamp.fromDate(thirtyDaysAgo))
        ))
      ]);
      
      requestsSnapshot.forEach(doc => {
        const requestData = doc.data();
        if (requestData.createdAt) {
          const requestDate = requestData.createdAt.toDate().toISOString().split('T')[0];
          const dayIndex = days.findIndex(day => day.date === requestDate);
          if (dayIndex !== -1) days[dayIndex].requests++;
        }
      });
      
      messagesSnapshot.forEach(doc => {
        const messageData = doc.data();
        if (messageData.timestamp) {
          const messageDate = messageData.timestamp.toDate().toISOString().split('T')[0];
          const dayIndex = days.findIndex(day => day.date === messageDate);
          if (dayIndex !== -1) days[dayIndex].messages++;
        }
      });
      
      setDailyData(days.map(day => ({
        date: day.formattedDate,
        requests: day.requests,
        messages: day.messages
      })));
    } catch (err) {
      console.error("Error fetching daily activity data:", err);
      throw err;
    }
  };

  const fetchProjectTimelineData = async (range) => {
    try {
      const now = new Date();
      let data = [];
      let startDate = new Date(now);
      
      switch (range) {
        case 'weekly':
          startDate.setDate(startDate.getDate() - 49);
          data = Array.from({ length: 7 }, (_, i) => ({
            name: `Week ${7-i}`,
            startDate: new Date(now.getTime() - (i * 7 + 6) * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() - (i * 7) * 24 * 60 * 60 * 1000),
            projects: 0
          }));
          break;
          
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 11);
          data = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            return {
              name: date.toLocaleString('default', { month: 'short' }),
              startDate: new Date(date.getFullYear(), date.getMonth(), 1),
              endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
              projects: 0
            };
          }).reverse();
          break;
          
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 4);
          data = Array.from({ length: 5 }, (_, i) => ({
            name: (now.getFullYear() - (4 - i)).toString(),
            startDate: new Date(now.getFullYear() - (4 - i), 0, 1),
            endDate: new Date(now.getFullYear() - (4 - i), 11, 31),
            projects: 0
          }));
          break;
      }
      
      const projectsSnapshot = await getDocs(query(
        collection(db, "designProposals"),
        where("createdAt", ">", Timestamp.fromDate(startDate))
      ));
      
      projectsSnapshot.forEach(doc => {
        const projectData = doc.data();
        if (projectData.createdAt) {
          const projectDate = projectData.createdAt.toDate();
          const bucketIndex = data.findIndex(bucket => 
            projectDate >= bucket.startDate && projectDate <= bucket.endDate
          );
          if (bucketIndex !== -1) data[bucketIndex].projects++;
        }
      });
      
      setProjectData(prev => ({
        ...prev,
        [range]: data
      }));
    } catch (err) {
      console.error(`Error fetching ${range} project data:`, err);
      throw err;
    }
  };

  const DateRangeSelector = () => (
    <div className="flex items-center space-x-4 mb-6">
      <button
        onClick={() => setDateRange('weekly')}
        className={`px-4 py-2 rounded-lg ${
          dateRange === 'weekly'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => setDateRange('monthly')}
        className={`px-4 py-2 rounded-lg ${
          dateRange === 'monthly'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => setDateRange('yearly')}
        className={`px-4 py-2 rounded-lg ${
          dateRange === 'yearly'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Yearly
      </button>
    </div>
  );

  const LiveStatsCard = ({ title, stats, type }) => {
    const bgColor = type === 'requests' ? 'bg-blue-500' : 'bg-green-500';
    const textColor = 'text-white';
    
    return (
      <div className={`rounded-lg p-6 ${bgColor} ${textColor}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Today</span>
            <span className="text-2xl font-bold">{stats.today}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Last Hour</span>
            <span className="text-xl">{stats.lastHour}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Trend</span>
            <span className={`flex items-center ${stats.trend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {stats.trend >= 0 ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
              {Math.abs(stats.trend)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  LiveStatsCard.propTypes = {
    title: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['requests', 'messages']).isRequired,
    stats: PropTypes.shape({
      today: PropTypes.number.isRequired,
      lastHour: PropTypes.number.isRequired,
      trend: PropTypes.number.isRequired
    }).isRequired
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B82F6]"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Projects Finished"
          value={stats.completedProjects}
          change={12}
          isPositive={true}
          loading={loading}
          prefix=""
          suffix="projects"
        />
        <StatCard
          title="Pending Projects"
          value={stats.pendingProjects}
          change={-3}
          isPositive={false}
          loading={loading}
          suffix="projects"
        />
        <StatCard
          title="Unfinished Projects"
          value={stats.unfinishedProjects}
          change={-5}
          isPositive={true}
          loading={loading}
          suffix="projects"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartCard 
          title="Requests per Day" 
          loading={loading}
          headerActions={
            <button className="text-sm text-gray-500 hover:text-gray-700">
              View Details
            </button>
          }
        >
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="requests" stroke="#3B82F6" />
          </LineChart>
        </ChartCard>

        <ChartCard title="Messages per Day">
          <LineChart data={dailyData} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="messages" stroke="#10B981" />
          </LineChart>
        </ChartCard>
      </div>

      <div className="mb-8">
        <ChartCard title="Project Status Distribution">
          <PieChart width={400} height={300}>
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
        </ChartCard>
      </div>

      <div className="space-y-6">
        <ChartCard 
          title="Projects Timeline" 
          loading={loading}
          headerActions={<DateRangeSelector />}
        >
          {dateRange === 'weekly' && (
            <BarChart data={projectData.weekly} height={300}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="projects" fill="#6366F1" name="Projects" />
            </BarChart>
          )}

          {dateRange === 'monthly' && (
            <AreaChart data={projectData.monthly} height={300}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="projects" 
                fill="#818CF8" 
                stroke="#4F46E5"
                name="Projects"
              />
            </AreaChart>
          )}

          {dateRange === 'yearly' && (
            <BarChart data={projectData.yearly} height={300}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="projects" 
                fill="#4F46E5" 
                name="Projects"
              />
            </BarChart>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <StatCard
          title="Live Requests Today"
          value={liveRequests}
          loading={loading}
          prefix=""
          suffix="requests"
          className="bg-blue-50"
        />
        <StatCard
          title="Live Messages Today"
          value={liveMessages}
          loading={loading}
          prefix=""
          suffix="messages"
          className="bg-green-50"
        />
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  isPositive, 
  loading = false, 
  error = null,
  prefix = '',
  suffix = '',
  className = ''
}) {
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow p-6">
        <h3 className="text-red-600 text-sm font-medium">{error}</h3>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg ${className}`}>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : (
        <>
          <h3 className="text-gray-500 text-sm font-medium truncate">{title}</h3>
          <div className="flex items-center mt-2 space-x-2">
            {prefix && <span className="text-gray-600">{prefix}</span>}
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {suffix && <span className="text-gray-600">{suffix}</span>}
            {change !== undefined && (
              <span 
                className={`ml-2 flex items-center text-sm font-medium ${
                  isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                } px-2 py-1 rounded-full`}
              >
                {isPositive ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change)}%
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  change: PropTypes.number,
  isPositive: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  className: PropTypes.string
};

function ChartCard({ 
  title, 
  children, 
  loading = false, 
  error = null,
  className = '',
  height = 300,
  showLegend = true,
  headerActions = null
}) {
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow p-6">
        <h3 className="text-red-600 text-sm font-medium">{error}</h3>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-[300px] bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="relative" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
      
      {!loading && showLegend && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* You can add custom legend here if needed */}
        </div>
      )}
    </div>
  );
}

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  headerActions: PropTypes.node
};