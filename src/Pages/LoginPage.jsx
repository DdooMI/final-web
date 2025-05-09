import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import z from "zod";
import { useAuth } from "../zustand/auth";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import {
  FaEnvelope,
  FaLock,
  FaGoogle,
  FaFacebook,
  FaGithub,
  FaHome,
  FaPencilAlt,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("client");
  const { login, signInWithGoogle, error, clearError } = useAuth();

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#FEE2E2",
          color: "#DC2626",
          border: "1px solid #DC2626",
        },
      });
    }
  }, [error]);
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

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      toast.error('Please select a role before signing in with Google', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#FEE2E2',
          color: '#DC2626',
          border: '1px solid #DC2626',
        },
      });
      return;
    }
    setIsLoading(true);
    try {
      await signInWithGoogle(navigate, selectedRole);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
          Sign In
        </h2>

        <Toaster />
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
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password")}
              className="w-full p-4 pl-12 pr-12 border border-[#A67B5B]/50 rounded-xl text-lg focus:outline-none bg-white/95 focus:border-[#8B6B4A] focus:ring-2 focus:ring-[#8B6B4A]/30 transition-all duration-300"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A67B5B]" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A67B5B] hover:text-[#8B6B4A] transition-colors"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
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
        <div className="mb-4">
            <p className="text-white text-xl font-semibold mb-2">Choose Your Role</p>
            <p className="text-white/70 text-sm mb-4">Select your role before signing in</p>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative group">
                <input
                  type="radio"
                  id="rad1"
                  value="designer"
                  checked={selectedRole === "designer"}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="hidden peer"
                />
                <motion.label
                  htmlFor="rad1"
                  className={`cursor-pointer flex flex-col items-center p-6 rounded-xl border-2 border-white/30 hover:border-white/60 peer-checked:bg-[#A67B5B] peer-checked:border-[#A67B5B] peer-checked:text-white transition-all duration-300 relative overflow-hidden group-hover:shadow-lg`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaPencilAlt className="text-3xl mb-3 text-[#dfb58e] group-hover:text-white transition-colors" />
                  <span className="text-xl text-white font-semibold mb-2">Designer</span>
                </motion.label>
              </div>

              <div className="relative group">
                <input
                  type="radio"
                  id="rad2"
                  value="client"
                  checked={selectedRole === "client"}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="hidden peer"
                />
                <motion.label
                  htmlFor="rad2"
                  className={`cursor-pointer flex flex-col items-center p-6 rounded-xl border-2 border-white/30 hover:border-white/60 peer-checked:bg-[#A67B5B] peer-checked:border-[#A67B5B] peer-checked:text-white transition-all duration-300 relative overflow-hidden group-hover:shadow-lg`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaHome className="text-3xl mb-3 text-[#dfb58e] group-hover:text-white transition-colors" />
                  <span className="text-xl text-white font-semibold mb-2">Client</span>
                </motion.label>
              </div>
            </motion.div>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
          <motion.button
            onClick={handleGoogleSignIn}
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
