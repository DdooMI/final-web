import React, { useEffect, useState } from "react";
import { useAuth } from "../zustand/auth";
import { useBalance } from "../zustand/balance";

const PayPalButton = ({
  amount,
  operationType = "deposit", // "deposit" or "withdraw"
  onSuccess = () => {},
  onError = () => {},
  onCancel = () => {}
}) => {
  const { user } = useAuth();
  const { addFunds, useBalance: withdrawFunds } = useBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalButtonRendered, setPaypalButtonRendered] = useState(false);

  // Convert amount to number
  const numAmount = parseFloat(amount) || 0;

  useEffect(() => {
    // Function to load PayPal script
    const loadPayPalScript = () => {
      // First, remove any existing PayPal scripts
      const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk/js"]');
      existingScripts.forEach(script => script.remove());
      
      // Remove any existing PayPal button containers
      const existingContainers = document.querySelectorAll('.paypal-button-container');
      existingContainers.forEach(container => {
        if (container.hasChildNodes()) {
          container.innerHTML = '';
        }
      });

      // Create a new script element
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AcwO7Xi1Xmofa84Ft9c_3ud-e-tSmbtrNfMym2wkPCwHhjedIagCoZQ_W7_q9k7Y84a5ecKEuKy-Fz2y&currency=USD';
      script.async = true;
      
      // Set up script load handler
      script.onload = () => {
        console.log('PayPal script loaded successfully');
        
        // Wait a moment before rendering the button
        setTimeout(() => {
          renderPayPalButton();
        }, 100);
      };
      
      // Set up script error handler
      script.onerror = (error) => {
        console.error('PayPal script failed to load:', error);
        onError('فشل تحميل PayPal');
      };
      
      // Add the script to the document
      document.body.appendChild(script);
    };

    // Function to render the PayPal button
    const renderPayPalButton = () => {
      // Check if PayPal SDK is loaded
      if (!window.paypal || !window.paypal.Buttons) {
        console.error('PayPal SDK not loaded properly');
        onError('لم يتم تحميل PayPal بشكل صحيح');
        return;
      }
      
      // Get the container element
      const container = document.getElementById('paypal-button-container');
      if (!container) {
        console.error('PayPal button container not found');
        return;
      }
      
      // Clear the container
      container.innerHTML = '';
      
      try {
        // Create and render the PayPal button
        const button = window.paypal.Buttons({
          // Button style
          style: {
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          
          // Create order
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [{
                description: operationType === "deposit" 
                  ? "إضافة رصيد إلى حسابك" 
                  : "سحب رصيد من حسابك",
                amount: {
                  value: numAmount.toFixed(2)
                }
              }]
            });
          },
          
          // Handle approved payment
          onApprove: (data, actions) => {
            setIsProcessing(true);
            
            return actions.order.capture().then((details) => {
              console.log('Payment completed:', details);
              
              if (user && user.uid) {
                if (operationType === "deposit") {
                  addFunds(user.uid, numAmount);
                } else {
                  withdrawFunds(user.uid, numAmount);
                }
                
                onSuccess({
                  transactionId: details.id,
                  amount: numAmount,
                  orderData: details
                });
              } else {
                onError("خطأ في مصادقة المستخدم");
              }
              
              setIsProcessing(false);
            }).catch((err) => {
              console.error('Error capturing order:', err);
              setIsProcessing(false);
              onError("حدث خطأ أثناء معالجة الدفع");
            });
          },
          
          // Handle canceled payment
          onCancel: (data) => {
            console.log('Payment canceled:', data);
            onCancel("تم إلغاء الدفع");
          },
          
          // Handle errors
          onError: (err) => {
            console.error('PayPal error:', err);
            setIsProcessing(false);
            onError("حدث خطأ في عملية الدفع");
          }
        });
        
        // Render the button
        button.render(container);
        console.log('PayPal button rendered successfully');
        setPaypalButtonRendered(true);
      } catch (error) {
        console.error('Error rendering PayPal button:', error);
        onError("حدث خطأ في عرض زر PayPal");
      }
    };

    // Load the PayPal script
    loadPayPalScript();
    
    // Clean up function
    return () => {
      const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk/js"]');
      existingScripts.forEach(script => script.remove());
    };
  }, [numAmount, operationType, user, addFunds, withdrawFunds, onSuccess, onError, onCancel]);

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2c2e2f' }}>
          {operationType === "deposit" ? "إضافة رصيد عبر PayPal" : "سحب رصيد عبر PayPal"}
        </h3>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070ba' }}>
          ${numAmount.toFixed(2)}
        </div>
      </div>
      
      {/* PayPal Button Container */}
      <div style={{ position: 'relative', minHeight: '55px' }}>
        {/* Processing Overlay */}
        {isProcessing && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              padding: '10px 20px',
              backgroundColor: '#fff',
              borderRadius: '5px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              جارٍ معالجة الدفع...
            </div>
          </div>
        )}
        
        {/* PayPal Button */}
        <div 
          id="paypal-button-container" 
          className="paypal-button-container"
          style={{ 
            minHeight: '45px',
            zIndex: 1
          }}
        ></div>
        
        {/* Fallback message if button doesn't render */}
        {!paypalButtonRendered && !isProcessing && (
          <div style={{
            padding: '15px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            جارٍ تحميل خيارات الدفع...
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img 
          src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" 
          alt="PayPal" 
          style={{ height: '23px', marginRight: '8px' }} 
        />
        <span>معاملات آمنة ومشفرة</span>
      </div>
    </div>
  );
};

export default PayPalButton;
