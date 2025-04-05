import React, { useState } from 'react';
import { FiStar, FiCheck } from 'react-icons/fi';
import { addDesignerRating } from '../firebase/ratings';

const DesignerRating = ({ clientId, designerId, projectId, onRatingSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await addDesignerRating(clientId, designerId, projectId, rating, comment);
      
      setSuccess(true);
      
      if (onRatingSubmit) {
        onRatingSubmit({
          rating,
          comment,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-green-600 text-2xl" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Thank You for Your Feedback!</h3>
          <p className="text-gray-600">Your rating has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Rate Your Designer</h3>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleRatingSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">How would you rate your experience?</label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="text-3xl mr-1 focus:outline-none"
              >
                <FiStar 
                  className={`${(hoveredRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`} 
                />
              </button>
            ))}
            <span className="ml-2 text-gray-600">
              {rating > 0 ? (
                <span className="font-medium">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              ) : (
                'Select a rating'
              )}
            </span>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="comment" className="block text-gray-700 mb-2">
            Share your experience (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience working with this designer..."
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#C19A6B] focus:border-transparent"
            rows="4"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className={`px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition-colors ${(isSubmitting || rating === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DesignerRating;