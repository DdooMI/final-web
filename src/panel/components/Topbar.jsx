import { useScene } from '../context/SceneContext'
import { useEffect } from 'react'

export default function TopBar() {
  const { state, dispatch } = useScene()

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

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg flex gap-4 transition-all duration-300 ease-in-out hover:bg-white hover:shadow-xl">
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Redo
      </button>
    </div>
  )
}
