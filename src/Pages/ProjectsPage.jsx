import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useLocation } from 'react-router-dom'

import CameraSetup from '../panel/components/CameraSetup'
import Compass, { Compass3D } from '../panel/components/Compass'
import LeftSidebar from '../panel/components/LeftSidebar'
import RightSidebar from '../panel/components/RightSidebar'
import Scene from '../panel/components/Scene'
import TopBar from '../panel/components/Topbar'
import { SceneProvider, useScene } from '../panel/context/SceneContext'

function ProjectPage() {
  const location = useLocation()
  
  // Extract proposalId from URL query parameters if available
  const queryParams = new URLSearchParams(location.search)
  const proposalId = queryParams.get('proposalId')
  
  return (
    <SceneProvider>
      <AppContent proposalId={proposalId} />
    </SceneProvider>
  )
}

// This component is inside the SceneProvider, so it can use useScene
function AppContent({ proposalId }) {
  const { state } = useScene();
  
  return (
    <div className="h-screen w-screen relative bg-gray-100 overflow-hidden">
      {/* Full-page canvas */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas camera={{ position: [0, 5, -10], fov: 75 }}>
          <CameraSetup />
          <OrbitControls 
            minPolarAngle={0.1} 
            maxPolarAngle={Math.PI / 2.05} 
            minDistance={1}
            enabled={state.isRotationEnabled}
          />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Scene />
          <Compass3D />
        </Canvas>
      </div>
      
      {/* UI elements positioned above the canvas */}
      <TopBar />
      <LeftSidebar />
      <RightSidebar />
      <Compass />
    </div>
  )
}

export default ProjectPage