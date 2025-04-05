import React from 'react';
import { FiDownload, FiFile, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const ModelDownloader = ({ modelFiles = [] }) => {
  if (!modelFiles || modelFiles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Project Files</h3>
        <div className="text-center py-8 text-gray-500">
          <FiClock className="mx-auto text-4xl mb-3" />
          <p>No 3D model files have been uploaded yet.</p>
          <p className="text-sm mt-2">The designer will upload the completed 3D model when ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Project Files</h3>
      
      <div className="space-y-4">
        {modelFiles.map((file) => (
          <div 
            key={file.fileId} 
            className="border border-gray-200 rounded-lg p-4 hover:border-[#C19A6B] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <FiFile className="text-[#C19A6B] text-xl mt-1 mr-3" />
                <div>
                  <h4 className="font-medium">{file.fileName}</h4>
                  <div className="text-sm text-gray-500 mt-1">
                    <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span className="mx-2">•</span>
                    <span>
                      {file.uploadedAt ? 
                        `Uploaded ${formatDistanceToNow(new Date(file.uploadedAt.toDate()), { addSuffix: true })}` : 
                        'Recently uploaded'}
                    </span>
                  </div>
                </div>
              </div>
              
              <a
                href={file.url}
                download={file.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition-colors"
              >
                <FiDownload className="mr-2" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>These files contain the 3D models (.glb) for your project.</p>
        <p>You can open .glb files with various 3D viewers or import them into 3D applications.</p>
      </div>
    </div>
  );
};

export default ModelDownloader;