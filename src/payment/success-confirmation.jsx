"use client"

import { useEffect } from "react"
import { Check } from "lucide-react"
import { useNavigate } from "react-router-dom"

const SuccessConfirmation = ({ operationType = "deposit", amount = "50.00" }) => {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Animation effect when component mounts
    const checkmark = document.getElementById("checkmark")
    if (checkmark) {
      checkmark.classList.add("scale-100")
    }
  }, [])

  const isDeposit = operationType === "deposit"
  const title = isDeposit ? "Funds Added Successfully!" : "Withdrawal Successful!"
  const message = isDeposit 
    ? "Your funds have been added to your balance successfully. You can now use your balance for purchases or future withdrawals."
    : "Your withdrawal has been processed successfully. The funds will be transferred to your PayPal account shortly."

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div
            id="checkmark"
            className="mx-auto w-16 h-16 bg-[#A67B5B] rounded-full flex items-center justify-center transform scale-0 transition-transform duration-500"
          >
            <Check className="h-10 w-10 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-medium">TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount {isDeposit ? "Added" : "Withdrawn"}:</span>
            <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate("/profile")} 
            className="w-full bg-[#A67B5B] hover:bg-[#8D6E63] text-white py-3 px-4 rounded-lg font-medium"
          >
            View Balance
          </button>
          <button 
            onClick={() => navigate("/")} 
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-lg font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessConfirmation

