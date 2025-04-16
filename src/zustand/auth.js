import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { create } from "zustand";
import { auth, db } from "../firebase/firebaseConfig";

const googleProvider = new GoogleAuthProvider();

export const useAuth = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || "",
  role: localStorage.getItem("role") || null,
  profile: JSON.parse(localStorage.getItem("profile")) || null,
  error: null,

  clearError: () => set({ error: null }),

  signInWithGoogle: async (navigation, selectedRole) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user document if it doesn't exist
        await setDoc(userRef, {
          email: user.email,
          role: selectedRole, // Use selected role from the UI
          emailVerified: true,
        });

        // Create profile document
        const profileRef = doc(db, "users", user.uid, "profile", "profileInfo");
        const profileData = {
          name: user.displayName || "",
          photoURL: user.photoURL || "",
        };
        await setDoc(profileRef, profileData);

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        localStorage.setItem("role", selectedRole); // Store selected role
        localStorage.setItem("profile", JSON.stringify(profileData));

        set({
          user,
          token,
          role: selectedRole, // Use selected role in state
          profile: profileData,
          error: null,
        });
      } else {
        const userData = userSnap.data();
        const profileRef = doc(db, "users", user.uid, "profile", "profileInfo");
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.exists()
          ? profileSnap.data()
          : { name: user.displayName || "", photoURL: user.photoURL || "" };

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("profile", JSON.stringify(profileData));

        set({
          user,
          token,
          role: userData.role,
          profile: profileData,
          error: null,
        });
      }

      navigation("/");
    } catch (err) {
      let errorMessage = "An error occurred during Google sign-in";

      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in popup was closed before completing";
      } else if (err.code === "auth/cancelled-popup-request") {
        errorMessage = "Another sign-in popup is already open";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage = "Sign-in popup was blocked by the browser";
      }

      set({ error: errorMessage });
    }
  },

  login: async (data, navigation) => {
    try {
      const res = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )
      const user = res.user;
      
      if (!user.emailVerified) {
        set({ error: "Please verify your email before logging in." });
        return;
      }

      const token = await user.getIdToken();
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      // Update email verification status in Firestore
      await updateDoc(userRef, {
        emailVerified: true
      });

      if (userSnap.exists()) {
        const userData = userSnap.data();

        const profileRef = doc(db, "users", user.uid, "profile", "profileInfo");
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.exists()
          ? profileSnap.data()
          : { name: "", photoURL: "" };

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("profile", JSON.stringify(profileData));

        set({
          user,
          token,
          role: userData.role,
          profile: profileData,
          error: null,
        });

        if (userData.role === 'admin') {
          navigation('/dashboard');
        } else {
          navigation('/');
        }
      } else {
        throw new Error("User role not found.");
      }
    } catch (err) {
      let errorMessage = "An error occurred during login";

      if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (err.code === "auth/invalid-credential") {
        errorMessage = "Incorrect email or password";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      }

      set({ error: errorMessage });
    }
  },

  signUp: async (data, navigation) => {
    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = res.user;
      
      // Send email verification
      await sendEmailVerification(user);

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        email: user.email,
        role: data.role,
        emailVerified: false,
      });

      const profileRef = doc(db, "users", user.uid, "profile", "profileInfo");
      const profileData = {
        name: data.username || "",
        photoURL: data.photoURL || "",
      };
      await setDoc(profileRef, profileData);

      set({ 
        user: null,
        token: null,
        role: null,
        profile: null,
        error: null
      });

      navigation("/login");
    } catch (err) {
      let errorMessage = "An error occurred during signup";

      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage =
          "Email/password accounts are not enabled. Please contact support";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password must be at least 6 characters long and contain a mix of letters, numbers, and special characters";
      }

      set({ error: errorMessage });
    }
  },

  updateProfile: async (updatedProfile) => {
    try {
      const { user } = get();
      if (!user) throw new Error("User not logged in");

      const profileRef = doc(db, "users", user.uid, "profile", "profileInfo");
      await updateDoc(profileRef, updatedProfile);

      const newProfile = {
        ...get().profile,
        ...updatedProfile,
        name: updatedProfile.name || get().profile?.name || "",
        photoURL: updatedProfile.photoURL || get().profile?.photoURL || "",
      };

      localStorage.setItem("profile", JSON.stringify(newProfile));
      set({ profile: newProfile });
    } catch (err) {
      let errorMessage = "An error occurred during login";

      if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      }

      set({ error: errorMessage });
    }
  },

  logout: async (navigation) => {
    await signOut(auth);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("profile");

    set({ user: null, token: "", role: null, profile: null, error: null });
    navigation("/");
  },
}));
