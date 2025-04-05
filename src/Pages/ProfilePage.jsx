"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import axiosApi from "../axios/axiosConfig";
import UserBalance from "../payment/user-balance";

export default function ProfilePage() {
  const { user, role, profile, updateProfile, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [imageFile, setImageFile] = useState();
  const [fileName, setFileName] = useState("Choose an image");
  const navigate = useNavigate();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImageFile(file);
    setFileName(file.name);
  };
  const [activeTab, setActiveTab] = useState("all");
  const handleSave = async () => {
    try {
      if (!imageFile && newName === profile.name) {
        setEditMode(false);
        return;
      }

      let uploadedImageUrl = profile.photoURL;

      if (imageFile) {
        const imageData = new FormData();
        imageData.append("file", imageFile);
        imageData.append("upload_preset", "home_customization");
        imageData.append("cloud_name", "dckwbkqjv");

        const res = await axiosApi.post("", imageData);

        uploadedImageUrl = res.data.secure_url;
      }

      await updateProfile({ name: newName, photoURL: uploadedImageUrl });

      setEditMode(false);
      setFileName("Choose an image");
      setImageFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl text-gray-900">Portfolio</div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  logout(navigate);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg mb-8 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={profile?.photoURL || "/person.gif"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center md:text-left flex-1 ">
              {editMode ? (
                <div className="flex flex-col gap-1 max-w-2xs">
                  {" "}
                  <input
                    type="text"
                    className="border px-2 py-1 rounded "
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="fileInput"
                    className="border px-2 py-1 rounded cursor-pointer bg-gray-100 hover:bg-gray-200"
                  >
                    {fileName}
                  </label>
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.name}
                </h1>
              )}
              <p className="text-gray-600 text-lg">{user?.email}</p>
              <div className="mt-3">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
                    role === "designer"
                      ? "bg-[#A67B5B]/10 text-[#A67B5B]"
                      : "bg-[#A67B5B]/10 text-[#c1916d]"
                  }`}
                >
                  {role?.charAt(0).toUpperCase() + role?.slice(1)}
                </span>
              </div>
            </div>

            <div className=" flex flex-col sm:flex-row gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#A67B5B] text-white rounded-md"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-[#A67B5B] text-white rounded-md"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Balance Section */}
        <UserBalance />

        {/* Projects Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b">
            <div className="px-6 py-4 flex">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "all"
                    ? "border-b-2 border-[#A67B5B] text-[#A67B5B]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All Projects
              </button>
              {role === "designer" ? (
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "published"
                      ? "border-b-2 border-[#A67B5B] text-[#A67B5B]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("published")}
                >
                  Published Projects
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
