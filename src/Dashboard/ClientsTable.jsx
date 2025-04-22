import { useState, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { fetchClients, deleteClient, getClientById } from '../firebase/clients';
import ClientFormModal from './ClientFormModal';
import { useNavigate } from 'react-router-dom';

export default function ClientsTable() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  // Fetch clients from Firestore
  useEffect(() => {
    const getClients = async () => {
      try {
        setLoading(true);
        const clientsData = await fetchClients();
        setClients(clientsData);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError("Failed to load clients. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getClients();
  }, []);

  // Filtered and sorted clients
  const filteredAndSortedClients = useMemo(() => {
    return clients
      .filter(client =>
        Object.values(client).some(value =>
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
  }, [clients, searchTerm, sortConfig]);

  // Handle client deletion
  const handleDeleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        // Delete the client using the imported function
        await deleteClient(id);

        // Update the local state
        setClients(clients.filter(client => client.id !== id));
      } catch (err) {
        console.error("Error deleting client:", err);
        alert("Failed to delete client. Please try again.");
      }
    }
  };

  // Handle opening the modal for adding a new client
  const handleAddClient = () => {
    setCurrentClient(null);
    setIsModalOpen(true);
  };

  // Handle opening the modal for editing an existing client
  const handleEditClient = async (id) => {
    try {
      setLoading(true);
      const client = await getClientById(id);
      setCurrentClient(client);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching client details:", err);
      alert("Failed to load client details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle successful form submission
  const handleFormSuccess = async () => {
    try {
      setLoading(true);
      const updatedClients = await fetchClients();
      setClients(updatedClients);
    } catch (err) {
      console.error("Error refreshing clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="p-4">
      <div className="sm:flex sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:space-x-4">
          <button
            onClick={handleAddClient}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#3B82F6] hover:bg-[#5A96F8FF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Client
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
          <p className="mt-2 text-gray-600">Loading Clients...</p>
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
              {filteredAndSortedClients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No Clients found. {searchTerm ? 'Try adjusting your search.' : ''}
                  </td>
                </tr>
              ) : (
                filteredAndSortedClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <img 
                        src={client.avatar} 
                        alt={client.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{client.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{client.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">${client.balance?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {new Date(client.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{client.role}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{client.rating.toFixed(1)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit client"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client.id);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id);
                          }}
                          title="Delete client"
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
       <ClientFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={currentClient}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
