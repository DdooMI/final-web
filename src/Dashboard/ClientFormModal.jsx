import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addClient, updateClient } from '../firebase/clients';
import {axiosApi} from '../axios/axiosConfig';
import { sendEmailVerification } from 'firebase/auth';

import PropTypes from 'prop-types';

export default function ClientFormModal({ isOpen, onClose, client = null, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'client',
        photoURL: '',
        balance: 0,
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(client?.photoURL || '/person.gif');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append("upload_preset", "home_customization");
            formData.append("cloud_name", "dckwbkqjv");
            const response = await axiosApi.post('', formData);
            setAvatarPreview(response.data.secure_url);
            setFormData(prev => ({ ...prev, photoURL: response.data.secure_url }));
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };
    // Initialize form with client data if editing
    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                email: client.email || '',
                role: 'client',
                photoURL: client.avatar || '',
                balance: client.balance || 0
            });
            setAvatarPreview(client.avatar || '/person.gif');
        } else {
            // Reset form when adding a new client
            setFormData({
                name: '',
                email: '',
                role: 'client',
                photoURL: '',
                balance: 0,
                password: ''
            });
            setAvatarPreview('/person.gif');
        }
    }, [client, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'balance' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Prepare data for Firebase
            const clientData = {
                email: formData.email,
                name: formData.name,
                photoURL: formData.photoURL,
                balance: parseFloat(formData.balance) || 0,
                password: formData.password
            };

            if (client) {
                // Update existing client
                await updateClient(client.id, clientData);
            } else {
                // Add new client
                const newClient = await addClient(clientData);
                
                // Send verification email
                if (newClient.user) {
                    await sendEmailVerification(newClient.user);
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving client:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please use a different email.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email format. Please check the email address.');
            } else {
                setError('Failed to save client. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white p-6">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {client ? 'Edit Client' : 'Add New Client'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-[#C19A6B] transition-colors duration-200"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mt-3 p-2 bg-red-100 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#C19A6B] focus:ring-[#C19A6B]"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={client !== null}
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#C19A6B] focus:ring-[#C19A6B] ${client ? 'bg-gray-100' : ''}`}
                                />
                                {client && (
                                    <p className="mt-1 text-sm text-gray-500">Email cannot be changed once a client is created.</p>
                                )}
                            </div>
                            {!client && (
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#C19A6B] focus:ring-[#C19A6B]"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="balance" className="block text-sm font-medium text-gray-700">
                                    Balance
                                </label>
                                <input
                                    type="number"
                                    name="balance"
                                    id="balance"
                                    min="0"
                                    step="0.01"
                                    value={formData.balance}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#C19A6B] focus:ring-[#C19A6B]"
                                />
                            </div>

                            <div>
                                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                                    Profile Image
                                </label>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar preview"
                                        className="w-16 h-16 rounded-full object-cover border"
                                    />
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0 file:text-sm file:font-semibold
                      file:bg-[#C19A6B] file:text-white hover:file:bg-[#A0784A]"
                                    />
                                </div>
                                {uploading && (
                                    <div className="flex items-center mt-2">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#C19A6B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-sm text-gray-500">Uploading image...</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#C19A6B] hover:bg-[#A0784A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C19A6B] disabled:opacity-50 transition-colors duration-200"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : client ? 'Update Client' : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

ClientFormModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    client: PropTypes.object,
    onSuccess: PropTypes.func.isRequired
};