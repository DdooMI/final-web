/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useScene } from "../context/SceneContext";

// This component creates a grid system for the scene
// It helps with positioning objects and prevents overlapping
export default function GridSystem() {
  const { state, dispatch } = useScene();

  // Create a grid helper for visual reference
  const gridHelper = useMemo(() => {
    // Create a grid that matches the house dimensions or use default size
    const gridSize = state.houseDimensions.isApplied
      ? Math.max(state.houseDimensions.width, state.houseDimensions.length)
      : 20;

    const divisions = gridSize * 2;
    const grid = new THREE.GridHelper(gridSize, divisions, 0x888888, 0x444444);
    grid.position.y = 0.01; // Slightly above the floor to avoid z-fighting
    grid.name = "gridHelper";
    return grid;
  }, [
    state.houseDimensions.isApplied,
    state.houseDimensions.width,
    state.houseDimensions.length,
  ]);

  // Function to check if a position is occupied
  const isPositionOccupied = (
    position,
    objectSize = { width: 1, length: 1 },
    objectRotation = 0
  ) => {
    // Always get the current state to ensure we're checking against the latest walls and objects
    const currentWalls = state.walls || [];
    const currentObjects = state.objects || [];

    // Check if position is within walls
    for (const wall of currentWalls) {
      // Simple collision detection with walls
      const wallStart = new THREE.Vector2(wall.start.x, wall.start.z);
      const wallEnd = new THREE.Vector2(wall.end.x, wall.end.z);
      const objPos = new THREE.Vector2(position.x, position.z);

      // Calculate distance from point to line segment (wall)
      const wallVector = wallEnd.clone().sub(wallStart);
      const wallLength = wallVector.length();

      // Avoid division by zero for very short walls
      if (wallLength < 0.001) continue;

      const wallDirection = wallVector.clone().normalize();

      const posToWallStart = objPos.clone().sub(wallStart);
      const projection = posToWallStart.dot(wallDirection);

      // Check if the projection is within the wall segment
      if (projection >= 0 && projection <= wallLength) {
        // Calculate perpendicular distance
        const perpDistance = Math.abs(posToWallStart.cross(wallDirection));

        // Wall width plus some buffer
        // Add a bit more buffer for rotated objects
        const rotationFactor =
          Math.abs(Math.sin(objectRotation)) > 0.1 ? 1.2 : 1;
        const collisionThreshold =
          (0.3 + objectSize.width / 2) * rotationFactor;

        if (perpDistance < collisionThreshold) {
          return true; // Collision with wall
        }
      }
    }

    // Check if position is occupied by another object
    for (const obj of currentObjects) {
      // Skip if the object doesn't have a position or if it's the same object (by checking position equality)
      if (
        !obj.position ||
        (obj.position.x === position.x &&
          obj.position.y === position.y &&
          obj.position.z === position.z)
      )
        continue;

      // Get object dimensions
      const objWidth = obj.scale?.x || 1;
      const objLength = obj.scale?.z || 1;

      // Calculate adjusted dimensions based on rotation
      let objRotation = obj.rotation?.y || 0;
      let thisObjWidth = objectSize.width;
      let thisObjLength = objectSize.length;

      // For rotated objects, we need to consider the full bounding box
      // This is a simplified approach that works well for most cases
      if (Math.abs(Math.sin(objRotation)) > 0.1) {
        // Object is significantly rotated, use a more conservative collision check
        const objDiagonal = Math.sqrt(
          objWidth * objWidth + objLength * objLength
        );

        // Check if the new object overlaps with existing object using a circular approximation
        const distance = Math.sqrt(
          Math.pow(position.x - obj.position.x, 2) +
            Math.pow(position.z - obj.position.z, 2)
        );

        // Improved collision detection with better bounding box calculation
        // Add a small buffer to account for object rotation variations
        const buffer = 0.1;
        if (
          distance <
          objDiagonal / 2 +
            Math.sqrt(
              thisObjWidth * thisObjWidth + thisObjLength * thisObjLength
            ) /
              2 +
            buffer
        ) {
          return true; // Collision with object
        }
      } else {
        // Standard box collision detection for non-rotated objects
        // Add a small buffer to prevent objects from being too close
        const buffer = 0.05;
        if (
          Math.abs(position.x - obj.position.x) <
            objWidth / 2 + thisObjWidth / 2 + buffer &&
          Math.abs(position.z - obj.position.z) <
            objLength / 2 + thisObjLength / 2 + buffer
        ) {
          return true; // Collision with object
        }
      }
    }

    return false; // No collision
  };

  // Function to snap position to grid
  const snapToGrid = (position, gridSize = 0.5) => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: position.y,
      z: Math.round(position.z / gridSize) * gridSize,
    };
  };

  // Update the scene context with grid helper functions
  useEffect(() => {
    dispatch({
      type: "SET_GRID_HELPERS",
      payload: {
        isPositionOccupied,
        snapToGrid,
      },
    });
  }, [dispatch]);

  return <primitive object={gridHelper} />;
}
