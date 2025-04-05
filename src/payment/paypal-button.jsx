import { useEffect, useRef, useState } from "react";
import { useAuth } from "../zustand/auth";
import { useBalance } from "../zustand/balance";

const PayPalButton = ({ amount, onSuccess, onError, onCancel, operationType = "deposit" }) => {
  const paypalRef = useRef();
  const { user, role } = useAuth();
  const { addFunds, useBalance: withdrawFunds, balance } = useBalance();

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isScriptError, setIsScriptError] = useState(false);

  // Store PayPal button instance for proper cleanup
  const paypalButtonInstance = useRef(null);
  
  // Script loading should not depend on amount, operationType, or balance
  // to prevent unnecessary reloading of the PayPal SDK
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      setIsScriptLoaded(true);
      return;
    }
    
    // Load the PayPal SDK script
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=AYOI8vTTXQHl9y_-l5YWHTZod8Gy3zRx6VSShln6waqDj28moDtzPR3uRIeMibomNEvKgsHseNf5ePJ9&currency=USD`;
    script.async = true;
    
    script.addEventListener("load", () => {
      setIsScriptLoaded(true);
    });
    
    script.addEventListener("error", () => {
      setIsScriptError(true);
      onError("Failed to load PayPal SDK. Please try again later.");
    });
    
    document.body.appendChild(script);

    return () => {
      // We don't remove the script on unmount as it might be used by other components
      // and removing it could cause issues with PayPal button instances
    };
  }, []); // Only run once on component mount

  const setupPayPalButton = () => {
    // Ensure the PayPal SDK is available
    if (!window.paypal) {
      onError("PayPal SDK not available. Please refresh the page and try again.");
      return;
    }
    
    // Ensure the container element exists
    if (!paypalRef.current) {
      console.error("PayPal container element not found");
      return;
    }
    
    // Clear any existing PayPal buttons
    paypalRef.current.innerHTML = '';
    
    // Validate amount before setting up PayPal button
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      onError("Please enter a valid amount");
      return;
    }
    
    // For withdrawal, check if user has enough balance
    if (operationType === "withdraw" && numAmount > balance) {
      onError("Insufficient balance for withdrawal");
      return;
    }
    
    // Check if user is authenticated
    if (!user || !user.uid) {
      onError("You must be logged in to perform this operation");
      return;
    }
    
    try {
      // Close previous button instance if it exists
      if (paypalButtonInstance.current) {
        paypalButtonInstance.current.close();
      }
      
      // Create new button instance
      paypalButtonInstance.current = window.paypal
        .Buttons({
          createOrder: (data, actions) => {
            try {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    description: operationType === "deposit" 
                      ? "Add funds to your account" 
                      : "Withdraw funds from your account",
                    amount: {
                      currency_code: "USD",
                      value: amount,
                    },
                  },
                ],
              });
            } catch (err) {
              console.error("PayPal createOrder error:", err);
              onError("Failed to create PayPal order. Please try again.");
              return null;
            }
          },
          onApprove: async (data, actions) => {
            try {
              const order = await actions.order.capture();
              console.log("PayPal order captured:", order);
              
              // Update user's balance in Firestore based on operation type
              if (user && user.uid) {
                try {
                  let success;
                  const numAmount = parseFloat(amount); // Define numAmount here
                  
                  if (operationType === "deposit") {
                    success = await addFunds(user.uid, numAmount);
                  } else {
                    // Double-check balance again before withdrawal
                    if (numAmount > balance) {
                      onError("Insufficient balance for withdrawal");
                      return;
                    }
                    success = await withdrawFunds(user.uid, numAmount);
                  }
                  
                  if (success) {
                    onSuccess(order);
                  } else {
                    onError(operationType === "deposit" 
                      ? "Failed to add funds" 
                      : "Failed to withdraw funds");
                  }
                } catch (error) {
                  console.error("Balance update error:", error);
                  onError("Failed to update balance");
                }
              } else {
                onError("User not authenticated");
              }
            } catch (err) {
              console.error("PayPal capture error:", err);
              onError("Failed to complete payment. Please check your PayPal account and try again.");
            }
          },
          onError: (err) => {
            console.error("PayPal Error:", err);
            onError("Payment failed: " + (err.message || "Please try again later."));
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
        });
      
      // Only render if the container is still in the DOM
      if (paypalRef.current && document.body.contains(paypalRef.current)) {
        paypalButtonInstance.current.render(paypalRef.current);
      }
    } catch (err) {
      console.error("PayPal button render error:", err);
      onError("Failed to initialize PayPal. Please refresh the page and try again.");
    }
  };

  // Setup PayPal button when script is loaded and when relevant props change
  useEffect(() => {
    if (isScriptLoaded && !isScriptError && paypalRef.current) {
      // Small delay to ensure DOM is stable before rendering PayPal button
      const timer = setTimeout(() => {
        setupPayPalButton();
      }, 0);
      
      return () => {
        clearTimeout(timer);
        // Clean up PayPal button instance when component updates
        if (paypalButtonInstance.current) {
          try {
            paypalButtonInstance.current.close();
          } catch (err) {
            console.error("Error closing PayPal button:", err);
          }
        }
      };
    }
  }, [amount, operationType, balance, isScriptLoaded, user]);

  if (isScriptError) {
    return <div className="text-red-500 text-center py-4">Failed to load PayPal. Please refresh the page.</div>;
  }

  return (
    <div>
      {!isScriptLoaded && (
        <div className="text-center py-4 text-gray-500">Loading PayPal...</div>
      )}
      <div ref={paypalRef} className="paypal-button-container"></div>
    </div>
  );
};

export default PayPalButton;