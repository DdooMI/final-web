"use client"

import { useState, useEffect } from "react"
import { ShoppingCartIcon as PaypalIcon, Lock, Wallet, CreditCard, Smartphone, Apple } from "lucide-react"
import OrderSummary from "../payment/order-summary"
import LoadingIndicator from "../payment/loading-indicator"
import SuccessConfirmation from "../payment/success-confirmation"
import PayPalButton from "../payment/paypal-button"
import CardDetailsForm from "../payment/card-details-form"
import { useAuth } from "../zustand/auth"
import { useBalance } from "../zustand/balance"

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)
    }, 2000)
  }

  if (isSuccess) {
    return <SuccessConfirmation />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Payment Form */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              <div className="flex items-center text-green-600">
                <Lock className="h-4 w-4 mr-1" />
                <span className="text-sm">Secure Payment</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  className={`py-2 px-4 font-medium text-sm relative ${
                    true ? "text-[#A67B5B]" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{
                    borderBottom: true ? "2px solid #A67B5B" : "none",
                  }}
                >
                  Payment
                </button>
                <button
                  className={`py-2 px-4 font-medium text-sm relative ${
                    false ? "text-[#A67B5B]" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{
                    borderBottom: false ? "2px solid #A67B5B" : "none",
                  }}
                >
                  Shipping
                </button>
                <button
                  className={`py-2 px-4 font-medium text-sm relative ${
                    false ? "text-[#A67B5B]" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{
                    borderBottom: false ? "2px solid #A67B5B" : "none",
                  }}
                >
                  Confirmation
                </button>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                    paymentMethod === "card" ? "border-[#A67B5B] bg-[#F5EFE7]" : "border-gray-200"
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <CreditCard className="h-6 w-6 mb-2" />
                  <span className="text-sm">Credit Card</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                    paymentMethod === "paypal" ? "border-[#A67B5B] bg-[#F5EFE7]" : "border-gray-200"
                  }`}
                  onClick={() => setPaymentMethod("paypal")}
                >
                  <PaypalIcon className="h-6 w-6 mb-2" />
                  <span className="text-sm">PayPal</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                    paymentMethod === "apple" ? "border-[#A67B5B] bg-[#F5EFE7]" : "border-gray-200"
                  }`}
                  onClick={() => setPaymentMethod("apple")}
                >
                  <Apple className="h-6 w-6 mb-2" />
                  <span className="text-sm">Apple Pay</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                    paymentMethod === "google" ? "border-[#A67B5B] bg-[#F5EFE7]" : "border-gray-200"
                  }`}
                  onClick={() => setPaymentMethod("google")}
                >
                  <Smartphone className="h-6 w-6 mb-2" />
                  <span className="text-sm">Google Pay</span>
                </button>
              </div>
            </div>

            {/* Card Details Form */}
            {paymentMethod === "card" && <CardDetailsForm />}

            {/* Other Payment Methods */}
            {paymentMethod === "paypal" && (
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <p className="mb-4">You'll be redirected to PayPal to complete your payment.</p>
                <button className="w-full bg-[#0070ba] text-white py-3 px-4 rounded-lg font-medium">
                  Continue to PayPal
                </button>
              </div>
            )}

            {paymentMethod === "apple" && (
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <p className="mb-4">Complete your purchase with Apple Pay.</p>
                <button className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium">
                  Pay with Apple Pay
                </button>
              </div>
            )}

            {paymentMethod === "google" && (
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <p className="mb-4">Complete your purchase with Google Pay.</p>
                <button className="w-full bg-white border border-gray-300 py-3 px-4 rounded-lg font-medium flex items-center justify-center">
                  <span className="text-blue-500 mr-2">G</span>
                  <span className="text-red-500 mr-2">o</span>
                  <span className="text-yellow-500 mr-2">o</span>
                  <span className="text-blue-500 mr-2">g</span>
                  <span className="text-green-500 mr-2">l</span>
                  <span className="text-red-500">e</span>
                  <span className="ml-2">Pay</span>
                </button>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full mt-6 bg-[#A67B5B] hover:bg-[#8D6E63] text-white py-3 px-4 rounded-lg font-medium disabled:opacity-70"
            >
              {isProcessing ? <LoadingIndicator /> : `Pay $99.99`}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage

