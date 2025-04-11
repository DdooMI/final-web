import { useParams, useNavigate } from 'react-router-dom';
import { StarIcon, EnvelopeIcon, PhoneIcon, GlobeAltIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';


export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const client = ""

  if (!client) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Client not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 btn btn-primary"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={client.avatar}
            alt={client.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.industry}</p>
            <div className="flex items-center mt-2">
              <StarIcon className="h-5 w-5 text-yellow-400" />
              <span className="ml-1 font-medium">{client.rating}</span>
              <span className="mx-2">•</span>
              <span>{client.projects} projects</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href={`mailto:${client.email}`} className="text-primary-600 hover:text-primary-700">
                  {client.email}
                </a>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href={`tel:${client.phone}`} className="text-primary-600 hover:text-primary-700">
                  {client.phone}
                </a>
              </div>
              <div className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href={`https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                  {client.website}
                </a>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">{client.location}</span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Founded {client.foundedYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-gray-600">{client.description}</p>
        </div>

        {/* Projects Gallery */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Project Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.completedProjects.flatMap(project => 
              project.images.map((image, index) => (
                <div key={`${project.id}-${index}`} className="relative group">
                  <img 
                    src={image} 
                    alt={`${project.title} - Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg transition-transform transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{project.title}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project History */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Project History</h2>
          <div className="space-y-4">
            {client.completedProjects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <p className="text-sm text-gray-500">Designer: {project.designer}</p>
                    <p className="text-sm text-gray-500">
                      Completed: {new Date(project.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-5 w-5 text-yellow-400" />
                    <span className="ml-1 font-medium">{project.rating}</span>
                  </div>
                </div>
                <p className="mt-2 text-gray-600">{project.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
