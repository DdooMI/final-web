import React, { useState, useEffect } from 'react';
import { FiStar, FiX, FiCalendar, FiUser } from 'react-icons/fi';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { formatDistanceToNow } from 'date-fns';

const RatingDetailsModal = ({ isOpen, onClose, rating, designerId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientNames, setClientNames] = useState({});
  
  useEffect(() => {
    if (isOpen && designerId) {
      fetchReviews();
    }
  }, [isOpen, designerId]);

  const fetchReviews = async () => {
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(
        ratingsRef,
        where('designerId', '==', designerId)
      );
      
      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          rating: data.rating || 0,
          comment: data.comment || ''
        };
      }).sort((a, b) => b.createdAt - a.createdAt);
      
      // Fetch client names from profile subcollection
      const clientIds = [...new Set(reviewsData.map(review => review.clientId))];
      const clientData = {};
      
      for (const clientId of clientIds) {
        const profileDoc = await getDoc(doc(db, 'users', clientId, 'profile','profileInfo'));
        if (profileDoc.exists()) {
          clientData[clientId] = profileDoc.data().name || 'Anonymous';
        } else {
          // Fallback to main user document if profile doesn't exist
          const clientDoc = await getDoc(doc(db, 'users', clientId));
          if (clientDoc.exists()) {
            clientData[clientId] = clientDoc.data().name || 'Anonymous';
          } else {
            clientData[clientId] = 'Anonymous';
          }
        }
      }
      
      setClientNames(clientData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { averageRating, ratingCount } = rating;
  
  // Calculate rating breakdown from reviews and sync with rating prop
  const ratingBreakdown = {};
  // Initialize all rating levels to 0
  for (let i = 1; i <= 5; i++) {
    ratingBreakdown[i] = 0;
  }
  // Count reviews for each rating level
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingBreakdown[review.rating]++;
    }
  });
  // Ensure total matches ratingCount
  const totalReviews = Object.values(ratingBreakdown).reduce((sum, count) => sum + count, 0);
  if (totalReviews !== ratingCount && ratingCount > 0) {
    // Adjust the breakdown to match the total count
    const difference = ratingCount - totalReviews;
    if (difference > 0) {
      // Add the difference to the highest rated category (5 stars)
      ratingBreakdown[5] += difference;
    }
  }

  // Calculate percentage for each rating level
  const calculatePercentage = (count) => {
    return ratingCount > 0 ? (count / ratingCount) * 100 : 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Rating Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-[#C19A6B] mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                className={`w-5 h-5 ${star <= averageRating ? 'text-[#C19A6B] fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500">
            Based on {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center">
              <div className="flex items-center w-24">
                <span className="text-sm text-gray-600 mr-2">{star}</span>
                <FiStar className="w-4 h-4 text-[#C19A6B] fill-current" />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C19A6B] rounded-full"
                  style={{
                    width: `${calculatePercentage(ratingBreakdown[star] || 0)}%`,
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm text-gray-500">
                {ratingBreakdown[star] || 0}
              </div>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No reviews yet</div>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FiUser className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {clientNames[review.clientId] || 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <FiCalendar className="mr-1" />
                      {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                    </div>
                  </div>

                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-[#C19A6B] fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {review.rating === 5 && 'Excellent'}
                      {review.rating === 4 && 'Very Good'}
                      {review.rating === 3 && 'Good'}
                      {review.rating === 2 && 'Fair'}
                      {review.rating === 1 && 'Poor'}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingDetailsModal;