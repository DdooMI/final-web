import { create } from "zustand";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const useBalance = create((set, get) => ({
  balance: 0,
  isLoading: false,
  error: null,

  // Fetch the user's balance from Firestore
  fetchBalance: async (userId) => {
    if (!userId) return;
    
    set({ isLoading: true, error: null });
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // If balance field doesn't exist, it will default to 0
        set({ balance: userData.balance || 0 });
      } else {
        set({ balance: 0 });
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      set({ error: "Failed to fetch balance" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Add funds to the user's balance
  addFunds: async (userId, amount) => {
    if (!userId) return false;
    
    set({ isLoading: true, error: null });
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentBalance = userData.balance || 0;
        const newBalance = currentBalance + amount;
        
        await updateDoc(userRef, {
          balance: newBalance
        });
        
        set({ balance: newBalance });
        return true;
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error adding funds:", error);
      set({ error: "Failed to add funds" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Use balance for a payment
  useBalance: async (userId, amount) => {
    if (!userId) return false;
    
    set({ isLoading: true, error: null });
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentBalance = userData.balance || 0;
        
        if (currentBalance < amount) {
          set({ error: "Insufficient balance" });
          return false;
        }
        
        const newBalance = currentBalance - amount;
        await updateDoc(userRef, {
          balance: newBalance
        });
        
        set({ balance: newBalance });
        return true;
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error using balance:", error);
      set({ error: "Failed to process payment" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
}));