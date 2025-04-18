/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';

// Define all furniture models with their paths
const FURNITURE_MODELS = {
  'https://raw.githubusercontent.com/DdooMI/models/main/chair.glb': { name: 'Chair' },
  'https://raw.githubusercontent.com/DdooMI/models/main/sofa.glb': { name: 'Sofa' },
  'https://raw.githubusercontent.com/DdooMI/models/main/ikea_idanas_single_bed.glb': { name: 'IKEA Bed' },
  'https://raw.githubusercontent.com/DdooMI/models/main/bed.glb': { name: 'Bed' }
};

// Preload all models immediately to prevent freezing during placement
Object.keys(FURNITURE_MODELS).forEach(path => {
  useGLTF.preload(path);
});

export default function FurnitureModel({ modelPath, position, rotation = [0, 0, 0], scale = 1, opacity = 1, color }) {
  const modelRef = useRef();
  // Use cached model from preloaded assets
  const { scene } = useGLTF(modelPath);

  // Clone the scene to avoid modifying the cached original
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (!modelRef.current) return;
    
    const obj = modelRef.current;
    obj.position.set(position.x, position.y || 0, position.z);
    obj.rotation.set(...rotation);
    
    // Apply scale - ensure it's applied correctly
    if (typeof scale === 'number') {
      obj.scale.set(scale, scale, scale);
    } else if (Array.isArray(scale)) {
      obj.scale.set(...scale);
    } else {
      // Default scale if none provided
      obj.scale.set(1, 1, 1);
    }

    // Enable shadows and apply opacity/color to all meshes
    obj.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Apply opacity if provided
        if (opacity !== 1) {
          node.material = node.material.clone(); // Clone material to avoid affecting other instances
          node.material.transparent = true;
          node.material.opacity = opacity;
          node.material.depthWrite = opacity > 0.5; // Disable depth writing for very transparent objects
        }
        
        // Apply color tint if provided
        if (color) {
          node.material = node.material.clone(); // Clone material to avoid affecting other instances
          node.material.color.set(color);
        }
      }
    });
  }, [position, rotation, scale, opacity, color, clonedScene]);

  return <primitive ref={modelRef} object={clonedScene} />;
}
