//"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Wallet } from "lucide-react"
import { useAuth } from "../zustand/auth"
import { useBalance } from "../zustand/balance"

const UserBalance = () => {
  const { user } = useAuth()
  const { balance, fetchBalance, isLoading } = useBalance()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && user.uid) {
      fetchBalance(user.uid)
    }
  }, [user, fetchBalance])

  const handleNavigateToPayment = () => {
    navigate("/payment")
  }

  return (
    <div className="bg-white shadow rounded-lg mb-8 p-6">
      <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-[#F5EFE7] p-3 rounded-full mr-4">
            <Wallet className="h-6 w-6 text-[#A67B5B]" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">Available Balance</p>
            <p className="text-2xl font-bold">
              ${isLoading ? "..." : balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-2">
        <button
          onClick={handleNavigateToPayment}
          className="flex items-center justify-center px-4 py-2 bg-[#A67B5B] text-white rounded-md hover:bg-[#8D6E63] transition-colors w-full sm:w-auto"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Manage Funds
        </button>
      </div>
    </div>
  )
}

export default UserBalance