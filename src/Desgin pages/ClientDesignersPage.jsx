/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { collection, getDoc, getDocs, query, where, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function ClientDesignersPage() {
  const { user, role } = useAuth();
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "designer")
        );
        const querySnapshot = await getDocs(q);
        const designersData = [];

        for (const docRef of querySnapshot.docs) {
          const designerData = docRef.data();

          // Get designer's profile info
          const profileRef = doc(db, "users", docRef.id, "profile", "profileInfo");
          const profileSnap = await getDoc(profileRef);
          let profileData = { name: "Designer", photoURL: "" };

          if (profileSnap.exists()) {
            profileData = profileSnap.data();
          }

          designersData.push({
            id: docRef.id,
            email: designerData.email,
            name: profileData.name,
            photoURL: profileData.photoURL,
          });
        }

        setDesigners(designersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigners();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
          </div>
        ) : designers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-lg text-gray-700">
              No designers available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {designers.map((designer) => (
              <div
                key={designer.id}
                className="bg-white shadow rounded-lg overflow-hidden transition-transform hover:scale-105"
              >
                <div className="h-40 bg-gray-200 flex items-center justify-center">
                  {designer.photoURL ? (
                    <img
                      src={designer.photoURL}
                      alt={designer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="/person.gif"
                      alt="Default profile"
                      className="w-24 h-24 object-cover rounded-full"
                    />
                  )}
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {designer.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{designer.email}</p>

                  <div className="space-y-2">
                    <button
                      className="w-full px-4 py-2 bg-[#C19A6B] text-white rounded-md hover:bg-[#A0784A] transition"
                      onClick={() => {
                        navigate(`/designer-portfolio/${designer.id}`);
                      }}
                    >
                      View Portfolio
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientDesignersPage;
