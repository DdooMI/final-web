import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { ChartBarIcon, UserGroupIcon, UserIcon, ChatBubbleLeftRightIcon, StarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { designersData } from '../data/designersData';

// Client profiles with ratings
const clients = [
  {
    id: 1,
    name: "Acme Corporation",
    industry: "Technology",
    rating: 4.8,
    projects: 12,
    avatar: "data:image/jpeg;base64,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",
  },
  {
    id: 2,
    name: "Global Ventures",
    industry: "Finance",
    rating: 4.9,
    projects: 8,
    avatar: "data:image/png;base64,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",
  },
  {
    id: 3,
    name: "Bright Ideas",
    industry: "Marketing",
    rating: 4.7,
    projects: 15,
    avatar: "data:image/png;base64,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",
  },
  {
    id: 4,
    name: "Tech Innovators",
    industry: "Software",
    rating: 4.6,
    projects: 10,
    avatar: "data:image/png;base64,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",
  },
];

// Completed projects data
const completedProjects = [
  {
    id: 1,
    title: "Kids Bedroom",
    client: "Acme Corporation",
    designer: "Sarah Johnson",
    completedDate: "2023-12-15",
    rating: 4.9,
    image: "https://img.freepik.com/free-vector/bedroom-interior-with-furniture-blue-theme_1308-52874.jpg?ga=GA1.1.1947437701.1741853896&semt=ais_authors_boost",
  },
  {
    id: 2,
    title: "Work Office",
    client: "Global Ventures",
    designer: "Michael Chen",
    completedDate: "2024-01-20",
    rating: 4.8,
    image: "https://img.freepik.com/free-vector/empty-workplace-office-room-isolated_1308-52576.jpg?ga=GA1.1.1947437701.1741853896&semt=ais_authors_boost",
  },
  {
    id: 3,
    title: "Living Room",
    client: "Bright Ideas",
    designer: "Emma Rodriguez",
    completedDate: "2024-02-05",
    rating: 4.7,
    image: "https://img.freepik.com/free-vector/living-room-interior-with-furniture_1308-53136.jpg?ga=GA1.1.1947437701.1741853896&semt=ais_authors_boost",
  },
  {
    id: 4,
    title: "Kitchen",
    client: "Tech Innovators",
    designer: "David Kim",
    completedDate: "2024-03-10",
    rating: 4.9,
    image: "https://img.freepik.com/free-vector/dining-room-interior-with-furniture-modern-style_1308-53401.jpg?t=st=1741854089~exp=1741857689~hmac=c30c07f6c1616e4cf0b623df1914564aeb6a677bbdd1e98a738f4d1e68f69626&w=900",
  },
  {
    id: 5,
    title: "Home Office",
    client: "Acme Corporation",
    designer: "Sarah Johnson",
    completedDate: "2024-04-15",
    rating: 4.6,
    image: "https://img.freepik.com/free-vector/living-room-interior-with-furniture_1308-52453.jpg?ga=GA1.1.1947437701.1741853896&semt=ais_authors_boost",
  },
  {
    id: 6,
    title: "Dining Room",
    client: "Global Ventures",
    designer: "Michael Chen",
    completedDate: "2024-05-20",
    rating: 4.5,
    image: "https://img.freepik.com/free-vector/dining-room-interior-with-furniture_1308-55118.jpg?ga=GA1.1.1947437701.1741853896&semt=ais_authors_boost",
  },
  {
    id: 7,
    title: "Bathroom",
    client: "Bright Ideas",
    designer: "Emma Rodriguez",
    completedDate: "2024-06-05",
    rating: 4.8,
    image: "https://img.freepik.com/free-vector/bathroom-interior-with-furniture-blue-theme_1308-53101.jpg?ga=GA1.1.1947437701.1741853896&semt=ais_authors_boost",
  },
  {
    id: 8,
    title: "Outdoor Patio",
    client: "Tech Innovators",
    designer: "David Kim",
    completedDate: "2024-07-10",
    rating: 4.7,
    image: "https://img.freepik.com/free-vector/garden-furniture-isometric-composition-with-outdoor-scenery-house-entrance-with-chairs-sofa-baby-swing-vector-illustration_1284-70006.jpg?ga=GA1.1.1947437701.1741853896&semt=ais_authors_boost",
  },
];

export default function Dashboard() {
  const [projectFilter, setProjectFilter] = useState("recent"); // "recent" or "top-rated"
  const [designerFilter, setDesignerFilter] = useState("top-rated"); // "top-rated" or "most-projects"
  const navigate = useNavigate();

  // Filter projects based on selected filter
  const filteredProjects = [...completedProjects]
    .sort((a, b) => {
      if (projectFilter === "recent") {
        return new Date(b.completedDate) - new Date(a.completedDate);
      } else {
        return b.rating - a.rating;
      }
    })
    .slice(0, 4);

  // Filter designers based on selected filter
  const filteredDesigners = [...designersData]
    .sort((a, b) => {
      if (designerFilter === "top-rated") {
        return b.rating - a.rating;
      } else {
        return b.projects - a.projects;
      }
    });

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
      </div>
      
      {/* Statistics Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 mt-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-black">Our service statistics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mt-4">
          <div className="bg-white overflow-hidden shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm leading-5 font-medium text-gray-500 truncate dark:black">Total free servers</dt>
                <dd className="mt-1 text-3xl leading-9 font-semibold dark:text-[rgb(2,133,199)]">1.6M</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm leading-5 font-medium text-gray-500 truncate dark:black">Servers a month</dt>
                <dd className="mt-1 text-3xl leading-9 font-semibold text-indigo-600 dark:text-[rgb(2,133,199)]">19.2K</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm leading-5 font-medium text-gray-500 truncate dark:black">Servers a week</dt>
                <dd className="mt-1 text-3xl leading-9 font-semibold text-indigo-600 dark:text-[rgb(2,133,199)]">4.9K</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm leading-5 font-medium text-gray-500 truncate dark:black">Total users</dt>
                <dd className="mt-1 text-3xl leading-9 font-semibold text-indigo-600 dark:text-[rgb(2,133,199)]">166.7K</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      {/* Designers Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 mt-10">
        <div className="card hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2 p-1 rounded-md bg-primary-100">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
              </span>
              Designers ({filteredDesigners.length})
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
            {filteredDesigners.map((designer) => (
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
    
      {/* Clients Section */}
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
            {clients.map((client) => (
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
          
      {/* Completed Projects Section */}
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
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                <div className="h-60 overflow-hidden">
                  <img
                    src={project.image}
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
                    <p>Client: {project.client}</p>
                    <p>Designer: {project.designer}</p>
                    <p>Completed: {new Date(project.completedDate).toLocaleDateString()}</p>
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