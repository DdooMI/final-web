import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, PhoneIcon, GlobeAltIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getClientById } from '../firebase/clients';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const clientData = await getClientById(id);
        if (!clientData) {
          throw new Error('Client not found');
        }
        setClient(clientData);
        await fetchRequests(id);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const fetchRequests = async (clientId) => {
    try {
      const q = query(
        collection(db, 'designRequests'),
        where('clientId', '==', clientId)
      );

      const querySnapshot = await getDocs(q);
      const requestsData = await Promise.all(querySnapshot.docs.map(async docu => {
        const requestData = docu.data();
        
        // Get proposals for this request
        const proposalsQuery = query(
          collection(db, 'designProposals'),
          where('requestId', '==', docu.id)
        );
        const proposalsSnapshot = await getDocs(proposalsQuery);
        const proposals = proposalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return {
          id: docu.id,
          ...requestData,
          proposals: proposals,
          createdAt: requestData.createdAt ? requestData.createdAt.toDate() : new Date(),
          proposalsCount: proposals.length
        };
      }));

      setRequests(requestsData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const formatDate = (date) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
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
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B82F6] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading client profile...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Client not found</h2>
        <p className="mt-2 text-gray-600">{error || 'The requested client could not be found.'}</p>
        <button 
          onClick={() => navigate('/dashboard/clients')}
          className="mt-4 px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-[#2563EB]"
        >
          Return to Clients
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
            src={client.photoURL || '/person.gif'}
            alt={client.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-[#3B82F6]"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">Client</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href={`mailto:${client.email}`} className="text-[#3B82F6] hover:text-[#2563EB]">
                  {client.email}
                </a>
              </div>
              {client.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <a href={`tel:${client.phone}`} className="text-[#3B82F6] hover:text-[#2563EB]">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.website && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <a href={`https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:text-[#2563EB]">
                    {client.website}
                  </a>
                </div>
              )}
              {client.location && (
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">{client.location}</span>
                </div>
              )}
              {client.joiningDate && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    Joined {new Date(client.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Balance Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-[#3B82F6]">
              ${client.balance?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Requests Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Design Requests</h2>
          {requests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={request.referenceImageUrl || '/project-placeholder.jpg'}
                      alt={request.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{request.title}</h3>
                    <div className="text-xs text-gray-500 mb-2">
                      <p>Created: {formatDate(request.createdAt)}</p>
                      <p>Status: {request.status}</p>
                      <p>Proposals: {request.proposalsCount}</p>
                    </div>
                    <div className="mt-auto">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Budget:</span>
                        <span className="ml-1 text-[#3B82F6] font-medium">
                          ${request.budget || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No design requests found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
