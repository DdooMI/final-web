import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaEnvelope, FaArrowLeft, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Query users collection to find user by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", data.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("No account found with this email");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      if (!userData.emailVerified) {
        setError("Please verify your email before resetting password");
        return;
      }

      await sendPasswordResetEmail(auth, data.email);
      setSuccess(true);
      
      // Navigate to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      let errorMessage = "An error occurred while sending the password reset email";

      if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 shadow-md"
        role="alert"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FaExclamationCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  const getSuccessMessage = () => {
    if (!success) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 shadow-md"
        role="alert"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FaCheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">
              Password reset email sent! Please check your inbox and follow the instructions.
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center p-6 bg-gradient-to-br from-[#2d251d] to-[#4a3c2e]"
      style={{
        backgroundImage: "url('/ff.jpg')",
        backgroundBlendMode: "overlay",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#6e5a46] p-10 text-center rounded-3xl border border-[#A67B5B]/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md bg-opacity-95"
      >
        <h2 className="text-white text-3xl font-bold mb-3 capitalize tracking-wide">
          Reset Password
        </h2>
        <p className="text-white/80 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {getErrorMessage()}
        {getSuccessMessage()}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-3"
        >
          <div className="relative">
            <motion.input
              type="email"
              placeholder="Email Address"
              {...register("email")}
              className="w-full p-4 pl-12 border border-[#A67B5B]/50 rounded-xl text-lg focus:outline-none bg-white/95 focus:border-[#8B6B4A] focus:ring-2 focus:ring-[#8B6B4A]/30 transition-all duration-300"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A67B5B]" />
          </div>
          <p className="text-red-500 text-sm">{errors.email?.message}</p>

          <motion.button
            className="w-full mx-auto p-4 text-white bg-[#A67B5B] text-xl font-semibold rounded-xl hover:bg-[#8B6B4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mr-2"
                >
                  <FaEnvelope className="text-2xl" />
                </motion.div>
                <span>Sending...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </motion.button>

          <NavLink
            to="/login"
            className="flex items-center justify-center text-white/90 mt-4 hover:text-white transition-colors font-medium"
          >
            <FaArrowLeft className="mr-2" /> Back to Login
          </NavLink>
        </form>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;