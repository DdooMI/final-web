/* eslint-disable react/no-unknown-property */
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";

import CameraSetup from "../panel/components/CameraSetup";
import Compass, { Compass3D } from "../panel/components/Compass";
import ExportDesign from "../panel/components/ExportDesign";
import GridSystem from "../panel/components/GridSystem";
import LeftSidebar from "../panel/components/LeftSidebar";
import RightSidebar from "../panel/components/RightSidebar";
import Scene from "../panel/components/Scene";
import TopBar from "../panel/components/Topbar";
import ClientApproval from "../panel/components/ClientApproval";
import { SceneProvider, useScene } from "../panel/context/SceneContext";

function ProjectsPage() {
  return (
    <SceneProvider>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="shadow-lg rounded-lg p-4 bg-white">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Design Studio</h1>
              <AppContent />
            </div>
          </div>
        </div>
      </div>
    </SceneProvider>
  );
}

// This component is inside the SceneProvider, so it can use useScene
function AppContent() {
  const { state, dispatch } = useScene();
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [canvasError, setCanvasError] = useState(null);

  // Initialize event listeners and Canvas when component mounts
  useEffect(() => {
    // Force a re-render when the window is resized
    const handleResize = () => {
      dispatch({ type: "WINDOW_RESIZED" });
    };

    // Initialize Canvas
    const initCanvas = async () => {
      try {
        // Check if Three.js is loaded
        if (typeof THREE === "undefined") {
          throw new Error("Three.js not loaded");
        }

        // Initialize Three.js resources
        await Promise.all([
          // Load any required textures or resources here
        ]);

        setIsCanvasReady(true);
        setCanvasError(null);
      } catch (error) {
        console.error("Canvas initialization error:", error);
        setCanvasError(error.message);
        // Retry initialization after a delay
        setTimeout(initCanvas, 1000);
      }
    };

    // Start Canvas initialization
    initCanvas();

    // Add event listeners
    window.addEventListener("resize", handleResize);

    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  return (
    <div className="h-[calc(100vh-200px)] w-full relative bg-gray-100 overflow-hidden rounded-lg shadow-lg">
      {/* Full-page canvas */}
      <div className="absolute inset-0 w-full h-full">
        {canvasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white">
            <p>خطأ في تحميل المشهد: {canvasError}</p>
          </div>
        )}
        <Canvas
          camera={{ position: [0, 5, -10], fov: 75 }}
          onCreated={() => setIsCanvasReady(true)}
          onError={(error) => {
            console.error("Canvas error:", error);
            setCanvasError(error.message);
          }}
        >
          <CameraSetup />
          <OrbitControls
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={1}
            enabled={state.isRotationEnabled}
          />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <GridSystem />
          <Scene />
          <Compass3D />
        </Canvas>
      </div>

      {/* UI elements positioned above the canvas */}
      <TopBar />
      <LeftSidebar />
      <RightSidebar />
      <Compass />
      <ExportDesign />
      {/* Client Approval UI positioned outside Canvas */}
      <ClientApproval />
    </div>
  );
}

export default ProjectsPage;
