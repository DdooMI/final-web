import React from 'react';
import { FiX } from 'react-icons/fi';

function ImageZoomModal({ imageUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="relative max-w-full max-h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>
        
        {/* Image */}
        <img
          src={imageUrl}
          alt="Zoomed image"
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      </div>
    </div>
  );
}

export default ImageZoomModal;