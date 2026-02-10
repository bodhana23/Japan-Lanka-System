import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import './PaymentResult.css';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // Countdown timer - decrements every second
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Navigate when countdown reaches 0 (separate effect to avoid state update during render)
  useEffect(() => {
    if (countdown === 0) {
      navigate('/customer');
    }
  }, [countdown, navigate]);

  return (
    <div className="payment-result-container">
      <div className="payment-result-card success">
        <div className="payment-result-icon success">
          <CheckCircle size={64} />
        </div>
        <h1 className="payment-result-title">Payment Successful</h1>
        <p className="payment-result-message">
          Your payment was completed successfully. Your order has been confirmed and will be processed shortly.
        </p>
        <div className="payment-info-box">
          <div className="info-row">
            <CreditCard size={18} />
            <span>Payment confirmed via PayHere</span>
          </div>
          <div className="info-row">
            <Truck size={18} />
            <span>You will receive updates on your order status</span>
          </div>
        </div>
        <button
          className="payment-result-button primary"
          onClick={() => navigate('/customer')}
        >
          <ShoppingBag size={20} />
          Go to My Orders
        </button>
        <p className="redirect-notice">
          Redirecting in {countdown} seconds...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
