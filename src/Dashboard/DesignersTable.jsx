import { useState, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { fetchDesigners, deleteDesigner, getDesignerById } from '../firebase/designers';
import DesignerFormModal from './DesignerFormModal';
import { useNavigate } from 'react-router-dom';

export default function DesignersTable() {
  const navigate = useNavigate();
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDesigner, setCurrentDesigner] = useState(null);
  
  // Fetch designers from Firestore
  useEffect(() => {
    const getDesigners = async () => {
      try {
        setLoading(true);
        const designersData = await fetchDesigners();
        setDesigners(designersData);
      } catch (err) {
        console.error("Error fetching designers:", err);
        setError("Failed to load designers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    getDesigners();
  }, []); // Removed filterRole from dependencies


  const filteredAndSortedDesigners = useMemo(() => {
    return designers
      .filter(designer => 
        Object.values(designer).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a, b) => {
        // Handle potential missing values safely
        const valA = a[sortConfig.key] ?? '';
        const valB = b[sortConfig.key] ?? '';
        
        // Convert Firestore timestamps to Date objects
        const dateA = valA?.toDate ? valA.toDate() : new Date(valA);
        const dateB = valB?.toDate ? valB.toDate() : new Date(valB);
        
        if (!isNaN(valA) && !isNaN(valB)) {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
      
        return sortConfig.direction === 'asc' 
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
  }, [designers, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Handle designer deletion
  const handleDeleteDesigner = async (id) => {
    if (window.confirm('Are you sure you want to delete this designer?')) {
      try {
        // Delete the designer using the imported function
        await deleteDesigner(id);
        
        // Update the local state
        setDesigners(designers.filter(designer => designer.id !== id));
      } catch (err) {
        console.error("Error deleting designer:", err);
        alert("Failed to delete designer. Please try again.");
      }
    }
  };

  // Handle opening the modal for adding a new designer
  const handleAddDesigner = () => {
    setCurrentDesigner(null);
    setIsModalOpen(true);
  };

  // Handle opening the modal for editing an existing designer
  const handleEditDesigner = async (id) => {
    try {
      setLoading(true);
      const designer = await getDesignerById(id);
      setCurrentDesigner(designer);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching designer details:", err);
      alert("Failed to load designer details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle successful form submission
  const handleFormSuccess = async () => {
    try {
      setLoading(true);
      const updatedDesigners = await fetchDesigners();
      setDesigners(updatedDesigners);
    } catch (err) {
      console.error("Error refreshing designers:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="sm:flex sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Designers</h1>
        <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:space-x-4">
          <button
            onClick={handleAddDesigner}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#3B82F6] hover:bg-[#488BF6FF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Designer
          </button>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -mt-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search designers..."
              className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading designers...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                
              {['', 'Name', 'Email', 'Balance', 'Joining Date','Role', 'Rating', 'Actions'].map((header, index) => (
                <th
                  key={index}
                  onClick={() => header && handleSort(header.toLowerCase().replace(' ', ''))}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedDesigners.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No designers found. {searchTerm ? 'Try adjusting your search.' : ''}
                  </td>
                </tr>
              ) : (
                filteredAndSortedDesigners.map((designer) => (
                  <tr 
                    key={designer.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/dashboard/designers/${designer.id}`)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <img 
                        src={designer.avatar} 
                        alt={designer.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{designer.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{designer.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">${designer.balance?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {new Date(designer.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{designer.role}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{designer.rating.toFixed(1)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit designer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDesigner(designer.id);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDesigner(designer.id);
                          }}
                          title="Delete designer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
       {/* Designer Form Modal */}
       <DesignerFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        designer={currentDesigner}
        onSuccess={handleFormSuccess}
      />
    </div>

     
  );
}
