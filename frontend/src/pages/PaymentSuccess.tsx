import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import './PaymentResult.css';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-result-container">
      <div className="payment-result-card success">
        <div className="payment-result-icon success">
          <CheckCircle size={64} />
        </div>
        <h1 className="payment-result-title">Payment Successful</h1>
        <p className="payment-result-message">
          Your payment was completed successfully.
        </p>
        <button
          className="payment-result-button primary"
          onClick={() => navigate('/customer')}
        >
          <ShoppingBag size={20} />
          Go to My Orders
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
