import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import './PaymentResult.css';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/customer');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

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
