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

const dailyData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  requests: Math.floor(Math.random() * 100) + 20,
  messages: Math.floor(Math.random() * 200) + 50,
}));

const projectData = {
  weekly: Array.from({ length: 7 }, (_, i) => ({
    name: `Week ${i + 1}`,
    projects: Math.floor(Math.random() * 20) + 5,
  })),
  monthly: Array.from({ length: 12 }, (_, i) => ({
    name: `Month ${i + 1}`,
    projects: Math.floor(Math.random() * 50) + 10,
  })),
  yearly: Array.from({ length: 5 }, (_, i) => ({
    name: `202${i}`,
    projects: Math.floor(Math.random() * 200) + 50,
  })),
};

const projectStatus = [
  { name: 'Finished', value: 150, color: '#10B981' },
  { name: 'Pending', value: 45, color: '#F59E0B' },
  { name: 'Unfinished', value: 25, color: '#EF4444' },
];

export default function Analytics() {
  const [liveRequests, setLiveRequests] = useState(0);
  const [liveMessages, setLiveMessages] = useState(0);

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setLiveRequests(prev => prev + Math.floor(Math.random() * 5));
      setLiveMessages(prev => prev + Math.floor(Math.random() * 10));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Projects Finished"
          value={150}
          change={12}
          isPositive={true}
        />
        <StatCard
          title="Pending Projects"
          value={45}
          change={-3}
          isPositive={false}
        />
        <StatCard
          title="Unfinished Projects"
          value={25}
          change={-5}
          isPositive={true}
        />
      </div>

      {/* Daily Activity Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <ChartCard title="Requests per Day">
            <LineChart data={dailyData} height={300}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#3B82F6" />
            </LineChart>
          </ChartCard>
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Live Requests Today</h4>
            <div className="text-2xl font-bold text-blue-600">{liveRequests}</div>
          </div>
        </div>

        <div>
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
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Live Messages Today</h4>
            <div className="text-2xl font-bold text-green-600">{liveMessages}</div>
          </div>
        </div>
      </div>

      {/* Project Status Pie Chart */}
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

      {/* Projects Over Time */}
      <div className="space-y-6">
        <ChartCard title="Projects per Week">
          <BarChart data={projectData.weekly} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="projects" fill="#6366F1" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Projects per Month">
          <AreaChart data={projectData.monthly} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="projects" fill="#818CF8" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Projects per Year">
          <BarChart data={projectData.yearly} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="projects" fill="#4F46E5" />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="flex items-center mt-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`ml-2 flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
          {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
