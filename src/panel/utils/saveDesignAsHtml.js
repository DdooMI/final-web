/**
 * Utility function to save the current 3D scene as a standalone HTML file
 * This creates a self-contained HTML file with all necessary Three.js libraries
 * and the current scene data embedded.
 */

import { saveAs } from 'file-saver';
import * as THREE from 'three';

/**
 * Generates a standalone HTML file containing the current 3D scene
 * @param {Object} sceneData - The scene data containing objects, walls, floors, etc.
 * @param {String} fileName - The name to use for the downloaded file
 */
export const saveDesignAsHtml = (sceneData, fileName = 'interior-design') => {
  // Sanitize the filename
  const sanitizedFileName = fileName.replace(/[<>:"/\\|?*]/g, "_");
  
  // Create the HTML template with embedded Three.js
  const htmlContent = generateHtmlTemplate(sceneData);
  
  // Create a blob from the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  // Save the file using file-saver
  saveAs(blob, `${sanitizedFileName}.html`);
};

/**
 * Generates the HTML template with embedded Three.js and scene data
 * @param {Object} sceneData - The scene data to embed
 * @returns {String} The complete HTML document as a string
 */
const generateHtmlTemplate = (sceneData) => {
  // Convert scene data to a JSON string to embed in the HTML
  const sceneDataJson = JSON.stringify(sceneData);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Interior Design Viewer</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
    #info {
      position: absolute;
      top: 10px;
      width: 100%;
      text-align: center;
      color: white;
      font-family: Arial, sans-serif;
      pointer-events: none;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
    }
    #controls {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0,0,0,0.5);
      padding: 10px;
      border-radius: 5px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="info">3D Interior Design Viewer</div>
  <div id="controls">
    Controls: Left-click + drag to rotate | Right-click + drag to pan | Scroll to zoom
  </div>
  
  <!-- Import Three.js from CDN -->
  <script async src="https://unpkg.com/es-module-shims@1.6.3/dist/es-module-shims.js"></script>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.151.3/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.151.3/examples/jsm/"
      }
    }
  </script>
  
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    
    // Embedded scene data
    const sceneData = ${sceneDataJson};
    
    // Initialize the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Add a grid helper
    const gridSize = Math.max(sceneData.houseDimensions?.width || 20, sceneData.houseDimensions?.length || 20);
    const gridHelper = new THREE.GridHelper(gridSize, gridSize * 2, 0x888888, 0x444444);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    
    // Create a loader for GLTF models
    const loader = new GLTFLoader();
    const modelCache = {};
    
    // Function to create a wall
    function createWall(start, end, height = 3, width = 0.2, color = "#808080") {
      const length = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
      );
      const angle = Math.atan2(end.z - start.z, end.x - start.x);
      
      const geometry = new THREE.BoxGeometry(length, height, width);
      const material = new THREE.MeshStandardMaterial({ color });
      const wall = new THREE.Mesh(geometry, material);
      
      wall.position.set(
        (start.x + end.x) / 2,
        height / 2,
        (start.z + end.z) / 2
      );
      wall.rotation.y = angle;
      wall.castShadow = true;
      wall.receiveShadow = true;
      
      return wall;
    }
    
    // Function to create a floor
    function createFloor(position, size, length, color = "#808080") {
      const floorWidth = size;
      const floorLength = length || size;
      
      const geometry = new THREE.PlaneGeometry(floorWidth, floorLength);
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const floor = new THREE.Mesh(geometry, material);
      
      floor.position.set(position.x, 0.01, position.z);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      
      return floor;
    }
    
    // Function to load and place furniture
    function loadFurniture(modelPath, position, rotation = [0, 0, 0], scale = 1, color) {
      // Check if model is already cached
      if (!modelCache[modelPath]) {
        // If not in cache, create a placeholder and load the model
        const placeholder = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true })
        );
        placeholder.position.set(position.x, position.y || 0, position.z);
        scene.add(placeholder);
        
        // Load the actual model
        loader.load(
          // Convert relative path to absolute URL for the CDN
          `https://raw.githubusercontent.com/your-username/your-repo/main/${modelPath}`,
          (gltf) => {
            // Remove placeholder
            scene.remove(placeholder);
            
            // Add the loaded model
            const model = gltf.scene;
            model.position.set(position.x, position.y || 0, position.z);
            model.rotation.set(...rotation);
            
            // Apply scale
            if (typeof scale === 'number') {
              model.scale.set(scale, scale, scale);
            } else if (Array.isArray(scale)) {
              model.scale.set(...scale);
            }
            
            // Apply material properties
            model.traverse((node) => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                // Apply color if provided
                if (color) {
                  node.material = node.material.clone();
                  node.material.color.set(color);
                }
              }
            });
            
            scene.add(model);
            modelCache[modelPath] = model;
          },
          undefined,
          (error) => {
            console.error('Error loading model:', error);
          }
        );
      } else {
        // If model is cached, clone it
        const model = modelCache[modelPath].clone();
        model.position.set(position.x, position.y || 0, position.z);
        model.rotation.set(...rotation);
        
        // Apply scale
        if (typeof scale === 'number') {
          model.scale.set(scale, scale, scale);
        } else if (Array.isArray(scale)) {
          model.scale.set(...scale);
        }
        
        // Apply material properties
        if (color) {
          model.traverse((node) => {
            if (node.isMesh) {
              node.material = node.material.clone();
              node.material.color.set(color);
            }
          });
        }
        
        scene.add(model);
      }
    }
    
    // Add walls from scene data
    if (sceneData.walls && sceneData.walls.length > 0) {
      sceneData.walls.forEach(wall => {
        const wallMesh = createWall(
          wall.start,
          wall.end,
          3, // height
          0.2, // width
          wall.color || "#808080"
        );
        scene.add(wallMesh);
      });
    }
    
    // Add floors from scene data
    if (sceneData.floors && sceneData.floors.length > 0) {
      sceneData.floors.forEach(floor => {
        const floorMesh = createFloor(
          floor.position,
          floor.size,
          floor.length,
          floor.color || "#808080"
        );
        scene.add(floorMesh);
      });
    }
    
    // Add furniture objects from scene data
    if (sceneData.objects && sceneData.objects.length > 0) {
      sceneData.objects.forEach(obj => {
        if (obj.modelPath) {
          loadFurniture(
            obj.modelPath,
            obj.position,
            obj.rotation || [0, 0, 0],
            obj.scale || 1,
            obj.color
          );
        }
      });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    
    animate();
  </script>
</body>
</html>`;
};