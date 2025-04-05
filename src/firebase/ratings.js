import { db } from './firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';

// Add a new rating for a designer
export const addDesignerRating = async (clientId, designerId, projectId, rating, comment) => {
  try {
    // Create the rating document
    const ratingData = {
      clientId,
      designerId,
      projectId,
      rating,
      comment,
      createdAt: new Date()
    };

    // Add rating to the ratings collection
    const ratingsRef = collection(db, 'ratings');
    await addDoc(ratingsRef, ratingData);

    // Update designer's average rating
    const designerRef = doc(db, 'users', designerId);
    
    await runTransaction(db, async (transaction) => {
      const designerDoc = await transaction.get(designerRef);
      
      if (!designerDoc.exists()) {
        throw new Error('Designer not found');
      }

      const designerData = designerDoc.data();
      const currentRatingCount = designerData.ratingCount || 0;
      const currentRatingTotal = designerData.ratingTotal || 0;

      // Calculate new rating values
      const newRatingCount = currentRatingCount + 1;
      const newRatingTotal = currentRatingTotal + rating;
      const newAverageRating = newRatingTotal / newRatingCount;

      // Update designer document with new rating data
      transaction.update(designerRef, {
        ratingCount: newRatingCount,
        ratingTotal: newRatingTotal,
        averageRating: newAverageRating
      });
    });

    return true;
  } catch (error) {
    console.error('Error adding rating:', error);
    throw error;
  }
};

// Get a designer's average rating
export const getDesignerRating = async (designerId) => {
  try {
    const designerRef = doc(db, 'users', designerId);
    const designerDoc = await getDoc(designerRef);

    if (!designerDoc.exists()) {
      throw new Error('Designer not found');
    }

    const designerData = designerDoc.data();
    return {
      averageRating: designerData.averageRating || 0,
      ratingCount: designerData.ratingCount || 0
    };
  } catch (error) {
    console.error('Error getting designer rating:', error);
    throw error;
  }
};