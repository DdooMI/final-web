import { ShoppingBag, Wallet } from "lucide-react"
import { useEffect } from "react"
import { useAuth } from "../zustand/auth"
import { useBalance } from "../zustand/balance"

const OrderSummary = () => {
  // Empty order items array
  const orderItems = []
  const { user } = useAuth()
  const { balance, fetchBalance, isLoading } = useBalance()

  useEffect(() => {
    if (user && user.uid) {
      fetchBalance(user.uid)
    }
  }, [user, fetchBalance])

  // Set fixed total for demo purposes
  const subtotal = 0
  const shipping = 0
  const tax = 0
  const total = 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h2 className="text-xl font-semibold mb-4">Project Summary</h2>

      {/* Client Balance Section */}
      <div className="mb-6 p-4 bg-[#F5EFE7] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-[#A67B5B]" />
            <span className="font-medium">Your Balance</span>
          </div>
          <span className="font-bold text-lg">${isLoading ? "..." : balance.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-600">Available for your purchases</p>
      </div>

      <div className="mb-6">
        {orderItems.length > 0 ? (
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-4">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No items in cart</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-bold text-xl">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 flex items-center">
        <ShoppingBag className="h-4 w-4 mr-1" />
        <span>Free shipping on all orders</span>
      </div>
    </div>
  )
}

export default OrderSummary

