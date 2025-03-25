import React, { useState } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate } from "react-router-dom";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function ClientRequestPage() {
  const { user, role } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    duration: "",
    roomType: "living",
    additionalDetails: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Add the request to Firestore
      await addDoc(collection(db, "designRequests"), {
        userId: user.uid,
        userEmail: user.email,
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        duration: formData.duration,
        roomType: formData.roomType,
        additionalDetails: formData.additionalDetails,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      // Reset form
      setFormData({
        title: "",
        description: "",
        budget: "",
        duration: "",
        roomType: "living",
        additionalDetails: "",
      });

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter a descriptive title for your design project"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
              />
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
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
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
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your design requirements, style preferences, and any specific features you want"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
              ></textarea>
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
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  placeholder="Enter your maximum budget in USD"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
                />
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
                  name="duration"
                  min="1"
                  max="365"
                  placeholder="Enter estimated project duration in days"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
                />
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
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleChange}
                rows="3"
                placeholder="Add any other important details, preferences, or special requirements for your project"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#C19A6B] focus:border-[#C19A6B]"
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClientRequestPage;
