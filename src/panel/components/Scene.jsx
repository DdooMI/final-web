/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";

import { useDroppable } from "@dnd-kit/core";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useScene } from "../context/SceneContext";
import FurnitureModel from "./FurnitureModel";

function Wall({
  start,
  end,
  height = 3,
  width = 0.2,
  color = "#808080",
  opacity = 1,
}) {
  const wallRef = useRef();
  const length = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
  );
  const angle = Math.atan2(end.z - start.z, end.x - start.x);

  useEffect(() => {
    if (wallRef.current) {
      wallRef.current.rotation.y = angle;
    }
  }, [angle]);

  return (
    <mesh
      ref={wallRef}
      position={[(start.x + end.x) / 2, height / 2, (start.z + end.z) / 2]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, height, width]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function Floor({ position, size, length, color = "#808080" }) {
  const floorWidth = size;
  const floorLength = length || size;
  
  // Only add the 0.5 offset for individual floor tiles, not for house dimensions
  const isHouseDimension = size > 1;
  const xOffset = isHouseDimension ? 0 : 0.5;
  const zOffset = isHouseDimension ? 0 : 0.5;
  
  return (
    <mesh
      position={[position.x + xOffset, 0.01, position.z + zOffset]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[floorWidth, floorLength]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function FurniturePreview({ position, modelPath, isValid, rotation, scale }) {
  // Determine furniture type from model path
  const furnitureType = modelPath.includes("chair")
    ? "chair"
    : modelPath.includes("sofa")
    ? "sofa"
    : modelPath.includes("ikea_bed")
    ? "ikea_bed"
    : modelPath.includes("table")
    ? "table"
    : "bed";

  // Create a new position object with proper coordinates
  const adjustedPosition = {
    x: position.x,
    y: 0,
    z: position.z,
  };

  // Apply specific position adjustments for each furniture type
  if (furnitureType === "sofa") {
    // Center the sofa horizontally in its grid cells
    adjustedPosition.x = position.x + 0.5;
  } else if (furnitureType === "chair") {
    // Center the chair in its grid cell
    adjustedPosition.x = position.x + 0.5;
    adjustedPosition.z = position.z + 0.1;
  }

  return (
    <FurnitureModel
      modelPath={modelPath}
      position={adjustedPosition}
      opacity={0.5}
      color={isValid ? "#00ff00" : "#ff0000"}
      rotation={[0, rotation, 0]}
      scale={scale || 1}
    />
  );
}

export default function Scene() {
  const { state, dispatch } = useScene();
  const { setNodeRef } = useDroppable({
    id: "scene",
    data: {
      accepts: ["shape"],
    },
  });
  const planeRef = useRef();
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, z: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [furniturePreview, setFurniturePreview] = useState(null);
  const [previewRotation, setPreviewRotation] = useState(0);

  // Add ambient light to illuminate the entire scene
  const ambientLight = useMemo(() => new THREE.AmbientLight(0xffffff, 0.5), []);

  // Add directional light for shadows and better depth perception
  const directionalLight = useMemo(() => {
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 10, 10);
    light.castShadow = true;
    return light;
  }, []);

  // Add lights to the scene
  useEffect(() => {
    if (planeRef.current) {
      const scene = planeRef.current.parent;
      scene.add(ambientLight);
      scene.add(directionalLight);
      
      // Set background color to white
      scene.background = new THREE.Color(0xffffff);

      return () => {
        scene.remove(ambientLight);
        scene.remove(directionalLight);
      };
    }
  }, [ambientLight, directionalLight]);

  // Handle keyboard events for furniture rotation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === "Space" && furniturePreview) {
        event.preventDefault();
        // Rotate 90 degrees clockwise
        setPreviewRotation((prev) => (prev + Math.PI / 2) % (Math.PI * 2));
      }
    };

    // Ensure event listener is properly attached
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, [furniturePreview]);

  // Ensure Three.js and scene are properly initialized with error handling and retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const initializeScene = () => {
      try {
        // Initialize Three.js scene
        if (!THREE) {
          throw new Error("Three.js not loaded");
        }

        // Force a re-render to ensure proper initialization
        const timer = setTimeout(() => {
          setMousePosition((prev) => ({ ...prev }));
        }, 300);

        // Initialize event handlers for the scene
        const handleKeyDown = (event) => {
          if (event.code === "Space" && furniturePreview) {
            event.preventDefault();
            setPreviewRotation((prev) => (prev + Math.PI / 2) % (Math.PI * 2));
          }
        };

        // Add event listeners
        window.addEventListener("keydown", handleKeyDown);

        // Ensure proper cleanup
        return () => {
          clearTimeout(timer);
          window.removeEventListener("keydown", handleKeyDown);
        };
      } catch (error) {
        console.error(`Scene initialization error (attempt ${retryCount + 1}):`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initializeScene, retryDelay);
        } else {
          console.error("Failed to initialize scene after maximum retries");
          dispatch({
            type: "SET_ERROR",
            payload: "فشل في تحميل المشهد. يرجى تحديث الصفحة والمحاولة مرة أخرى."
          });
        }
      }
    };

    initializeScene();
  }, [furniturePreview, dispatch]);


  // Handle scene initialization errors
  useEffect(() => {
    const handleError = (error) => {
      console.error("Scene initialization error:", error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Check if house dimensions have been applied
  const houseDimensionsApplied = state.houseDimensions?.isApplied;

  // Clear scene when house dimensions are first applied
  useEffect(() => {
    if (houseDimensionsApplied) {
      dispatch({
        type: "SET_HOUSE_DIMENSIONS",
        payload: { ...state.houseDimensions },
      });
    }
  }, [dispatch, houseDimensionsApplied, state.houseDimensions]);

  // Initialize furniture preview when furniture is selected
  useEffect(() => {
    if (state.activeShape === "furniture" && state.selectedFurnitureId) {
      const furnitureCategories = {
        ikea_bed: "https://raw.githubusercontent.com/DdooMI/models/main/ikea_idanas_single_bed.glb",
        bed: "https://raw.githubusercontent.com/DdooMI/models/main/bed.glb",
        chair: "https://raw.githubusercontent.com/DdooMI/models/main/chair.glb",
        sofa: "https://raw.githubusercontent.com/DdooMI/models/main/sofa.glb",
        table: "https://raw.githubusercontent.com/DdooMI/models/main/sofa.glb", // Using sofa as fallback since table model wasn't found
      };

      const modelPath = furnitureCategories[state.selectedFurnitureId];
      
      if (modelPath) {
        // Define specific sizes for each furniture type
        let furnitureSize;
        let furnitureScale;

        switch (state.selectedFurnitureId) {
          case "ikea_bed":
            furnitureSize = { width: 1, length: 2 };
            furnitureScale = 1;
            break;
          case "bed":
            furnitureSize = { width: 1, length: 2 };
            furnitureScale = 1;
            break;
          case "sofa":
            furnitureSize = { width: 1, length: 2 };
            furnitureScale = 0.025;
            break;
          case "table":
            furnitureSize = { width: 1.5, length: 1.5 };
            furnitureScale = 0.5;
            break;
          case "chair":
          default:
            furnitureSize = { width: 1, length: 1 };
            furnitureScale = 0.4;
            break;
        }

        // Use a proper position for the preview that considers the mouse position
        const snappedPosition = mousePosition ? { 
          x: Math.floor(mousePosition.x), 
          z: Math.floor(mousePosition.z) 
        } : { x: 0, z: 0 };
        
        // Check if position is valid (not occupied)
        const isValid = !state.gridHelpers?.isPositionOccupied
          ? true
          : !state.gridHelpers.isPositionOccupied(
              snappedPosition,
              furnitureSize
            );

        setFurniturePreview({
          modelPath,
          position: snappedPosition,
          isValid: isValid,
          size: furnitureSize,
          scale: furnitureScale,
        });
      } else {
        console.error('Invalid furniture type:', state.selectedFurnitureId);
        setFurniturePreview(null);
      }
    } else {
      setFurniturePreview(null);
    }
  }, [state.activeShape, state.selectedFurnitureId, state.gridHelpers, mousePosition]);

  // Calculate grid dimensions based on house dimensions
  const gridWidth = useMemo(() => {
    if (houseDimensionsApplied && state.houseDimensions?.width) {
      return state.houseDimensions.width;
    }
    return 20; // Default grid width
  }, [houseDimensionsApplied, state.houseDimensions?.width]);

  const gridLength = useMemo(() => {
    if (houseDimensionsApplied && state.houseDimensions?.length) {
      return state.houseDimensions.length;
    }
    return 20; // Default grid length
  }, [houseDimensionsApplied, state.houseDimensions?.length]);

  // Calculate max grid size for the gridHelper (used for divisions calculation)
  const gridSize = useMemo(() => {
    return Math.max(gridWidth, gridLength);
  }, [gridWidth, gridLength]);

  // Calculate grid divisions based on size to maintain 1m grid cells
  const gridDivisions = useMemo(() => {
    return Math.floor(gridSize);
  }, [gridSize]);

  // Calculate the center position of the plane to align with the grid helpers
  const planePosition = useMemo(() => {
    return [0, 0, 0]; // The grid is already centered at origin
  }, []);

  const snapToGrid = (point, isFloor = false, isHouseDimension = false) => {
    // Calculate grid boundaries based on center position
    const halfWidth = gridWidth / 2;
    const halfLength = gridLength / 2;

    let gridX, gridZ;
    
    if (isHouseDimension) {
      // For house dimensions, use the original logic
      gridX = point.x;
      gridZ = point.z;
    } else if (isFloor) {
      // For individual floor tiles, snap to grid cell
      gridX = Math.floor(point.x + halfWidth) - halfWidth;
      gridZ = Math.floor(point.z + halfLength) - halfLength;
    } else {
      // For walls, snap to grid lines
      gridX = Math.round(point.x);
      gridZ = Math.round(point.z);
    }

    // Ensure the point is strictly within the grid boundaries
    if (isHouseDimension) {
      // No clamping for house dimensions
      return { x: gridX, z: gridZ };
    } else if (isFloor) {
      // For floors, keep within the grid cells
      gridX = Math.max(-halfWidth, Math.min(gridX, halfWidth - 1));
      gridZ = Math.max(-halfLength, Math.min(gridZ, halfLength - 1));
    } else {
      // For walls, allow drawing on the grid boundaries but not outside
      gridX = Math.max(-halfWidth, Math.min(gridX, halfWidth));
      gridZ = Math.max(-halfLength, Math.min(gridZ, halfLength));
    }

    return {
      x: gridX,
      z: gridZ,
    };
  };

  // Handle pointer move event
  const handlePointerMove = (event) => {
    if (!event.intersections || event.intersections.length === 0) return;

    const intersection = event.intersections[0];
    if (!intersection) return;

    // Get the point of intersection
    const point = intersection.point;
    
    // Snap to grid
    const snappedPoint = snapToGrid(point);
    
    // Update mouse position for furniture preview
    setMousePosition(snappedPoint);

    // If we're drawing a wall, snap to vertical or horizontal
    if (isDrawing && drawingPoints.length > 0 && state.activeShape === "wall") {
      const start = drawingPoints[drawingPoints.length - 1];
      const snappedEnd = snapToVerticalOrHorizontal(start, snappedPoint);
      setMousePosition(snappedEnd);
    }
  };

  // Handle pointer up event
  const handlePointerUp = () => {
    if (!isDrawing || drawingPoints.length === 0) return;

    // For wall creation
    if (state.activeShape === "wall") {
      const start = drawingPoints[drawingPoints.length - 1];
      const end = mousePosition;
      
      // Only create wall if start and end are different points
      if (start.x !== end.x || start.z !== end.z) {
        dispatch({
          type: "ADD_WALL",
          payload: {
            start,
            end,
            color: state.activeColor,
          },
        });
      }
      
      // Reset drawing state
      setIsDrawing(false);
      setDrawingPoints([]);
    }
  };

  const snapToVerticalOrHorizontal = (start, end) => {
    // Calculate differences in x and z coordinates
    const dx = Math.abs(end.x - start.x);
    const dz = Math.abs(end.z - start.z);

    // Calculate grid boundaries
    const halfWidth = gridWidth / 2;
    const halfLength = gridLength / 2;

    // Determine if the wall should be vertical or horizontal
    if (dx < dz) {
      // Vertical wall (constant x)
      // Ensure z is within grid boundaries
      const boundedZ = Math.max(-halfLength, Math.min(end.z, halfLength));
      return { x: start.x, z: boundedZ };
    } else {
      // Horizontal wall (constant z)
      // Ensure x is within grid boundaries
      const boundedX = Math.max(-halfWidth, Math.min(end.x, halfWidth));
      return { x: boundedX, z: start.z };
    }
  };

  // Direct access to state elements with null checks
  const visibleWalls = state.walls || [];
  const visibleFloors = state.floors || [];

  // Collision detection system for furniture placement

  // Check if furniture can be placed at the given position

  // Helper function to calculate distance from a point to a line segment

  return (
    <>
      <group ref={setNodeRef}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Grid and existing elements */}
        <gridHelper args={[gridSize, gridDivisions]} />
        <mesh
          ref={planeRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={planePosition}
          onPointerDown={(event) => {
            if (!event.intersections || event.intersections.length === 0) return;

            const intersection = event.intersections[0];
            if (!intersection) return;

            // Get the point of intersection
            const point = intersection.point;
            // Snap to grid
            const snappedPoint = snapToGrid(point);

            // Handle different active shapes
            if (state.activeShape === "wall") {
              setIsDrawing(true);
              setDrawingPoints([...drawingPoints, snappedPoint]);
            } else if (state.activeShape === "floor") {
              const intersection = event.intersections[0];
              if (!intersection) return;
              
              // Get the point of intersection
              const point = intersection.point;
              // Snap to grid for floor placement
              const snappedPoint = snapToGrid(point, true, false);
              const floorSize = 1; // Default size for individual floor tiles
              dispatch({
                type: "ADD_FLOOR",
                payload: {
                  position: snappedPoint,
                  size: floorSize,
                  color: state.activeColor,
                },
              });
            } else if (state.activeShape === "furniture" && furniturePreview) {
              // Add furniture at the position of the preview
              if (furniturePreview.isValid) {
                const furnitureId = `furniture-${Date.now()}`;
                dispatch({
                  type: "ADD_OBJECT",
                  payload: {
                    id: furnitureId,
                    type: "furniture",
                    modelPath: furniturePreview.modelPath,
                    position: furniturePreview.position,
                    rotation: previewRotation,
                    scale: furniturePreview.scale,
                    size: furniturePreview.size,
                  },
                });

                // Mark grid cells as occupied
                if (state.gridHelpers && state.gridHelpers.occupyGridCells) {
                  state.gridHelpers.occupyGridCells(
                    furniturePreview.position,
                    furniturePreview.size,
                    furnitureId
                  );
                }
              }
            }
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onContextMenu={(e) => {
            if (e && typeof e.preventDefault === "function") e.preventDefault();
          }}
        >
          <planeGeometry args={[gridWidth, gridLength]} />
          <meshStandardMaterial visible={false} />
        </mesh>

        {/* Render existing walls */}
        {visibleWalls.map((wall, index) => (
          <Wall key={index} {...wall} />
        ))}

        {/* Render wall preview while drawing */}
        {isDrawing &&
          state.activeShape === "wall" &&
          drawingPoints.length > 0 &&
          mousePosition && (
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
            const furnitureType = object.modelPath.includes("chair")
              ? "chair"
              : object.modelPath.includes("sofa")
              ? "sofa"
              : object.modelPath.includes("ikea_bed")
              ? "ikea_bed"
              : object.modelPath.includes("table")
              ? "table"
              : "bed";

            // Create a new position object with proper coordinates
            const adjustedPosition = {
              x: object.position.x,
              y: 0,
              z: object.position.z,
            };

            // Apply specific position adjustments for each furniture type
            if (furnitureType === "sofa") {
              // Center the sofa horizontally in its grid cells
              adjustedPosition.x = object.position.x + 0.5;
            } else if (furnitureType === "chair") {
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
      {state.isRotationEnabled && <OrbitControls enableDamping={false} />}
    </>
  );
}
