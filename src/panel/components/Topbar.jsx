import { useScene } from '../context/SceneContext'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../zustand/auth'
import { saveAs } from 'file-saver'
import { toast } from 'react-hot-toast'

export default function TopBar() {
  const { state, dispatch } = useScene()
  const { role } = useAuth()

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // Save the current state to localStorage
    const saveStateToLocalStorage = () => {
      const stateToSave = {
        objects: state.objects,
        walls: state.walls,
        floors: state.floors,
        
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
  }, [state.objects, state.walls, state.floors, ])

  const handleUndo = () => {
    dispatch({ type: 'UNDO' })
  }

  const handleRedo = () => {
    dispatch({ type: 'REDO' })
  }

  const handleSaveDesign = () => {
    try {
      // Create HTML content with Three.js scene
      const sceneData = {
        objects: state.objects,
        walls: state.walls,
        floors: state.floors
      }

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
        }
    </style>
</head>
<body>
    <div id="loading">Loading 3D Models...</div>
    <script>
        const sceneData = ${JSON.stringify(sceneData)};

        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        // Set up camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(15, 15, 15);
        camera.lookAt(0, 0, 0);

        // Set up renderer with shadows
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        // Add OrbitControls
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Add Grid Helper
        const size = 20;
        const divisions = 20;
        const gridHelper = new THREE.GridHelper(size, divisions, 0x808080, 0xcccccc);
        scene.add(gridHelper);

        // Load and render scene data
        async function loadScene() {
            const loader = new THREE.GLTFLoader();
            const modelPaths = {
                'sofa': 'src/models/sofa.glb',
                'chair': 'src/models/chair.glb',
                'bed': 'src/models/bed.glb'
            };

            // Load walls
            sceneData.walls.forEach(wall => {
                const length = Math.sqrt(
                    Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.z - wall.start.z, 2)
                );
                const angle = Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x);
                
                const geometry = new THREE.BoxGeometry(length, 3, 0.2);
                const material = new THREE.MeshStandardMaterial({
                    color: wall.color || 0x808080,
                    roughness: 0.7,
                    metalness: 0.1
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

            // Load floors
            sceneData.floors.forEach(floor => {
                const geometry = new THREE.PlaneGeometry(floor.size, floor.length || floor.size);
                const material = new THREE.MeshStandardMaterial({
                    color: floor.color || 0x808080,
                    side: THREE.DoubleSide,
                    roughness: 0.8,
                    metalness: 0.1
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                mesh.position.set(floor.position.x, 0.01, floor.position.z);
                mesh.rotation.x = -Math.PI / 2;
                mesh.receiveShadow = true;
                scene.add(mesh);
            });

            // Load 3D models for furniture
            for (const obj of sceneData.objects) {
                try {
                    const modelPath = modelPaths[obj.type] || modelPaths['chair'];
                    const gltf = await loader.loadAsync(modelPath);
                    const model = gltf.scene;

                    // Apply position, rotation, and scale
                    model.position.set(obj.position.x, obj.position.y || 0, obj.position.z);
                    if (obj.rotation) {
                        model.rotation.set(0, obj.rotation, 0);
                    }
                    if (obj.scale) {
                        model.scale.set(obj.scale, obj.scale, obj.scale);
                    }

                    // Apply material color if specified
                    if (obj.color) {
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.material.color.setHex(obj.color.replace('#', '0x'));
                            }
                        });
                    }

                    model.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });

                    scene.add(model);
                } catch (error) {
                    console.error('Error loading model for object:', error);
                }
            }

            // Hide loading message
            document.getElementById('loading').style.display = 'none';
        }

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        loadScene().then(() => {
            animate();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
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

  // Determine dashboard link based on user role
  const dashboardLink = role === 'designer' ? '/designer-requests' : '/client-requests';

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
          className="px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] flex items-center gap-2 transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md"
          onClick={handleSaveDesign}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Save Design
        </button>
      </div>
    </div>
  )
}
