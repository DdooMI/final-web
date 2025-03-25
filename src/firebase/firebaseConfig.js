// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA3Z4sxN68nWrYsU17rGJESA-DWz2iI_dY",
    authDomain: "home-customization-67874.firebaseapp.com",
    projectId: "home-customization-67874",
    storageBucket: "home-customization-67874.firebasestorage.app",
    messagingSenderId: "52639531068",
    appId: "1:52639531068:web:f366c8dd04b386b67d0339",
    measurementId: "G-BHTS3WJGHE"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);