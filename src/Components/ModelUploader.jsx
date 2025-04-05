import React, { useState } from 'react';
import { FiUpload, FiFile, FiCheck, FiX } from 'react-icons/fi';
import { uploadModelFile } from '../supabase/storage';

const ModelUploader = ({ designerId, projectId, onUploadSuccess, onUploadError }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check if file is a .glb file
    if (!selectedFile.name.toLowerCase().endsWith('.glb')) {
      setError('Only .glb 3D model files are supported');
      return;
    }
    
    // Check file size (limit to 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Upload file to Firebase Storage
      const result = await uploadModelFile(file, designerId, projectId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Call success callback with file info
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
      // Reset state after successful upload
      setTimeout(() => {
        setFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
      setIsUploading(false);
      
      if (onUploadError) {
        onUploadError(err);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Upload 3D Model</h3>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-center">
          <FiX className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C19A6B] transition-colors">
        <input
          type="file"
          id="model-file"
          accept=".glb"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        
        {!file ? (
          <label
            htmlFor="model-file"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <FiUpload className="text-4xl text-gray-400 mb-2" />
            <p className="text-gray-600 mb-1">Click to select a 3D model file (.glb)</p>
            <p className="text-xs text-gray-500">Maximum file size: 50MB</p>
          </label>
        ) : (
          <div className="py-2">
            <div className="flex items-center justify-center mb-3">
              <FiFile className="text-2xl text-[#C19A6B] mr-2" />
              <span className="font-medium truncate max-w-xs">{file.name}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            
            {isUploading ? (
              <div className="w-full max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-[#C19A6B] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {uploadProgress === 100 ? (
                    <span className="text-green-600 flex items-center justify-center">
                      <FiCheck className="mr-1" /> Upload complete!
                    </span>
                  ) : (
                    `Uploading... ${uploadProgress}%`
                  )}
                </p>
              </div>
            ) : (
              <div className="flex space-x-3 justify-center">
                <button
                  type="button"
                  onClick={handleUpload}
                  className="px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition-colors"
                >
                  Upload Model
                </button>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Supported format: .glb (3D model)</p>
        <p>This file will be available for the client to download once uploaded.</p>
      </div>
    </div>
  );
};

export default ModelUploader;