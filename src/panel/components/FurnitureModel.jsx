import { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useGLTF } from "@react-three/drei";

const FURNITURE_MODELS = {
  "chair.glb": { name: "Chair" },
  "sofa.glb": { name: "Sofa" },
  "ikea_idanas_single_bed.glb": { name: "IKEA Bed" },
};

function ModelLoader({
  modelPath,
  position,
  opacity = 1,
  color = "#ffffff",
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const modelRef = useRef();
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const maxRetries = 3;
  const retryDelay = 1500; // Increased delay between retries

  // Preload model with enhanced error handling
  const { scene } = useGLTF(modelPath, undefined, (error) => {
    console.error(`Error loading model (attempt ${retryCount + 1}):`, error);
    setLoadError(error);

    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      // Exponential backoff for retries
      setTimeout(() => {
        setLoadError(null);
        setIsLoading(true);
      }, retryDelay * Math.pow(2, retryCount));
    } else {
      console.error("Failed to load model after maximum retries:", modelPath);
    }
  });

  useEffect(() => {
    if (scene) {
      setIsLoading(false);
      setLoadError(null);
    }
  }, [scene]);

  // Clone the scene to avoid modifying the cached original
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (!modelRef.current) return;

    const obj = modelRef.current;
    obj.position.set(position.x, position.y || 0, position.z);
    obj.rotation.set(...rotation);

    // Apply scale - ensure it's applied correctly
    if (typeof scale === "number") {
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

  // Show error state if loading failed after all retries
  if (loadError && retryCount >= maxRetries) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" opacity={0.5} transparent />
        <Html position={[0, 1.5, 0]}>
          <div
            style={{
              color: "red",
              backgroundColor: "white",
              padding: "5px",
              borderRadius: "3px",
            }}
          >
            Failed to load model
          </div>
        </Html>
      </mesh>
    );
  }

  // Show loading state
  if (isLoading && !loadError) {
    return (
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#4a90e2" wireframe />
      </mesh>
    );
  }

  return (
    <Suspense fallback={null}>
      <primitive ref={modelRef} object={clonedScene} />
    </Suspense>
  );
}

// Export the wrapped component with error boundary
export default function FurnitureModel(props) {
  return (
    <Suspense fallback={null}>
      <ModelLoader {...props} />
    </Suspense>
  );
}
