import { useEffect, useState } from 'react';
import { PencilIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../zustand/auth';
import { axiosApi } from '../axios/axiosConfig';

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const {user, role, profile, updateProfile} = useAuth();
  const [adminData, setAdminData] = useState({ name: '', photoURL: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setAdminData({
        name: profile.name || '',
        photoURL: profile.photoURL || ''
      });
    }
  }, [profile]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ 
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Show loading state
      setLoading(true);
      setError(null);
      
      const imageData = new FormData();
      imageData.append("file", file);
      imageData.append("upload_preset", "home_customization");
      imageData.append("cloud_name", "dckwbkqjv");

      const res = await axiosApi.post("", imageData);
      const uploadedImageUrl = res.data.secure_url;
      
      // Update local state
      setAdminData(prev => ({
        ...prev,
        photoURL: uploadedImageUrl
      }));
      
      // Update profile in Firestore
      await updateDoc(doc(db, 'users', user.uid, 'profile', 'profileInfo'), {
        photoURL: uploadedImageUrl
      });
      
      // Update global state
      await updateProfile({ name: profile.name, photoURL: uploadedImageUrl });
      
      alert('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(`Error uploading image: ${error.message}`);
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!adminData.name.trim()) {
        alert('Name cannot be empty');
        return;
      }

      setLoading(true);
      setError(null);

      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid, 'profile', 'profileInfo'), {
        name: adminData.name,
        photoURL: adminData.photoURL
      });

      // Update global state
      await updateProfile({
        name: adminData.name,
        photoURL: adminData.photoURL
      });

      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Error updating profile: ${error.message}`);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  async function handleCreateAdmin() {
    try {
      // Validate form fields
      if (!newAdmin.name.trim()) {
        alert('Please enter a name');
        return;
      }
      
      if (!newAdmin.email.trim()) {
        alert('Please enter an email address');
        return;
      }
      
      if (!newAdmin.password.trim()) {
        alert('Please enter a password');
        return;
      }
      
      if (newAdmin.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newAdmin.email,
        newAdmin.password
      );

      // Create Firestore document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: new Date().toISOString()
      });

      // Create profile subcollection
      await setDoc(doc(db, 'users', userCredential.user.uid, 'profile', 'profileInfo'), {
        name: newAdmin.name,
        photoURL: ''
      });

      setShowCreateModal(false);
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        role: 'admin'
      });

      alert('Admin created successfully!');
    } catch (error) {
      console.error('Error creating admin:', error);
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email.');
        alert('This email is already registered. Please use a different email.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format. Please check the email address.');
        alert('Invalid email format. Please check the email address.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
        alert('Password is too weak. Please use a stronger password.');
      } else {
        setError(`Error creating admin: ${error.message}`);
        alert(`Error creating admin: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Prevent scrolling of background content when modal is open
    if (showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showCreateModal]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="btn btn-primary flex items-center space-x-2"
          disabled={loading}
        >
          <PencilIcon className="h-4 w-4" />
          <span>{isEditing ? (loading ? 'Saving...' : 'Save Changes') : 'Edit Profile'}</span>
        </button>
      </div>
      
      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex items-center space-x-4">
            <div className="relative">
              <img
                src={adminData.photoURL || '/person.gif'}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm cursor-pointer">
                  <PencilIcon className="h-4 w-4 text-gray-600" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            <div>
              <p className="font-medium">{adminData.name}</p>
              <p className="text-sm text-gray-500">{role}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={adminData.name}
              onChange={(e) => setAdminData({...adminData, name: e.target.value})}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setAdminData({...adminData, email: e.target.value})}
              disabled={true}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input
              type="text"
              value={role}
              disabled={true}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>
        </div>
      </div>


    

      {/* Create Admin Button */}
      <div className="mt-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <UserPlusIcon className="h-4 w-4" />
          <span>Create New Admin</span>
        </button>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 lg:left-64 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md z-50 mx-auto shadow-xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">Create New Admin</h2>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                  minLength="6"
                />
                <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAdmin}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
