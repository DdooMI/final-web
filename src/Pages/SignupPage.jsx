import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import z from "zod";
import { useAuth } from "../zustand/auth";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPencilAlt,
  FaHome,
} from "react-icons/fa";
import { useState } from "react";
import { createSignupNotification } from "../firebase/signupNotification";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const schema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters")
      .max(15, "Password must not exceed 15 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
    role: z.enum(["designer", "client"], {
      required_error: "Please select your role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });
  const { signUp, error } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log(data);
      await signUp(data, navigate);
      
      // Create notification for admin users about the new signup
      await createSignupNotification(data);
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
          Create New Account
        </h2>
        <p className="text-white/80 text-lg font-medium mb-4">
          Sign up to enjoy our services for free
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <motion.input
                type="text"
                placeholder="Full Name"
                {...register("username")}
                className="w-full p-4 pl-12 border border-[#A67B5B]/50 rounded-xl text-lg focus:outline-none bg-white/95 focus:border-[#8B6B4A] focus:ring-2 focus:ring-[#8B6B4A]/30 transition-all duration-300 "
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A67B5B]" />
            </div>
            <p className="text-red-500 text-sm text-left">
              {errors.username?.message}
            </p>
            <div className="relative">
              <motion.input
                type="email"
                placeholder="Email Address"
                {...register("email")}
                className="w-full p-4 pl-12 border border-[#A67B5B]/50 rounded-xl text-lg focus:outline-none bg-white/95 focus:border-[#8B6B4A] focus:ring-2 focus:ring-[#8B6B4A]/30 transition-all duration-300 "
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A67B5B]" />
            </div>
            <p className="text-red-500 text-sm text-left">
              {errors.email?.message}
            </p>

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
            <p className="text-red-500 text-sm text-left">
              {errors.password?.message}
            </p>

            <div className="relative">
              <motion.input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                {...register("confirmPassword")}
                className="w-full p-4 pl-12 pr-12 border border-[#A67B5B]/50 rounded-xl text-lg focus:outline-none bg-white/95 focus:border-[#8B6B4A] focus:ring-2 focus:ring-[#8B6B4A]/30 transition-all duration-300"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A67B5B]" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A67B5B] hover:text-[#8B6B4A] transition-colors"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-red-500 text-sm text-left">
              {errors.confirmPassword?.message}
            </p>

            <div className="mb-1">
              <p className="text-white text-xl font-semibold mb-2">
                Choose Your Role
              </p>
              <p className="text-white/70 text-sm mb-4">
                Select the role that best describes your purpose on our platform
              </p>
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
                    {...register("role")}
                    className="hidden peer"
                  />
                  <motion.label
                    htmlFor="rad1"
                    className={`cursor-pointer flex flex-col items-center p-6 rounded-xl border-2 ${
                      errors.role ? "border-red-500" : "border-white/30"
                    } hover:border-white/60 peer-checked:bg-[#A67B5B] peer-checked:border-[#A67B5B] peer-checked:text-white transition-all duration-300 relative overflow-hidden group-hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaPencilAlt className="text-3xl mb-3 text-[#dfb58e] group-hover:text-white transition-colors" />
                    <span className="text-xl text-white font-semibold mb-2">
                      Designer
                    </span>
                    <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                      Create and sell interior design solutions
                    </p>
                  </motion.label>
                </div>
                <div className="relative group">
                  <input
                    type="radio"
                    id="rad2"
                    value="client"
                    {...register("role")}
                    className="hidden peer"
                  />
                  <motion.label
                    htmlFor="rad2"
                    className={`cursor-pointer flex flex-col items-center p-6 rounded-xl border-2 ${
                      errors.role ? "border-red-500" : "border-white/30"
                    } hover:border-white/60 peer-checked:bg-[#A67B5B] peer-checked:border-[#A67B5B] peer-checked:text-white transition-all duration-300 relative overflow-hidden group-hover:shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaHome className="text-3xl mb-3 text-[#dfb58e] group-hover:text-white transition-colors" />
                    <span className="text-xl text-white font-semibold mb-2">
                      Client
                    </span>
                    <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                      Find the perfect designer for your space
                    </p>
                  </motion.label>
                </div>
              </motion.div>
            </div>
            <p className="text-red-500 text-sm text-left mt-1">
              {errors.role ? "Please select your role" : null}
            </p>
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
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </motion.button>

            <p className="text-white/90 mt-4">
              Already have an account?{" "}
              <NavLink
                to="/login"
                className="text-[#dfb58e] hover:text-white transition-colors font-medium"
              >
                Sign In
              </NavLink>
            </p>
          </div>
        </form>
      
      </motion.div>
    </div>
  );
}

export default Signup;
