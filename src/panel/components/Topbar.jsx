import { useScene } from '../context/SceneContext'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../zustand/auth'

export default function TopBar() {
  const { state, dispatch } = useScene()
  const { role } = useAuth()

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

  // Determine dashboard link based on user role
  const dashboardLink = role === 'designer' ? '/designer-requests' : '/client-requests';

  return (
    <div className="absolute top-4 left-0 right-0 mx-auto max-w-5xl bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg flex justify-between transition-all duration-300 ease-in-out hover:bg-white hover:shadow-xl">
      <Link 
        to={dashboardLink}
        className="px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] flex items-center gap-2 transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </Link>
      
      <div className="flex gap-4">
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
          Redo
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          className="px-4 py-2 bg-[#C19A6B] text-white rounded-lg hover:bg-[#A0784A] flex items-center gap-2 transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md"
          onClick={() => dispatch({ type: 'SAVE_DESIGN' })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Save Design
        </button>
      </div>
    </div>
  )
}
