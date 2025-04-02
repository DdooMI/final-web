"use client"

import { useState } from "react"

const CardDetailsForm = () => {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target

    // Format card number with spaces
    if (name === "cardNumber") {
      const formattedValue = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19)

      setCardDetails({ ...cardDetails, [name]: formattedValue })

      // Validate card number
      if (formattedValue.replace(/\s/g, "").length > 0 && !/^\d{4}\s\d{4}\s\d{4}\s\d{0,4}$/.test(formattedValue)) {
        setErrors({ ...errors, [name]: "Please enter a valid card number" })
      } else {
        const newErrors = { ...errors }
        delete newErrors[name]
        setErrors(newErrors)
      }
      return
    }

    // Format expiry date
    if (name === "expiryDate") {
      const formattedValue = value
        .replace(/\//g, "")
        .replace(/(\d{2})(\d{0,2})/, "$1/$2")
        .slice(0, 5)

      setCardDetails({ ...cardDetails, [name]: formattedValue })

      // Validate expiry date
      if (formattedValue.length > 0 && !/^\d{2}\/\d{2}$/.test(formattedValue)) {
        setErrors({ ...errors, [name]: "Please enter a valid date (MM/YY)" })
      } else {
        const newErrors = { ...errors }
        delete newErrors[name]
        setErrors(newErrors)
      }
      return
    }

    // Handle other fields
    setCardDetails({ ...cardDetails, [name]: value })

    // Validate CVV
    if (name === "cvv") {
      if (value.length > 0 && !/^\d{3,4}$/.test(value)) {
        setErrors({ ...errors, [name]: "CVV must be 3 or 4 digits" })
      } else {
        const newErrors = { ...errors }
        delete newErrors[name]
        setErrors(newErrors)
      }
    }

    // Validate cardholder name
    if (name === "cardholderName") {
      if (value.length > 0 && value.length < 3) {
        setErrors({ ...errors, [name]: "Please enter a valid name" })
      } else {
        const newErrors = { ...errors }
        delete newErrors[name]
        setErrors(newErrors)
      }
    }
  }

  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <input
          type="text"
          id="cardNumber"
          name="cardNumber"
          placeholder="1234 5678 9012 3456"
          value={cardDetails.cardNumber}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${
            errors.cardNumber ? "border-red-500" : "border-gray-300"
          } rounded-md focus:outline-none focus:ring-2 focus:ring-[#A67B5B]`}
        />
        {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
      </div>

      <div>
        <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          name="cardholderName"
          placeholder="John Doe"
          value={cardDetails.cardholderName}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${
            errors.cardholderName ? "border-red-500" : "border-gray-300"
          } rounded-md focus:outline-none focus:ring-2 focus:ring-[#A67B5B]`}
        />
        {errors.cardholderName && <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            placeholder="MM/YY"
            value={cardDetails.expiryDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.expiryDate ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-[#A67B5B]`}
          />
          {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            placeholder="123"
            maxLength={4}
            value={cardDetails.cvv}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.cvv ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-[#A67B5B]`}
          />
          {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
        </div>
      </div>
    </form>
  )
}

export default CardDetailsForm

