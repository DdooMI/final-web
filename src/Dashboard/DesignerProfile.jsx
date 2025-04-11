import { useParams, useNavigate } from 'react-router-dom';
import { StarIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, BriefcaseIcon } from '@heroicons/react/24/outline';


export default function DesignerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const designer = ""

  if (!designer) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Designer not found</h2>
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
            src={designer.avatar}
            alt={designer.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{designer.name}</h1>
            <p className="text-gray-600">{designer.role}</p>
            <div className="flex items-center mt-2">
              <StarIcon className="h-5 w-5 text-yellow-400" />
              <span className="ml-1 font-medium">{designer.rating}</span>
              <span className="mx-2">•</span>
              <span>{designer.projects} projects</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href={`mailto:${designer.email}`} className="text-primary-600 hover:text-primary-700">
                  {designer.email}
                </a>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href={`tel:${designer.phone}`} className="text-primary-600 hover:text-primary-700">
                  {designer.phone}
                </a>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">{designer.location}</span>
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">{designer.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biography Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Biography</h2>
          <p className="text-gray-600">{designer.bio}</p>
        </div>

        {/* Specialties Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {designer.specialties.map((specialty, index) => (
              <span key={index} className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm">
                {specialty}
              </span>
            ))}
          </div>
        </div>

        {/* Completed Projects */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Completed Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designer.completedProjects.map((project) => (
              <div key={project.id} className="rounded-lg overflow-hidden shadow-sm border">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">For: {project.client}</span>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{project.rating}</span>
                    </div>
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
