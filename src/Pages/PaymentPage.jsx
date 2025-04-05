"use client"

import { useState, useEffect } from "react"
import { ShoppingCartIcon as PaypalIcon, Lock, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import OrderSummary from "../payment/order-summary"
import LoadingIndicator from "../payment/loading-indicator"
import SuccessConfirmation from "../payment/success-confirmation"
import PayPalButton from "../payment/paypal-button"
import { useAuth } from "../zustand/auth"
import { useBalance } from "../zustand/balance"
import { useNavigate } from "react-router-dom"

const PaymentPage = () => {
  // PayPal is the only payment method
  const [paymentMethod] = useState("paypal")
  // Default operation type based on user role
  const [operationType, setOperationType] = useState("deposit")
  const [amount, setAmount] = useState("50")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  const { user, role } = useAuth()
  const { balance, addFunds, useBalance: withdrawFunds, fetchBalance } = useBalance()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (user && user.uid) {
      fetchBalance(user.uid)
    }
    
    // If user is a designer, default to withdrawal
    if (role === "designer") {
      setOperationType("withdraw")
    }
  }, [user, fetchBalance, role])

  const handleAmountChange = (e) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(value)
  }

  const handlePayPalSuccess = async (order) => {
    try {
      // Update balance in Firestore based on operation type
      const numAmount = parseFloat(amount)
      if (operationType === "deposit") {
        await addFunds(user.uid, numAmount)
      } else {
        await withdrawFunds(user.uid, numAmount)
      }
      
      setIsProcessing(false)
      setIsSuccess(true)
    } catch (err) {
      console.error("Error updating balance:", err)
      setError("Failed to update balance")
      setIsProcessing(false)
    }
  }

  const handlePayPalError = (errorMessage) => {
    setIsProcessing(false)
    setError(errorMessage)
  }

  const handlePayPalCancel = () => {
    setIsProcessing(false)
    setError("Payment was cancelled")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Validate amount
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }
    
    // For withdrawal, check if user has enough balance
    if (operationType === "withdraw" && numAmount > balance) {
      setError("Insufficient balance for withdrawal")
      return
    }
    
    // Validation passed, but actual processing is handled by PayPal component
    // This function now only handles validation
  }

  if (isSuccess) {
    return <SuccessConfirmation operationType={operationType} amount={amount} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">Account Balance Management</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Payment Form */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Manage Your Funds</h2>
              <div className="flex items-center text-green-600">
                <Lock className="h-4 w-4 mr-1" />
                <span className="text-sm">Secure Transaction</span>
              </div>
            </div>

            {/* Operation Type Selection */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                {role === "client" && (
                  <button
                    className={`py-2 px-4 font-medium text-sm relative ${
                      operationType === "deposit" ? "text-[#A67B5B]" : "text-gray-500 hover:text-gray-700"
                    }`}
                    style={{
                      borderBottom: operationType === "deposit" ? "2px solid #A67B5B" : "none",
                    }}
                    onClick={() => setOperationType("deposit")}
                  >
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Deposit
                    </div>
                  </button>
                )}
                <button
                  className={`py-2 px-4 font-medium text-sm relative ${
                    operationType === "withdraw" ? "text-[#A67B5B]" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{
                    borderBottom: operationType === "withdraw" ? "2px solid #A67B5B" : "none",
                  }}
                  onClick={() => setOperationType("withdraw")}
                >
                  <div className="flex items-center">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    Withdraw
                  </div>
                </button>
              </div>
            </div>
            
            {/* Amount Input */}
            <div className="mb-6">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({operationType === "deposit" ? "to deposit" : "to withdraw"})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  name="amount"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A67B5B]"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Payment Method</h3>
              <div className="flex justify-center">
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg border-[#A67B5B] bg-[#F5EFE7] w-full max-w-xs">
                  <PaypalIcon className="h-6 w-6 mb-2" />
                  <span className="text-sm">PayPal</span>
                </div>
              </div>
            </div>

            {/* PayPal Integration */}
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="mb-4">
                <h3 className="font-medium text-center mb-2">
                  {operationType === "deposit" 
                    ? "Add Funds to Your Balance" 
                    : "Withdraw Funds from Your Balance"}
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  {operationType === "deposit" 
                    ? "Funds will be added to your account balance and can be used for purchases." 
                    : "Funds will be withdrawn from your account balance to your PayPal account."}
                </p>
              </div>
              <PayPalButton 
                amount={amount} 
                operationType={operationType}
                onSuccess={handlePayPalSuccess} 
                onError={handlePayPalError} 
                onCancel={handlePayPalCancel} 
              />
            </div>



            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="w-full mt-6 flex justify-center">
                <LoadingIndicator />
              </div>
            )}
            
            <button 
              onClick={() => navigate("/profile")} 
              className="w-full mt-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium"
            >
              Back to Profile
            </button>
          </div>

          {/* Balance Summary */}
          <div className="lg:w-1/3">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage

