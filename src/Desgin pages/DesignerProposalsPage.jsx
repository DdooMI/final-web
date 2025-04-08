import { useState, useEffect } from "react";
import { useAuth } from "../zustand/auth";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createNotification } from "../firebase/notifications";
import { formatDistanceToNow } from "date-fns";

function DesignerProposalsPage() {
  const { user, role } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [requestDetails, setRequestDetails] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [clientNames, setClientNames] = useState({});

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        // Get designer's proposals
        const q = query(
          collection(db, "designProposals"),
          where("designerId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const proposalsData = [];

        querySnapshot.forEach((doc) => {
          proposalsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt:
              doc.data().createdAt
                ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true })
                : "Unknown date",
          });
        });

        setProposals(proposalsData);

        // Get request details for each proposal
        const requestDetailsData = {};
        for (const proposal of proposalsData) {
          if (proposal.requestId) {
            const requestDoc = await getDoc(
              doc(db, "designRequests", proposal.requestId)
            );
            if (requestDoc.exists()) {
              const requestData = requestDoc.data();
              requestDetailsData[proposal.requestId] = {
                ...requestData,
                createdAt:
                  requestData.createdAt
                    ? formatDistanceToNow(requestData.createdAt.toDate(), { addSuffix: true })
                    : "Unknown date",
              };
            }
          }
        }

        setRequestDetails(requestDetailsData);

        // Get client names for each proposal
        const clientIds = proposalsData.map(proposal => proposal.clientId).filter(Boolean);
        const uniqueClientIds = [...new Set(clientIds)];
        const clientNamesData = {};

        for (const clientId of uniqueClientIds) {
          // Get client's profile info
          const profileRef = collection(db, "users", clientId, "profile");
          const profileSnap = await getDocs(profileRef);
          let clientName = "Client";

          if (!profileSnap.empty) {
            clientName = profileSnap.docs[0].data().name || "Client";
          }

          clientNamesData[clientId] = clientName;
        }

        setClientNames(clientNamesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [user.uid]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter proposals based on status
  const filteredProposals =
    activeFilter === "all"
      ? proposals
      : proposals.filter((proposal) => proposal.status === activeFilter);

  // Handle marking proposal as completed
  const handleMarkAsCompleted = async (proposalId) => {
    if (!proposalId) return;

    setUpdateLoading(true);
    setError(null);

    try {
      const proposalRef = doc(db, "designProposals", proposalId);
      const proposalSnap = await getDoc(proposalRef);
      
      if (!proposalSnap.exists()) {
        throw new Error("Proposal not found");
      }
      
      const proposalData = proposalSnap.data();
      
      // Get the HTML content from localStorage
      const designState = localStorage.getItem('homeDesign');
      if (!designState) {
        throw new Error("No design data found");
      }

      // Create HTML content
      const sceneData = JSON.parse(designState);
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Interior Design Scene</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <style>
        body { margin: 0; }
        canvas { width: 100%; height: 100vh; }
        #loading { 
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #333;
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #error-message {
            color: #ff4444;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div id="loading">Loading 3D Models...<div id="error-message"></div></div>
    <script>
        const sceneData = ${JSON.stringify(sceneData, null, 2)};

        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);

        // Set up camera
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(20, 20, 20);
        camera.lookAt(0, 0, 0);

        // Set up renderer with shadows
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // Add OrbitControls with better defaults
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2;

        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 15, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);

        // Add Grid Helper with better visibility
        const size = 30;
        const divisions = 30;
        const gridHelper = new THREE.GridHelper(size, divisions, 0x888888, 0xcccccc);
        gridHelper.material.opacity = 0.5;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Update loading status function
        const updateLoadingStatus = (message, isError = false) => {
            const loadingElement = document.getElementById('loading');
            const errorElement = document.getElementById('error-message');
            if (loadingElement) {
                if (isError) {
                    errorElement.textContent = message;
                } else {
                    loadingElement.firstChild.textContent = message;
                    errorElement.textContent = '';
                }
            }
        };

        // Load and render scene data
        async function loadScene() {
            const loader = new THREE.GLTFLoader();
            loader.crossOrigin = 'anonymous';

            const modelPaths = {
                'sofa': 'https://raw.githubusercontent.com/DdooMI/models/main/sofa.glb',
                'chair': 'https://raw.githubusercontent.com/DdooMI/models/main/chair.glb',
                'bed': 'https://raw.githubusercontent.com/DdooMI/models/main/bed.glb',
                'ikea_idanas_single_bed': 'https://raw.githubusercontent.com/DdooMI/models/main/ikea_idanas_single_bed.glb',
                'furniture': 'https://raw.githubusercontent.com/DdooMI/models/main/chair.glb'
            };
            
            let loadedModels = 0;
            const totalModels = sceneData.objects.length;
            
            updateLoadingStatus('Initializing scene and loading models...');

            // Load walls with enhanced materials
            sceneData.walls.forEach(wall => {
                const length = Math.sqrt(
                    Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.z - wall.start.z, 2)
                );
                const angle = Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x);
                
                const geometry = new THREE.BoxGeometry(length, 3, 0.2);
                const material = new THREE.MeshStandardMaterial({
                    color: wall.color || 0xcccccc,
                    roughness: 0.8,
                    metalness: 0.2,
                    envMapIntensity: 1
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                mesh.position.set(
                    (wall.start.x + wall.end.x) / 2,
                    1.5,
                    (wall.start.z + wall.end.z) / 2
                );
                mesh.rotation.y = angle;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
            });

            // Load floors with enhanced materials
            sceneData.floors.forEach(floor => {
                const geometry = new THREE.PlaneGeometry(floor.size, floor.length || floor.size);
                const material = new THREE.MeshStandardMaterial({
                    color: floor.color || 0xeeeeee,
                    side: THREE.DoubleSide,
                    roughness: 0.8,
                    metalness: 0.2,
                    envMapIntensity: 1
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                mesh.position.set(floor.position.x, 0.01, floor.position.z);
                mesh.rotation.x = -Math.PI / 2;
                mesh.receiveShadow = true;
                scene.add(mesh);
            });

            // Load 3D models for furniture with enhanced error handling
            for (const obj of sceneData.objects) {
                try {
                    if (!modelPaths[obj.type]) {
                        console.warn('Unknown model type: ' + obj.type + '. Using chair as fallback.');
                        updateLoadingStatus('Unknown model type: ' + obj.type + '. Using chair as fallback.', false);
                    }
                    
                    const modelPath = modelPaths[obj.type] || modelPaths['chair'];
                    updateLoadingStatus('Loading model ' + (loadedModels + 1) + '/' + totalModels + ': ' + obj.type);
                    
                    const gltf = await loader.loadAsync(modelPath);
                    const model = gltf.scene;
                    loadedModels++;
                    updateLoadingStatus('Successfully loaded ' + loadedModels + '/' + totalModels + ' models');

                    model.position.set(obj.position.x, obj.position.y || 0, obj.position.z);
                    if (obj.rotation) {
                        model.rotation.set(0, obj.rotation, 0);
                    }
                    if (obj.scale) {
                        const scale = typeof obj.scale === 'number' ? obj.scale : 1;
                        model.scale.set(scale, scale, scale);
                    }

                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (obj.color) {
                                child.material.color.setHex(obj.color.replace('#', '0x'));
                            }
                            child.material.roughness = 0.7;
                            child.material.metalness = 0.3;
                            child.material.envMapIntensity = 1;
                        }
                    });

                    scene.add(model);
                } catch (error) {
                    console.error('Error loading model ' + obj.type + ':', error);
                    updateLoadingStatus('Error loading model ' + obj.type + '. Please check the model path and try again.', true);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (loadedModels > 0) {
                document.getElementById('loading').style.display = 'none';
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        loadScene().then(() => {
            animate();
        }).catch(error => {
            console.error('Scene initialization error:', error);
            updateLoadingStatus('Failed to initialize scene. Please refresh the page.', true);
        });

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        }

        window.addEventListener('resize', onWindowResize, false);
    </script>
</body>
</html>`;

      // Update proposal with completed status and HTML content
      await updateDoc(proposalRef, {
        status: "completed",
        htmlContent: htmlContent
      });

      // Update the request status to completed
      if (proposalData.requestId) {
        const requestRef = doc(db, "designRequests", proposalData.requestId);
        await updateDoc(requestRef, {
          status: "completed"
        });
      }

      // Create notification for client
      if (proposalData.clientId) {
        await createNotification({
          userId: proposalData.clientId,
          title: "Proposal Completed",
          message: `The designer has marked their proposal as completed. Please review the final design.`,
          type: "success",
          relatedId: proposalId,
        });
      }

      // Update local state
      setProposals((prevProposals) =>
        prevProposals.map((p) =>
          p.id === proposalId ? { ...p, status: "completed" } : p
        )
      );

      if (selectedProposal?.id === proposalId) {
        setSelectedProposal((prev) => ({ ...prev, status: "completed" }));
      }

      // Update request details local state
      if (proposalData.requestId && requestDetails[proposalData.requestId]) {
        setRequestDetails(prev => ({
          ...prev,
          [proposalData.requestId]: {
            ...prev[proposalData.requestId],
            status: "completed"
          }
        }));
      }

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 pt-30 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-gray-900 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          My Proposals
        </motion.h1>

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Track the status of your design proposals submitted to clients
          </p>

          <div className="flex space-x-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "all"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "pending"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("pending")}
            >
              Pending
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "accepted"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("accepted")}
            >
              Accepted
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "rejected"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("rejected")}
            >
              Rejected
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full transition ${activeFilter === "completed"
                  ? "bg-[#C19A6B] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setActiveFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline">
              {" "}
              Proposal status updated successfully.
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C19A6B]"></div>
          </div>
        ) : filteredProposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow rounded-lg p-6 text-center"
          >
            {proposals.length === 0 ? (
              <p className="text-lg text-gray-700">
                You haven&apos;t submitted any design proposals yet.
              </p>
            ) : (
              <p className="text-lg text-gray-700">
                No proposals found with the selected filter.
              </p>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Proposals List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white shadow rounded-lg p-6 overflow-hidden"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Proposals {activeFilter !== "all" && `(${activeFilter})`}
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 p-2">
                {filteredProposals.map((proposal) => (
                  <motion.div
                    key={proposal.id}
                    whileHover={{ scale: 1.02 }}
                    className={`border rounded-lg p-4 cursor-pointer transition hover:border-[#C19A6B] ${selectedProposal?.id === proposal.id
                        ? "border-[#C19A6B] bg-[#C19A6B]/5"
                        : "border-gray-200"
                      }`}
                    onClick={() => setSelectedProposal(proposal)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900">
                        {requestDetails[proposal.requestId]?.title ||
                          "Unknown Request"}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          proposal.status
                        )}`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {proposal.description}
                    </p>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>Price: ${proposal.price}</span>
                      <span>Time: {proposal.estimatedTime} days</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Submitted: {proposal.createdAt}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Proposal Details */}
            {selectedProposal ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow rounded-lg p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Proposal Details
                </h2>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">
                      {requestDetails[selectedProposal.requestId]?.title ||
                        "Unknown Request"}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                        selectedProposal.status
                      )}`}
                    >
                      {selectedProposal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedProposal.description}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Your Price:</span> $
                      {selectedProposal.price}
                    </div>
                    <div>
                      <span className="text-gray-500">Estimated Time:</span>{" "}
                      {selectedProposal.estimatedTime} days
                    </div>
                    <div>
                      <span className="text-gray-500">Client:</span>{" "}
                      {clientNames[selectedProposal.clientId] || "Unknown Client"}
                    </div>
                    <div>
                      <span className="text-gray-500">Submitted:</span>{" "}
                      {selectedProposal.createdAt}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Request Information
                </h3>
                {requestDetails[selectedProposal.requestId] ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      {requestDetails[selectedProposal.requestId].description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Budget:</span> $
                        {requestDetails[selectedProposal.requestId].budget}
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>{" "}
                        {requestDetails[selectedProposal.requestId].duration} days
                      </div>
                      <div>
                        <span className="text-gray-500">Room Type:</span>{" "}
                        {requestDetails[selectedProposal.requestId].roomType}
                      </div>
                      <div>
                        <span className="text-gray-500">Posted:</span>{" "}
                        {requestDetails[selectedProposal.requestId].createdAt}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Request details not available</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  {selectedProposal.status === "accepted" && (
                    <>
                      <button
                        className="px-3 py-1.5 border border-[#C19A6B] text-[#C19A6B] rounded hover:bg-[#C19A6B]/10 transition"
                        onClick={() => window.location.href = `/project/${selectedProposal.id}`}
                      >
                        View Project Page
                      </button>
                      <button
                        className="px-3 py-1.5 bg-[#C19A6B] text-white rounded hover:bg-[#A0784A] transition"
                        onClick={() => handleMarkAsCompleted(selectedProposal.id)}
                        disabled={updateLoading}
                      >
                        {updateLoading ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Updating...
                          </span>
                        ) : (
                          "Mark as Completed"
                        )}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow rounded-lg p-6 flex items-center justify-center"
              >
                <p className="text-gray-500 text-center">
                  Select a proposal from the list to view details
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignerProposalsPage;
