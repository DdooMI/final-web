import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import z from "zod";
import { useAuth } from "../zustand/auth";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaGoogle,
  FaFacebook,
  FaGithub,
  FaHome,
  FaExclamationCircle,
} from "react-icons/fa";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must not exceed 50 characters"),
});

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
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
    try {
      await login(data, navigate);
    } catch (error) {
      console.error(error);
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

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center p-6 bg-gradient-to-br from-[#2d251d] to-[#4a3c2e]"
      style={{
        backgroundImage: "url('../public/ff.jpg')",
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
          Sign In
        </h2>

        {getErrorMessage()}

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

          <div className="relative">
            <motion.input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full p-4 pl-12 pr-4 border border-[#A67B5B]/50 rounded-xl text-lg focus:outline-none bg-white/95 focus:border-[#8B6B4A] focus:ring-2 focus:ring-[#8B6B4A]/30 transition-all duration-300"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A67B5B]" />
           
          </div>
          <p className="text-red-500 text-sm">{errors.password?.message}</p>
          
          <div className="flex justify-end">
            <NavLink
              to="/forgot-password"
              className="text-[#dfb58e] hover:text-white transition-colors text-sm font-medium"
            >
              Forgot Password?
            </NavLink>
          </div>

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
                  <FaHome className="text-2xl" />
                </motion.div>
                <span>Logging in...</span>
              </div>
            ) : (
              "Log In"
            )}
          </motion.button>

          <p className="text-white/90 mt-4">
            Don&apos;t have an account?{" "}
            <NavLink
              to="/signup"
              className="text-[#dfb58e] hover:text-white transition-colors font-medium"
            >
              Sign Up
            </NavLink>
          </p>

          <div className="relative my-6">
            <hr className="border-t border-white/20" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6e5a46] px-4 text-white/70 text-sm">
              OR
            </span>
          </div>
        </form>
        <div className="flex justify-center space-x-4 mt-4">
          <motion.button
            onClick={() => {
              // Handle Google login
              console.log("Google login clicked");
            }}
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaGoogle className="text-2xl text-red-500" />
          </motion.button>
          <motion.button
            onClick={() => {
              // Handle Facebook login
              console.log("Facebook login clicked");
            }}
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFacebook className="text-2xl text-blue-500" />
          </motion.button>
          <motion.button
            onClick={() => {
              // Handle Github login
              console.log("Github login clicked");
            }}
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaGithub className="text-2xl text-white" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
