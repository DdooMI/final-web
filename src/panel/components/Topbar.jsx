import { saveAs } from 'file-saver'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../zustand/auth'
import { useScene } from '../context/SceneContext'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/firebaseConfig'

export default function Topbar() {
  const { state, dispatch } = useScene()
  const { user, role } = useAuth()
  const [proposalId, setProposalId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Extract proposal ID from URL if available
  useEffect(() => {
    // Check if we're in a project context (from a specific request/proposal)
    const params = new URLSearchParams(location.search)
    const id = params.get('proposalId')
    if (id) {
      setProposalId(id)
    }
  }, [location])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // Save the current state to localStorage
    const saveStateToLocalStorage = () => {
      const stateToSave = {
        objects: state.objects.map(obj => ({
          ...obj,
          type: obj.modelPath?.split('/')?.pop()?.split('.')[0] || 'chair' // Ensure type is preserved
        })),
        walls: state.walls,
        floors: state.floors,
        houseDimensions: state.houseDimensions
      }
      localStorage.setItem('homeDesign', JSON.stringify(stateToSave))
      console.log('State saved to localStorage')
    }

    // Save state when component mounts and when state changes
    saveStateToLocalStorage()

    // Add event listener for beforeunload to save state when page refreshes
    window.addEventListener('beforeunload', saveStateToLocalStorage)

    // Clean up event listener
    return () => {
      window.removeEventListener('beforeunload', saveStateToLocalStorage)
    }
  }, [state.objects, state.walls, state.floors, state.houseDimensions])

  const handleUndo = () => {
    dispatch({ type: 'UNDO' })
  }

  const handleRedo = () => {
    dispatch({ type: 'REDO' })
  }

  // Add new function to handle scene clearing
  const handleClearScene = () => {
    if (window.confirm('Are you sure you want to clear everything in the scene? This action cannot be undone.')) {
      dispatch({ type: 'CLEAR_HOUSE_DIMENSIONS' })
      toast.success('Scene cleared successfully')
    }
  }

  // Function to save design to Firebase
  const saveDesignToFirebase = async () => {
    if (!user || !proposalId) {
      toast.error('Unable to save to project. Missing user or project information.');
      return false;
    }

    setIsSaving(true);
    try {
      // Prepare the design data
      const designData = {
        objects: state.objects.map(obj => ({
          ...obj,
          type: obj.modelPath?.split('/')?.pop()?.split('.')[0] || 'chair' // Ensure type is preserved
        })),
        walls: state.walls,
        floors: state.floors,
        houseDimensions: state.houseDimensions,
        lastUpdated: new Date(),
        updatedBy: user.uid
      };

      // Get the proposal document reference
      const proposalRef = doc(db, 'designProposals', proposalId);
      
      // Check if the proposal exists and user has permission
      const proposalSnap = await getDoc(proposalRef);
      if (!proposalSnap.exists()) {
        toast.error('Project not found');
        return false;
      }
      
      const proposalData = proposalSnap.data();
      // Verify user has permission (either client or designer of this proposal)
      if (proposalData.clientId !== user.uid && proposalData.designerId !== user.uid) {
        toast.error('You do not have permission to save this design');
        return false;
      }
      
      // Update the proposal with the design data
      await updateDoc(proposalRef, {
        designData: designData,
        lastModified: new Date()
      });
      
      toast.success('Design saved successfully to project');
      return true;
    } catch (error) {
      console.error('Error saving design to Firebase:', error);
      toast.error('Failed to save design to project');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving design (to both Firebase and as HTML file)
  const handleSaveDesign = async () => {
    // First save to Firebase if we have a proposal ID
    if (proposalId) {
      await saveDesignToFirebase();
    }
    
    try {
      // Create HTML content with Three.js scene
      const sceneData = {
        objects: state.objects.map(obj => ({
          ...obj,
          type: obj.modelPath?.split('/')?.pop()?.split('.')[0] || 'chair' // Ensure type is preserved
        })),
        walls: state.walls,
        floors: state.floors,
        houseDimensions: state.houseDimensions
      };
      
      // Stringify the sceneData object before inserting it into the template
      const sceneDataJSON = JSON.stringify(sceneData, null, 2);

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
        const sceneData = ${sceneDataJSON};

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
                'furniture': 'https://raw.githubusercontent.com/DdooMI/models/main/chair.glb' // Using chair as a fallback for generic furniture
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
                    // Check if the model type exists in our paths
                    if (!modelPaths[obj.type]) {
                        console.warn('Unknown model type: ' + obj.type + '. Using chair as fallback.');
                        updateLoadingStatus('Unknown model type: ' + obj.type + '. Using chair as fallback.', false);
                    }
                    
                    // Use the specific model if available, otherwise fallback to chair
                    const modelPath = modelPaths[obj.type] || modelPaths['chair'];
                    updateLoadingStatus('Loading model ' + (loadedModels + 1) + '/' + totalModels + ': ' + obj.type);
                    
                    const gltf = await loader.loadAsync(modelPath);
                    const model = gltf.scene;
                    loadedModels++;
                    updateLoadingStatus('Successfully loaded ' + loadedModels + '/' + totalModels + ' models');

                    // Apply transformations
                    model.position.set(obj.position.x, obj.position.y || 0, obj.position.z);
                    if (obj.rotation) {
                        model.rotation.set(0, obj.rotation, 0);
                    }
                    if (obj.scale) {
                        const scale = typeof obj.scale === 'number' ? obj.scale : 1;
                        model.scale.set(scale, scale, scale);
                    }

                    // Apply material color and enhanced materials
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

            // Hide loading message only if at least one model was loaded successfully
            if (loadedModels > 0) {
                document.getElementById('loading').style.display = 'none';
            }
        }

        // Enhanced animation loop with stats
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        // Initialize scene with error handling
        loadScene().then(() => {
            animate();
        }).catch(error => {
            console.error('Scene initialization error:', error);
            updateLoadingStatus('Failed to initialize scene. Please refresh the page.', true);
        });

        // Enhanced window resize handling
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

      // Create and save the file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      saveAs(blob, 'interior-design-scene.html');
      toast.success('Design saved successfully as HTML file');
    } catch (error) {
      console.error('Error saving design:', error);
      toast.error('Failed to save design');
    }
  }

  // Load design data from Firebase when proposal ID changes
  useEffect(() => {
    const loadDesignFromFirebase = async () => {
      if (!user || !proposalId) return;
      
      try {
        // Get the proposal document
        const proposalRef = doc(db, 'designProposals', proposalId);
        const proposalSnap = await getDoc(proposalRef);
        
        if (!proposalSnap.exists()) {
          console.error('Project not found');
          return;
        }
        
        const proposalData = proposalSnap.data();
        
        // Check if there's design data to load
        if (proposalData.designData) {
          // Load the design data into the scene
          dispatch({ 
            type: 'IMPORT_DESIGN', 
            payload: proposalData.designData 
          });
          toast.success('Project design loaded successfully');
          
          // Also save to localStorage for backup
          localStorage.setItem('homeDesign', JSON.stringify(proposalData.designData));
        }
      } catch (error) {
        console.error('Error loading design from Firebase:', error);
        toast.error('Failed to load project design');
      }
    };
    
    loadDesignFromFirebase();
  }, [proposalId, user, dispatch]);
  
  // Function to save current state to Firebase whenever it changes
  useEffect(() => {
    // Only save to Firebase if we have a user and proposalId
    if (user && proposalId && state.objects.length > 0) {
      const saveStateToFirebase = async () => {
        try {
          // Prepare the design data
          const designData = {
            objects: state.objects.map(obj => ({
              ...obj,
              type: obj.modelPath?.split('/')?.pop()?.split('.')[0] || 'chair' // Ensure type is preserved
            })),
            walls: state.walls,
            floors: state.floors,
            houseDimensions: state.houseDimensions,
            lastUpdated: new Date(),
            updatedBy: user.uid
          };
          
          // Get the proposal document reference
          const proposalRef = doc(db, 'designProposals', proposalId);
          
          // Update the proposal with the design data
          await updateDoc(proposalRef, {
            designData: designData,
            lastModified: new Date()
          });
          
          console.log('Design state automatically saved to Firebase');
        } catch (error) {
          console.error('Error auto-saving design to Firebase:', error);
        }
      };
      
      // Debounce the save operation to avoid too many writes
      const timeoutId = setTimeout(saveStateToFirebase, 5000); // Save after 5 seconds of inactivity
      
      return () => clearTimeout(timeoutId); // Clean up timeout
    }
  }, [state.objects, state.walls, state.floors, state.houseDimensions, user, proposalId]);

  // Determine dashboard link based on user role and project ID
  const dashboardLink = proposalId ? `/project/${proposalId}` : (role === 'designer' ? '/designer-requests' : '/client-requests');

  return (
    <div className="absolute top-4 left-0 right-0 mx-auto max-w-5xl bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg flex justify-between transition-all duration-300 ease-in-out hover:bg-white hover:shadow-xl">
      <Link 
        to={dashboardLink}
        className="px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] flex items-center gap-2 transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </Link>
      
      <div className="flex gap-4">
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md"
          onClick={handleClearScene}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear Scene
        </button>
        <button 
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 active:scale-95 hover:shadow-md"
          onClick={handleUndo}
          disabled={state.currentStep < 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Undo
        </button>
        <button 
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 active:scale-95 hover:shadow-md"
          onClick={handleRedo}
          disabled={state.currentStep >= state.history.length - 1}
        >
          Redo
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          className="px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] flex items-center gap-2 transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleSaveDesign}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Save Design
            </>
          )}
        </button>
      </div>
    </div>
  )
}
