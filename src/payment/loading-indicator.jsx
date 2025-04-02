const LoadingIndicator = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
      <span>Processing...</span>
    </div>
  )
}

export default LoadingIndicator

