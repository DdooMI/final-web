import React, { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { useBalance } from "../zustand/balance";
import { Navigate, useNavigate } from "react-router-dom";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axiosApi from "../axios/axiosConfig";

// Form validation schema
const requestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Budget must be a positive number"),
  duration: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 365, "Duration must be between 1 and 365 days"),
  roomType: z.string(),
  additionalDetails: z.string().optional(),
  // We don't need to validate the image in the schema as it's handled separately
});

function ClientRequestPage() {
  const { user, role } = useAuth();
  const { balance, fetchBalance, isLoading: balanceLoading } = useBalance();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("Choose a reference image");
  const [imagePreview, setImagePreview] = useState(null);
  
  // Fetch user balance when component mounts
  useEffect(() => {
    if (user) {
      fetchBalance(user.uid);
    }
  }, [user, fetchBalance]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: "",
      duration: "",
      roomType: "living",
      additionalDetails: "",
    }
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    setFileName(file.name);
    
    // Create preview URL for the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setInsufficientBalance(false);
    
    // Check if budget exceeds available balance
    const budgetAmount = Number(data.budget);
    if (budgetAmount > balance) {
      setInsufficientBalance(true);
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload image to Cloudinary if an image was selected
      let referenceImageUrl = "";
      
      if (imageFile) {
        const imageData = new FormData();
        imageData.append("file", imageFile);
        imageData.append("upload_preset", "home_customization");
        imageData.append("cloud_name", "dckwbkqjv");

        const res = await axiosApi.post("", imageData);
        referenceImageUrl = res.data.secure_url;
      }

      // Add the request to Firestore
      await addDoc(collection(db, "designRequests"), {
        userId: user.uid,
        userEmail: user.email,
        title: data.title,
        description: data.description,
        budget: data.budget,
        duration: data.duration,
        roomType: data.roomType,
        additionalDetails: data.additionalDetails || "",
        referenceImageUrl: referenceImageUrl, // Add the image URL to the document
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      // Reset form and image states
      reset();
      setImageFile(null);
      setFileName("Choose a reference image");
      setImagePreview(null);

      // Reset success message after 3 seconds and navigate to requests page
      setTimeout(() => {
        setSubmitSuccess(false);
        navigate("/client-requests");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Submit a Design Request
          </h1>
          <p className="text-lg text-gray-600">
            Tell us about your dream interior design project
          </p>
        </div>

        {submitSuccess && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline">
              {" "}
              Your design request has been submitted successfully.
            </span>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl p-8">
          {/* Display user balance */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Your Available Balance:</span>
              <span className="text-xl font-bold text-[#C19A6B]">${balance.toFixed(2)} USD</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Your budget must not exceed your available balance.</p>
          </div>
          
          {insufficientBalance && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative" role="alert">
              <strong className="font-bold">Insufficient balance!</strong>
              <span className="block sm:inline"> Your budget exceeds your available balance. Please reduce your budget or add funds to your account.</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Project Title
              </label>
              <input
                type="text"
                id="title"
                {...register("title")}
                placeholder="Enter a descriptive title for your design project"
                className={`mt-1 block w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="roomType"
                className="block text-sm font-medium text-gray-700"
              >
                Room Type
              </label>
              <select
                id="roomType"
                {...register("roomType")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
              >
                <option value="living">Living Room</option>
                <option value="bedroom">Bedroom</option>
                <option value="kitchen">Kitchen</option>
                <option value="bathroom">Bathroom</option>
                <option value="office">Home Office</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows="4"
                placeholder="Describe your design requirements, style preferences, and any specific features you want"
                className={`mt-1 block w-full border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]`}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="budget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Budget (USD)
                </label>
                <input
                  type="number"
                  id="budget"
                  {...register("budget")}
                  placeholder="Enter your maximum budget in USD"
                  className={`mt-1 block w-full border ${errors.budget ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]`}
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700"
                >
                  Project Duration (days)
                </label>
                <input
                  type="number"
                  id="duration"
                  min="1"
                  max="365"
                  placeholder="Enter estimated project duration in days"
                  {...register("duration")}
                  className={`mt-1 block w-full border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]`}
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="additionalDetails"
                className="block text-sm font-medium text-gray-700"
              >
                Additional Details
              </label>
              <textarea
                id="additionalDetails"
                {...register("additionalDetails")}
                rows="3"
                placeholder="Add any other important details, preferences, or special requirements for your project"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
              ></textarea>
            </div>
            
            <div>
              <label
                htmlFor="referenceImage"
                className="block text-sm font-medium text-gray-700"
              >
                Reference Image
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload an image that shows your style preferences or inspiration for the design
              </p>
              
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="referenceImage"
                  className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C19A6B]"
                >
                  {fileName}
                </label>
                <input
                  id="referenceImage"
                  name="referenceImage"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
              
              {imagePreview && (
                <div className="mt-3">
                  <div className="relative w-40 h-40 rounded-md overflow-hidden border border-gray-300">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setFileName("Choose a reference image");
                        setImagePreview(null);
                        // Reset the file input value to allow re-uploading the same file
                        document.getElementById('referenceImage').value = '';
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClientRequestPage;
