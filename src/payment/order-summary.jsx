import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useEffect } from "react"
import { useAuth } from "../zustand/auth"
import { useBalance } from "../zustand/balance"

const OrderSummary = () => {
  const { user, role } = useAuth()
  const { balance, fetchBalance, isLoading } = useBalance()

  useEffect(() => {
    if (user && user.uid) {
      fetchBalance(user.uid)
    }
  }, [user, fetchBalance])

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h2 className="text-xl font-semibold mb-4">Balance Summary</h2>

      {/* Current Balance Section */}
      <div className="mb-6 p-6 bg-[#F5EFE7] rounded-lg text-center">
        <div className="flex items-center justify-center mb-3">
          <Wallet className="h-8 w-8 mr-2 text-[#A67B5B]" />
        </div>
        <h3 className="font-medium mb-1">Current Balance</h3>
        <div className="text-3xl font-bold text-[#A67B5B] mb-2">
          ${isLoading ? "..." : balance.toFixed(2)}
        </div>
        <p className="text-sm text-gray-600">
          {role === "client" 
            ? "Available for purchases and withdrawals" 
            : "Available for withdrawals"}
        </p>
      </div>

      {/* Operation Info */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-medium mb-3 text-center">Account Operations</h3>
        
        {role === "client" ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
              <div className="bg-[#A67B5B] p-2 rounded-full">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium">Deposit</h4>
                <p className="text-sm text-gray-600">Add funds to your balance using PayPal</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
              <div className="bg-[#A67B5B] p-2 rounded-full">
                <ArrowDownRight className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium">Withdraw</h4>
                <p className="text-sm text-gray-600">Transfer funds from your balance to PayPal</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
            <div className="bg-[#A67B5B] p-2 rounded-full">
              <ArrowDownRight className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium">Withdraw</h4>
              <p className="text-sm text-gray-600">Transfer funds from your balance to PayPal</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <p className="mb-1 font-medium">Secure Transactions</p>
        <p>All financial operations are processed securely through PayPal's payment system.</p>
      </div>
    </div>
  )
}

export default OrderSummary

