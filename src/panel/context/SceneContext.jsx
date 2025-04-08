import { createContext, useContext, useReducer } from "react";

const SceneContext = createContext();

// Load initial state from localStorage or use default values
const loadInitialState = () => {
  localStorage.removeItem("homeDesign");
  return {
    objects: [],
    walls: [],
    floors: [],
    history: [],
    currentStep: -1,
    activeShape: null,
    activeColor: "#808080",
    isRotationEnabled: true,
    selectedFurnitureId: null,
    occupiedGridCells: {},
    houseDimensions: {
      width: 0,
      length: 0,
      height: 3,
      isApplied: false,
      error: null,
    },
    metadata: {
      lastImport: null,
      lastExport: null,
    },
  };
};

const initialState = loadInitialState();

// Add grid helpers to initial state
initialState.gridHelpers = {
  isPositionOccupied: (position, objectSize = { width: 1, length: 1 }) => {
    // Check if position is within walls
    for (const wall of initialState.walls) {
      // Simple collision detection with walls
      const wallStart = { x: wall.start.x, y: wall.start.z };
      const wallEnd = { x: wall.end.x, y: wall.end.z };
      const objPos = { x: position.x, y: position.z };

      // Calculate distance from point to line segment (wall)
      const wallVector = {
        x: wallEnd.x - wallStart.x,
        y: wallEnd.y - wallStart.y,
      };
      const wallLength = Math.sqrt(
        wallVector.x * wallVector.x + wallVector.y * wallVector.y
      );
      const wallDirection = {
        x: wallVector.x / wallLength,
        y: wallVector.y / wallLength,
      };

      const posToWallStart = {
        x: objPos.x - wallStart.x,
        y: objPos.y - wallStart.y,
      };
      const projection =
        posToWallStart.x * wallDirection.x + posToWallStart.y * wallDirection.y;

      // Check if the projection is within the wall segment
      if (projection >= 0 && projection <= wallLength) {
        // Calculate perpendicular distance
        const perpDistance = Math.abs(
          posToWallStart.x * wallDirection.y -
            posToWallStart.y * wallDirection.x
        );

        // Wall width plus some buffer
        const collisionThreshold = 0.3 + objectSize.width / 2;

        if (perpDistance < collisionThreshold) {
          return true; // Collision with wall
        }
      }
    }

    // Check if position is occupied by another object
    for (const obj of initialState.objects) {
      // Simple box collision detection
      const objWidth = obj.scale?.x || 1;
      const objLength = obj.scale?.z || 1;

      // Check if the new object overlaps with existing object
      if (
        Math.abs(position.x - obj.position.x) <
          objWidth / 2 + objectSize.width / 2 &&
        Math.abs(position.z - obj.position.z) <
          objLength / 2 + objectSize.length / 2
      ) {
        return true; // Collision with object
      }
    }

    return false; // No collision
  },
  snapToGrid: (position, gridSize = 0.5) => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: position.y,
      z: Math.round(position.z / gridSize) * gridSize,
    };
  },
};

// Add design approval state
initialState.designApproval = {
  approved: false,
  approvedAt: null,
  comment: "",
  clientId: null,
};

function sceneReducer(state, action) {
  switch (action.type) {
    case "SET_DESIGN_APPROVAL":
      // Set design approval status
      return {
        ...state,
        designApproval: action.payload,
      };

    case "CLEAR_HOUSE_DIMENSIONS":
      // Clear all house dimensions elements and reset dimensions
      return {
        ...state,
        objects: [],
        walls: [],
        floors: [],

        houseDimensions: {
          ...initialState.houseDimensions,
          isApplied: false,
        },
      };
    case "SET_HOUSE_DIMENSIONS": {
      // Validate dimensions
      if (
        action.payload.width <= 0 ||
        action.payload.length <= 0 ||
        action.payload.height <= 0
      ) {
        return {
          ...state,
          houseDimensions: {
            ...state.houseDimensions,
            error: "Dimensions must be greater than 0",
          },
        };
      }

      // Max size validation
      if (
        action.payload.width > 100 ||
        action.payload.length > 100 ||
        action.payload.height > 10
      ) {
        return {
          ...state,
          houseDimensions: {
            ...state.houseDimensions,
            error: "Dimensions exceed maximum allowed size",
          },
        };
      }

      const newHouseDimensions = {
        ...state.houseDimensions,
        ...action.payload,
        isApplied: true,
        error: null, // Clear any previous errors
      };
      return {
        ...state,
        houseDimensions: newHouseDimensions,
        history: [
          ...state.history.slice(0, state.currentStep + 1),
          {
            type: "SET_HOUSE_DIMENSIONS",
            data: newHouseDimensions,
          },
        ],
        currentStep: state.currentStep + 1,
      };
    }

    case "SET_GRID_HELPERS":
      return {
        ...state,
        gridHelpers: action.payload,
      };

    case "EXPORT_DESIGN": // Create a design export object
    {
      const designExport = {
        objects: state.objects,
        walls: state.walls,
        floors: state.floors,
        houseDimensions: state.houseDimensions,
        metadata: {
          ...state.metadata,
          lastExport: new Date().toISOString(),
        },
      };

      // Return state with updated metadata
      return {
        ...state,
        metadata: {
          ...state.metadata,
          lastExport: new Date().toISOString(),
        },
        exportData: designExport,
      };
    }
    case "ADD_OBJECT": {
      const newObject = {
        ...action.payload,
        id: Date.now(),
        position: action.payload.position || { x: 0, y: 0, z: 0 },
      };
      return {
        ...state,
        objects: [...state.objects, newObject],
        history: [
          ...state.history.slice(0, state.currentStep + 1),
          {
            type: "ADD_OBJECT",
            data: newObject,
          },
        ],
        currentStep: state.currentStep + 1,
      };
    }

    case "ADD_WALL": {
      const newWall = {
        ...action.payload,
        id: Date.now(),
        color: action.payload.color || state.activeColor,
      };
      return {
        ...state,
        walls: [...state.walls, newWall],
        history: [
          ...state.history.slice(0, state.currentStep + 1),
          {
            type: "ADD_WALL",
            data: newWall,
          },
        ],
        currentStep: state.currentStep + 1,
      };
    }
    case "ADD_FLOOR": {
      const newFloor = {
        ...action.payload,
        id: Date.now(),
        color: action.payload.color || state.activeColor,
      };
      return {
        ...state,
        floors: [...state.floors, newFloor],
        history: [
          ...state.history.slice(0, state.currentStep + 1),
          {
            type: "ADD_FLOOR",
            data: newFloor,
          },
        ],
        currentStep: state.currentStep + 1,
      };
    }
    case "ADD_FURNITURE": {
      const newFurniture = {
        ...action.payload,
        id: action.payload.id || Date.now(),
      };
      return {
        ...state,
        objects: [...state.objects, newFurniture],
        history: [
          ...state.history.slice(0, state.currentStep + 1),
          {
            type: "ADD_FURNITURE",
            data: newFurniture,
          },
        ],
        currentStep: state.currentStep + 1,
      };
    }
    case "SET_ACTIVE_SHAPE":
      return {
        ...state,
        activeShape: action.payload,
      };
    case "SET_ACTIVE_COLOR":
      return {
        ...state,
        activeColor: action.payload,
      };
    case "TOGGLE_ROTATION":
      return {
        ...state,
        isRotationEnabled: !state.isRotationEnabled,
      };
    case "SELECT_FURNITURE":
      return {
        ...state,
        selectedFurnitureId: action.payload,
      };
    case "PLACE_FURNITURE": {
      const placedFurniture = {
        ...action.payload,
        id: Date.now(),
        type: "furniture",
      };

      // Create a new occupiedGridCells object with the new furniture's cells
      const newOccupiedGridCells = { ...state.occupiedGridCells };

      // Add the cells occupied by this furniture
      if (action.payload.occupiedCells) {
        Object.keys(action.payload.occupiedCells).forEach((cellKey) => {
          newOccupiedGridCells[cellKey] = true;
        });
      }

      return {
        ...state,
        objects: [...state.objects, placedFurniture],
        occupiedGridCells: newOccupiedGridCells,
        history: [
          ...state.history.slice(0, state.currentStep + 1),
          {
            type: "PLACE_FURNITURE",
            data: placedFurniture,
            occupiedCells: action.payload.occupiedCells,
          },
        ],
        currentStep: state.currentStep + 1,
      };
    }

    case "UNDO":
      if (state.currentStep >= 0) {
        const lastAction = state.history[state.currentStep];
        const newState = { ...state, currentStep: state.currentStep - 1 };

        // Find the previous state for the affected property
        const getPreviousState = (propertyType) => {
          return state.currentStep > 0
            ? state.history
                .slice(0, state.currentStep)
                .reverse()
                .find((action) => action.type === propertyType)?.data
            : null;
        };

        switch (lastAction.type) {
          case "SET_HOUSE_DIMENSIONS": {
            const prevDimensions =
              getPreviousState("SET_HOUSE_DIMENSIONS") ||
              initialState.houseDimensions;
            newState.houseDimensions = prevDimensions;

            // Clear elements only if dimensions are not applied
            if (!prevDimensions.isApplied) {
              newState.walls = [];
              newState.floors = [];
              newState.curvedWalls = [];
            } else {
              // Keep existing elements when dimensions are applied
              const prevElements = state.history
                .slice(0, state.currentStep)
                .filter((action) =>
                  ["ADD_WALL", "ADD_FLOOR", "ADD_CURVED_WALL"].includes(
                    action.type
                  )
                )
                .map((action) => action.data);

              newState.walls = prevElements.filter((el) => el.type === "wall");
              newState.floors = prevElements.filter(
                (el) => el.type === "floor"
              );
              newState.curvedWalls = prevElements.filter(
                (el) => el.type === "curvedWall"
              );
            }
            break;
          }

          case "ADD_OBJECT":
            newState.objects = state.objects.filter(
              (obj) => obj.id !== lastAction.data.id
            );
            break;

          case "ADD_WALL":
            newState.walls = state.walls.filter(
              (wall) => wall.id !== lastAction.data.id
            );
            break;

          case "ADD_FLOOR":
            newState.floors = state.floors.filter(
              (floor) => floor.id !== lastAction.data.id
            );

            break;

          case "ADD_FURNITURE":
          case "PLACE_FURNITURE":
            newState.objects = state.objects.filter(
              (obj) => obj.id !== lastAction.data.id
            );

            // Remove the occupied cells for this furniture
            if (lastAction.occupiedCells) {
              const newOccupiedGridCells = { ...state.occupiedGridCells };
              Object.keys(lastAction.occupiedCells).forEach((cellKey) => {
                delete newOccupiedGridCells[cellKey];
              });
              newState.occupiedGridCells = newOccupiedGridCells;
            }
            break;
        }

        return newState;
      }
      return state;

    case "REDO":
      if (state.currentStep < state.history.length - 1) {
        const nextAction = state.history[state.currentStep + 1];
        const newState = { ...state, currentStep: state.currentStep + 1 };

        switch (nextAction.type) {
          case "SET_HOUSE_DIMENSIONS":
            newState.houseDimensions = nextAction.data;

            // Clear elements only if dimensions are not applied
            if (!nextAction.data.isApplied) {
              newState.walls = [];
              newState.floors = [];
              newState.curvedWalls = [];
            } else {
              // Restore previous elements when redoing applied dimensions
              const prevState = state.history
                .slice(0, state.currentStep + 1)
                .reverse()
                .find((action) => action.type === "SET_HOUSE_DIMENSIONS");

              if (prevState && !prevState.data.isApplied) {
                newState.walls = [];
                newState.floors = [];
                newState.lines = [];
                newState.circles = [];
                newState.curvedWalls = [];
              }
            }
            break;

          case "ADD_OBJECT":
            newState.objects = [...state.objects, nextAction.data];
            break;

          case "ADD_WALL":
            newState.walls = [...state.walls, nextAction.data];
            break;

          case "ADD_FLOOR":
            newState.floors = [...state.floors, nextAction.data];
            break;

          case "ADD_FURNITURE":
          case "PLACE_FURNITURE":
            newState.objects = [...state.objects, nextAction.data];

            // Add back the occupied cells for this furniture
            if (nextAction.occupiedCells) {
              const newOccupiedGridCells = { ...state.occupiedGridCells };
              Object.keys(nextAction.occupiedCells).forEach((cellKey) => {
                newOccupiedGridCells[cellKey] = true;
              });
              newState.occupiedGridCells = newOccupiedGridCells;
            }
            break;

          case "CLEAR_HOUSE_DIMENSIONS":
            newState.walls = [];
            newState.floors = [];

            break;
        }

        return newState;
      }
      return state;
    case "SET_METADATA":
      return {
        ...state,
        metadata: {
          ...state.metadata,
          ...action.payload,
        },
      };

    case "IMPORT_DESIGN":
      if (!action.payload) return state;
      
      // Ensure all imported objects have proper IDs and types
      const importedObjects = (action.payload.objects || []).map(obj => ({
        ...obj,
        id: obj.id || Date.now() + Math.random(),
        type: obj.type || obj.modelPath?.split('/')?.pop()?.split('.')[0] || 'chair'
      }));

      // Ensure all imported walls have proper IDs and colors
      const importedWalls = (action.payload.walls || []).map(wall => ({
        ...wall,
        id: wall.id || Date.now() + Math.random(),
        color: wall.color || state.activeColor
      }));

      // Ensure all imported floors have proper IDs and colors
      const importedFloors = (action.payload.floors || []).map(floor => ({
        ...floor,
        id: floor.id || Date.now() + Math.random(),
        color: floor.color || state.activeColor
      }));

      // Import house dimensions with validation
      const importedDimensions = action.payload.houseDimensions || state.houseDimensions;

      return {
        ...state,
        objects: importedObjects,
        walls: importedWalls,
        floors: importedFloors,
        houseDimensions: importedDimensions,
        history: [
          ...state.history,
          {
            type: "IMPORT_DESIGN",
            data: {
              objects: importedObjects,
              walls: importedWalls,
              floors: importedFloors,
              houseDimensions: importedDimensions
            }
          }
        ],
        currentStep: state.history.length,
        metadata: {
          ...state.metadata,
          lastImport: new Date().toISOString()
        }
      };

    default:
      return state;
  }
}

// eslint-disable-next-line react/prop-types
export function SceneProvider({ children }) {
  const [state, dispatch] = useReducer(sceneReducer, initialState);

  return (
    <SceneContext.Provider value={{ state, dispatch }}>
      {children}
    </SceneContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error("useScene must be used within a SceneProvider");
  }
  return context;
}
