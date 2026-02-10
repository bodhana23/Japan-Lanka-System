import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import './PaymentResult.css';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-result-container">
      <div className="payment-result-card cancel">
        <div className="payment-result-icon cancel">
          <XCircle size={64} />
        </div>
        <h1 className="payment-result-title">Payment Cancelled</h1>
        <p className="payment-result-message">
          You cancelled the payment.
        </p>
        <button
          className="payment-result-button secondary"
          onClick={() => navigate('/checkout')}
        >
          <ArrowLeft size={20} />
          Return to Checkout
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
