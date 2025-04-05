import { useEffect, useMemo, useRef, useState } from 'react'

import { useDroppable } from '@dnd-kit/core'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useScene } from '../context/SceneContext'
import FurnitureModel from './FurnitureModel'


function Wall({ start, end, height = 3, width = 0.2, color = '#808080', opacity = 1 }) {
  const wallRef = useRef()
  const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2))
  const angle = Math.atan2(end.z - start.z, end.x - start.x)

  useEffect(() => {
    if (wallRef.current) {
      wallRef.current.rotation.y = angle
    }
  }, [angle])

  return (
    <mesh
      ref={wallRef}
      position={[(start.x + end.x) / 2, height / 2, (start.z + end.z) / 2]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, height, width]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

function Floor({ position, size, length, color = '#808080' }) {
  const floorWidth = size;
  const floorLength = length || size;
  return (
    <mesh position={[position.x, 0.01, position.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[floorWidth, floorLength]} />
      <meshStandardMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  )
}

function FurniturePreview({ position, modelPath, isValid, rotation, scale }) {
  // Determine furniture type from model path
  const furnitureType = modelPath.includes('chair') ? 'chair' : 
                        modelPath.includes('sofa') ? 'sofa' : 
                        modelPath.includes('ikea_bed') ? 'ikea_bed' : 'bed';
  
  // Create a new position object with proper coordinates
  const adjustedPosition = { 
    x: position.x, 
    y: 0, 
    z: position.z 
  };
  
  // Apply specific position adjustments for each furniture type
  if (furnitureType === 'sofa') {
    // Center the sofa horizontally in its grid cells
    adjustedPosition.x = position.x + 0.5;
  } else if (furnitureType === 'chair') {
    // Center the chair in its grid cell
    adjustedPosition.x = position.x + 0.5;
    adjustedPosition.z = position.z + 0.1;
  }
  
  return (
    <FurnitureModel
      modelPath={modelPath}
      position={adjustedPosition}
      opacity={0.5}
      color={isValid ? '#00ff00' : '#ff0000'}
      rotation={[0, rotation, 0]}
      scale={scale || 1}
    />
  )
}

export default function Scene() {
  const { state, dispatch } = useScene()
  const { setNodeRef } = useDroppable({
    id: 'scene',
    data: {
      accepts: ['shape']
    }
  })
  const planeRef = useRef()
  const [drawingPoints, setDrawingPoints] = useState([])
  const [mousePosition, setMousePosition] = useState({ x: 0, z: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [isCurvedDrawing, setIsCurvedDrawing] = useState(false)
  const [furniturePreview, setFurniturePreview] = useState(null)
  const [previewRotation, setPreviewRotation] = useState(0)

  // Handle keyboard events for furniture rotation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && furniturePreview) {
        event.preventDefault()
        // Rotate 90 degrees clockwise
        setPreviewRotation((prev) => (prev + Math.PI/2) % (Math.PI * 2))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [furniturePreview])

  // Check if house dimensions have been applied
  const houseDimensionsApplied = state.houseDimensions?.isApplied
  
  // Clear scene when house dimensions are first applied
  useEffect(() => {
    if (houseDimensionsApplied) {
      dispatch({
        type: 'SET_HOUSE_DIMENSIONS',
        payload: { ...state.houseDimensions }
      })
    }
  }, [dispatch, houseDimensionsApplied, state.houseDimensions])

  // Initialize furniture preview when furniture is selected
  useEffect(() => {
    if (state.activeShape === 'furniture' && state.selectedFurnitureId) {
      const furnitureCategories = {
        ikea_bed: 'src/models/ikea_idanas_single_bed.glb',
        chair: 'src/models/chair.glb',
        sofa: 'src/models/sofa.glb'
      }
      
      const modelPath = furnitureCategories[state.selectedFurnitureId]
      if (modelPath) {
        // Define specific sizes for each furniture type
        let furnitureSize;
        let furnitureScale;
        
        switch(state.selectedFurnitureId) {
          
          case 'ikea_bed':
            furnitureSize = { width: 1, length: 2 };
            furnitureScale = 1;
            break;
          case 'sofa':
            furnitureSize = { width: 1, length: 2 };
            furnitureScale = 0.025;
            break;
          case 'chair':
          default:
            furnitureSize = { width: 1, length: 1 };
            furnitureScale = 0.4;
            break;
        }
        
        setFurniturePreview({
          modelPath,
          position: { x: 0, z: 0 },
          isValid: true,
          size: furnitureSize,
          scale: furnitureScale
        });
      }
    } else if (!state.activeShape || state.activeShape !== 'furniture') {
      setFurniturePreview(null)
    }
  }, [state.activeShape, state.selectedFurnitureId])

  // Calculate grid dimensions based on house dimensions
  const gridWidth = useMemo(() => {
    if (houseDimensionsApplied) {
      return state.houseDimensions.width
    }
    return 20 // Default grid width
  }, [houseDimensionsApplied, state.houseDimensions?.width])

  const gridLength = useMemo(() => {
    if (houseDimensionsApplied) {
      return state.houseDimensions.length
    }
    return 20 // Default grid length
  }, [houseDimensionsApplied, state.houseDimensions?.length])

  // Calculate max grid size for the gridHelper (used for divisions calculation)
  const gridSize = useMemo(() => {
    return Math.max(gridWidth, gridLength)
  }, [gridWidth, gridLength])

  // Calculate grid divisions based on size to maintain 1m grid cells
  const gridDivisions = useMemo(() => {
    return Math.floor(gridSize)
  }, [gridSize])

  // Calculate the center position of the plane to align with the grid helpers
  const planePosition = useMemo(() => {
    return [0, 0, 0] // The grid is already centered at origin
  }, [])

  const snapToGrid = (point, isFloor = false) => {
    // Calculate grid boundaries based on center position
    const halfWidth = gridWidth / 2
    const halfLength = gridLength / 2
    
    // For floors, snap to grid cell centers
    // For walls, snap to exact grid lines (whole numbers)
    let gridX = isFloor 
      ? Math.floor(point.x) + 0.5 
      : Math.round(point.x)
    let gridZ = isFloor 
      ? Math.floor(point.z) + 0.5
      : Math.round(point.z)
    
    // Ensure the point is strictly within the grid boundaries (centered at origin)
    // Clamp values to ensure they stay within grid boundaries
    if (isFloor) {
      // For floors, keep within the inner grid cells
      gridX = Math.max(-halfWidth + 0.5, Math.min(gridX, halfWidth - 0.5))
      gridZ = Math.max(-halfLength + 0.5, Math.min(gridZ, halfLength - 0.5))
    } else {
      // For walls, allow drawing on the grid boundaries but not outside
      gridX = Math.max(-halfWidth, Math.min(gridX, halfWidth))
      gridZ = Math.max(-halfLength, Math.min(gridZ, halfLength))
    }
    
    // Use the clamped values directly
    const boundedX = gridX
    const boundedZ = gridZ
    
    // Return the point snapped to grid lines or cell centers
    return {
      x: boundedX,
      z: boundedZ
    }
  }

  const handlePointerDown = (event) => {
    // Handle right-click for shape deselection
    if (event.button === 2) {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault()
      }
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation()
      }
      dispatch({ type: 'SET_ACTIVE_SHAPE', payload: null })
      return
    }
    
    if (!state.activeShape) return
    event.stopPropagation()
    
    // For shapes, snap intersection point to grid block lines
    const snappedPoint = snapToGrid(event.point, state.activeShape === 'floor')

    if (state.activeShape === 'furniture' && furniturePreview) {
      const size = furniturePreview.size || { width: 1, length: 1 };
      
      // Check if position is valid before placing
      const isValidPosition = checkFurnitureCollision(snappedPoint, size, previewRotation, state);
      
      if (isValidPosition) {
        // Calculate the actual size based on rotation
        const actualSize = previewRotation % Math.PI === 0 ? size : { width: size.length, length: size.width };
        
        // Create a list of cells to mark as occupied
        const occupiedCells = {};
        
        // Mark all cells as occupied based on the furniture size
        for (let x = 0; x < actualSize.width; x++) {
          for (let z = 0; z < actualSize.length; z++) {
            const cellX = Math.floor(snappedPoint.x + x);
            const cellZ = Math.floor(snappedPoint.z + z);
            occupiedCells[`${cellX},${cellZ}`] = true;
          }
        }
        
        dispatch({
          type: 'PLACE_FURNITURE',
          payload: {
            position: snappedPoint,
            modelPath: furniturePreview.modelPath,
            rotation: previewRotation,
            size: size,
            scale: furniturePreview.scale || 1,
            occupiedCells: occupiedCells
          }
        });
        
        // Reset furniture preview position but keep it active for next placement
        setFurniturePreview({
          ...furniturePreview,
          position: { x: 0, z: 0 },
          isValid: true
        });
      } else {
        console.log("Cannot place furniture here - position is occupied");
      }
    } else if (state.activeShape === 'curved-wall') {
      if (!isCurvedDrawing) {
        setIsCurvedDrawing(true)
        setDrawingPoints([snappedPoint])
      } else {
        setDrawingPoints([...drawingPoints, snappedPoint])
      }
    } else if (state.activeShape === 'wall') {
      setIsDrawing(true)
      setDrawingPoints([snappedPoint])
    } else {
      setIsDrawing(true)
      setDrawingPoints([snappedPoint])
    }
  }

  const snapToVerticalOrHorizontal = (start, end) => {
    // Calculate differences in x and z coordinates
    const dx = Math.abs(end.x - start.x)
    const dz = Math.abs(end.z - start.z)
    
    // Calculate grid boundaries
    const halfWidth = gridWidth / 2
    const halfLength = gridLength / 2
    
    // Determine if the wall should be vertical or horizontal
    if (dx < dz) {
      // Vertical wall (constant x)
      // Ensure z is within grid boundaries
      const boundedZ = Math.max(-halfLength, Math.min(end.z, halfLength))
      return { x: start.x, z: boundedZ }
    } else {
      // Horizontal wall (constant z)
      // Ensure x is within grid boundaries
      const boundedX = Math.max(-halfWidth, Math.min(end.x, halfWidth))
      return { x: boundedX, z: start.z }
    }
  }

  const handlePointerMove = (event) => {
    if (!state.activeShape) return
    event.stopPropagation()
    const snappedPoint = snapToGrid(event.point, state.activeShape === 'floor')

    if (state.activeShape === 'furniture' && furniturePreview) {
      // Get the furniture size
      const size = furniturePreview.size || { width: 1, length: 1 };
      
      // Check if all required grid cells are available
      const isValidPosition = checkFurnitureCollision(snappedPoint, size, previewRotation, state);
      
      setFurniturePreview({
        ...furniturePreview,
        position: snappedPoint,
        isValid: isValidPosition
      });
    } else if (isDrawing && drawingPoints.length > 0) {
      // First snap to grid, then align to vertical/horizontal
      const gridAlignedPoint = snapToGrid(snappedPoint)
      
      // Ensure both the start and end points are within grid boundaries
      const halfWidth = gridWidth / 2
      const halfLength = gridLength / 2
      
      // Ensure start point is within boundaries
      const boundedStart = {
        x: Math.max(-halfWidth, Math.min(drawingPoints[0].x, halfWidth)),
        z: Math.max(-halfLength, Math.min(drawingPoints[0].z, halfLength))
      }
      
      // Get the aligned point (vertical or horizontal wall)
      const alignedPoint = (state.activeShape === 'wall' || state.activeShape === 'line')
        ? snapToVerticalOrHorizontal(boundedStart, gridAlignedPoint)
        : gridAlignedPoint
      setMousePosition(alignedPoint)

      // If we're drawing a wall, show preview
      if (state.activeShape === 'wall' && drawingPoints.length > 0) {
        const previewStart = boundedStart
        const previewEnd = alignedPoint
        return (
          <Wall
            start={previewStart}
            end={previewEnd}
            thickness={0.2}
            width={0.2}
            color={state.activeColor}
            opacity={0.5}
          />
        )
      }
    } else if (isCurvedDrawing) {
      const gridAlignedPoint = snapToGrid(snappedPoint)
      setMousePosition(gridAlignedPoint)
    }
  }

  const handlePointerUp = (event) => {
    if ((!isDrawing && !isCurvedDrawing) || !state.activeShape) return
    event.stopPropagation()
    const intersectionPoint = event.point

    // Handle curved wall drawing differently
    if (state.activeShape === 'curved-wall') {
      // Don't finalize the curved wall yet, just add the point
      return
    }

    if (state.activeShape === 'wall' || state.activeShape === 'line') {
      // For walls, use the current mouse position (snapped to grid lines and aligned) as the endpoint
      const snappedPoint = snapToGrid(intersectionPoint, false)
      
      // Ensure both the start and end points are within grid boundaries
      const halfWidth = gridWidth / 2
      const halfLength = gridLength / 2
      
      // Ensure start point is within boundaries
      const boundedStart = {
        x: Math.max(-halfWidth, Math.min(drawingPoints[0].x, halfWidth)),
        z: Math.max(-halfLength, Math.min(drawingPoints[0].z, halfLength))
      }
      
      // Get the aligned point (vertical or horizontal wall)
      const alignedPoint = (state.activeShape === 'wall' || state.activeShape === 'line')
        ? snapToVerticalOrHorizontal(boundedStart, snappedPoint)
        : snappedPoint

      dispatch({
        type: state.activeShape === 'wall' ? 'ADD_WALL' : 'ADD_LINE',
        payload: {
          start: boundedStart,
          end: alignedPoint,
          layerId: state.activeLayer,
          color: state.activeColor
        }
      })

      // Reset drawing state after each wall placement
      setIsDrawing(false)
      setDrawingPoints([])
    } else if (state.activeShape === 'floor') {
      // Get the intersection point and check if it's within the grid boundaries
      const point = event.point
      
      // Calculate grid boundaries based on center position
      const halfWidth = gridWidth /2
      const halfLength = gridLength /2
      
      // Check if the point is within the grid boundaries (centered at origin)
      if (point.x >= -halfWidth && point.x <= halfWidth && 
          point.z >= -halfLength && point.z <= halfLength) {
        // Snap the position to the grid cell
        const snappedPosition = snapToGrid(point, true)
        
        // Check if there's already a floor at this position
        // Use a more precise comparison to avoid floating point issues
        const floorExists = state.floors?.some(floor => {
          const sameX = Math.abs(floor.position.x - snappedPosition.x) < 0.1;
          const sameZ = Math.abs(floor.position.z - snappedPosition.z) < 0.1;
          return sameX && sameZ;
        })
        
        if (!floorExists) {
          // Create a new floor tile at the snapped position
          dispatch({
            type: 'ADD_FLOOR',
            payload: {
              position: snappedPosition,
              size: 1, // Default width of 1 unit
              length: 1, // Default length of 1 unit
              layerId: state.activeLayer,
              color: state.activeColor
            }
          })
        }
      }
    }

    // Only reset drawing state if not continuing a wall
    if (state.activeShape !== 'wall') {
      setIsDrawing(false)
      setDrawingPoints([])
    }
  }

  // Direct access to state elements with null checks
  const visibleWalls = state.walls || [];
  const visibleFloors = state.floors || [];

  // Completely rewritten collision detection system

  // 1. First, let's update the checkFurnitureCollision function
  const checkFurnitureCollision = (position, size, rotation, state) => {
    // Early return if state is undefined
    if (!state) return true;

    // Calculate the actual size based on rotation
    const actualSize = rotation % Math.PI === 0 ? size : { width: size.length, length: size.width };
    
    // Use the same grid dimensions as defined in the component
    const halfWidth = gridWidth / 2;
    const halfLength = gridLength / 2;
    
    // Check if furniture would be placed outside the grid
    // Allow placement at the exact grid boundaries
    // Special handling for the north border (top of the grid)
    if (position.x < -halfWidth || position.x + actualSize.width > halfWidth ||
        position.z < -halfLength || position.z + actualSize.length > halfLength) {
      // Check if position is at any grid boundary with a small tolerance for floating point precision
      const isAtNorthBorder = Math.abs(position.z + actualSize.length ) < 0.001;
      const isAtSouthBorder = Math.abs(position.z - (-halfLength)) < 0.001;
      const isAtEastBorder = Math.abs(position.x + actualSize.width - halfWidth) < 0.001;
      const isAtWestBorder = Math.abs(position.x - (-halfWidth)) < 0.001;
      
      // Allow placement if it's exactly at any boundary
      if (isAtNorthBorder || isAtSouthBorder || isAtEastBorder || isAtWestBorder) {
        // This is fine - exactly at the boundary
      } else {
        return false;
      }
    }
    


    // Check all grid cells that would be occupied by this furniture
    for (let x = 0; x < actualSize.width; x++) {
      for (let z = 0; z < actualSize.length; z++) {
        const cellX = Math.floor(position.x + x);
        const cellZ = Math.floor(position.z + z);
        const key = `${cellX},${cellZ}`;
        
        // Check if cell is already occupied by other furniture
        if (state.occupiedGridCells && state.occupiedGridCells[key]) {
          return false;
        }
      }
    }
    
    return true;
  };

  

  // Helper function to calculate distance from a point to a line segment


  return (
    <>
      <group ref={setNodeRef}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

        {/* Grid and existing elements */}
        <gridHelper args={[gridSize, gridDivisions]} />
        <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={planePosition} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onContextMenu={(e) => { if (e && typeof e.preventDefault === 'function') e.preventDefault(); }}>
          <planeGeometry args={[gridWidth, gridLength]} />
          <meshStandardMaterial visible={false} />
        </mesh>

        {/* Render existing walls */}
        {visibleWalls.map((wall, index) => (
          <Wall key={index} {...wall} />
        ))}

        {/* Render wall preview while drawing */}
        {isDrawing && state.activeShape === 'wall' && drawingPoints.length > 0 && mousePosition && (
          <Wall
            start={drawingPoints[drawingPoints.length - 1]}
            end={mousePosition}
            height={3}
            width={0.2}
            color={state.activeColor}
            opacity={0.5}
            castShadow
            receiveShadow
          />
        )}

        {visibleFloors.map((floor, index) => (
          <Floor key={index} {...floor} />
        ))}

        {/* Render placed furniture and imported 3D models */}
        {state.objects.map((object, index) => {
         
          
          
          // Handle regular furniture models
          if (object.modelPath) {
            // Determine furniture type from model path
            const furnitureType = object.modelPath.includes('chair') ? 'chair' : 
                                  object.modelPath.includes('sofa') ? 'sofa' : 
                                  object.modelPath.includes('ikea_bed') ? 'ikea_bed' : 'bed';
            
            // Create a new position object with proper coordinates
            const adjustedPosition = { 
              x: object.position.x, 
              y: 0, 
              z: object.position.z 
            };
            
            // Apply specific position adjustments for each furniture type
            if (furnitureType === 'sofa') {
              // Center the sofa horizontally in its grid cells
              adjustedPosition.x = object.position.x + 0.5;
            } else if (furnitureType === 'chair') {
              // Center the chair in its grid cell
              adjustedPosition.x = object.position.x + 0.5;
              adjustedPosition.z = object.position.z + 0.1;
            }
            
            return (
              <FurnitureModel
                key={object.id || index}
                modelPath={object.modelPath}
                position={adjustedPosition}
                rotation={object.rotation ? [0, object.rotation, 0] : [0, 0, 0]}
                scale={object.scale || 1}
              />
            );
          }
          
          // Return null for objects that don't match any rendering criteria
          return null;
        })}
        
        {/* Render furniture preview */}
        {furniturePreview && (
          <FurniturePreview
            position={furniturePreview.position}
            modelPath={furniturePreview.modelPath}
            isValid={furniturePreview.isValid}
            rotation={previewRotation}
            scale={furniturePreview.scale}
          />
        )}
      </group>
      <OrbitControls enableDamping={false} enabled={state.isRotationEnabled} />
    </>
  )
}