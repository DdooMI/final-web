import React, { useState } from 'react';
import { FiUpload, FiFile, FiCheck, FiX, FiCode } from 'react-icons/fi';
import { uploadModelFile } from '../firebase/storage';

const ModelUploader = ({ designerId, projectId, onUploadSuccess, onUploadError }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState('html'); // Default to HTML files

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check if file has valid extension based on selected type
    const validExtension = fileType === 'html' 
      ? selectedFile.name.toLowerCase().endsWith('.html') || selectedFile.name.toLowerCase().endsWith('.htm')
      : selectedFile.name.toLowerCase().endsWith('.glb');
    
    if (!validExtension) {
      setError(`Only ${fileType === 'html' ? '.html/.htm' : '.glb'} files are supported`);
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
      const result = await uploadModelFile(file, designerId, projectId, fileType);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Call success callback with file info
      if (onUploadSuccess) {
        onUploadSuccess({...result, fileType});
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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Upload Design File</h3>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-center">
          <FiX className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setFileType('html')}
            className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
              fileType === 'html' 
                ? 'bg-[#C19A6B] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition-colors`}
          >
            <FiCode />
            <span>HTML Design</span>
          </button>
          <button
            onClick={() => setFileType('3d')}
            className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
              fileType === '3d' 
                ? 'bg-[#C19A6B] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition-colors`}
          >
            <FiFile />
            <span>3D Model</span>
          </button>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C19A6B] transition-colors bg-gray-50">
        <input
          type="file"
          id="model-file"
          accept={fileType === 'html' ? '.html,.htm' : '.glb'}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        
        {!file ? (
          <label
            htmlFor="model-file"
            className="cursor-pointer flex flex-col items-center justify-center py-8"
          >
            {fileType === 'html' ? (
              <FiCode className="text-5xl text-gray-400 mb-3" />
            ) : (
              <FiUpload className="text-5xl text-gray-400 mb-3" />
            )}
            <p className="text-gray-600 mb-2 font-medium">
              {fileType === 'html' 
                ? 'Click to select an HTML design file (.html/.htm)' 
                : 'Click to select a 3D model file (.glb)'}
            </p>
            <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
          </label>
        ) : (
          <div className="py-4">
            <div className="flex items-center justify-center mb-3">
              {fileType === 'html' ? (
                <FiCode className="text-2xl text-[#C19A6B] mr-2" />
              ) : (
                <FiFile className="text-2xl text-[#C19A6B] mr-2" />
              )}
              <span className="font-medium truncate max-w-xs">{file.name}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            
            {isUploading ? (
              <div className="w-full max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-[#C19A6B] h-3 rounded-full transition-all duration-300"
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
                  Upload File
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
        <p>Supported format: {fileType === 'html' ? '.html/.htm (HTML Design)' : '.glb (3D model)'}</p>
        <p>This file will be available for the client to download once uploaded.</p>
      </div>
    </div>
  );
};

export default ModelUploader;