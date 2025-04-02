import { useEffect, useRef } from "react";
import { useAuth } from "../zustand/auth";
import { useBalance } from "../zustand/balance";

const PayPalButton = ({ amount, onSuccess, onError, onCancel }) => {
  const paypalRef = useRef();
  const { user } = useAuth();
  const { addFunds } = useBalance();

  useEffect(() => {
    // Load the PayPal SDK script
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.PAYPAL_CLIENT_ID || "sb"}&currency=USD`;
    script.addEventListener("load", () => setupPayPalButton());
    document.body.appendChild(script);

    return () => {
      // Clean up the script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [amount]);

  const setupPayPalButton = () => {
    if (window.paypal) {
      window.paypal
        .Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  description: "Add funds to your account",
                  amount: {
                    currency_code: "USD",
                    value: amount,
                  },
                },
              ],
            });
          },
          onApprove: async (data, actions) => {
            const order = await actions.order.capture();
            // Add funds to user's balance in Firestore
            if (user && user.uid) {
              const success = await addFunds(user.uid, parseFloat(amount));
              if (success) {
                onSuccess(order);
              } else {
                onError("Failed to update balance");
              }
            } else {
              onError("User not authenticated");
            }
          },
          onError: (err) => {
            console.error("PayPal Error:", err);
            onError("Payment failed. Please try again.");
          },
          onCancel: () => {
            onCancel();
          },
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          },
        })
        .render(paypalRef.current);
    }
  };

  return <div ref={paypalRef}></div>;
};

export default PayPalButton;