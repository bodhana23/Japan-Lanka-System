/**
 * PayHere Payment Gateway Configuration
 *
 * Environment Variables Required:
 * - VITE_PAYHERE_MERCHANT_ID: Your PayHere merchant ID
 * - VITE_PAYHERE_SANDBOX: Set to "true" for sandbox mode (default: true)
 *
 * Usage in .env file:
 * VITE_PAYHERE_MERCHANT_ID=your_merchant_id
 * VITE_PAYHERE_SANDBOX=true
 */

export const payhereConfig = {
  merchantId: import.meta.env.VITE_PAYHERE_MERCHANT_ID || '',
  sandbox: import.meta.env.VITE_PAYHERE_SANDBOX === 'true' || import.meta.env.VITE_PAYHERE_SANDBOX === undefined,

  // PayHere endpoints
  get checkoutUrl(): string {
    return this.sandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout';
  },

  // Callback URLs (frontend)
  returnUrl: `${window.location.origin}/payment/success`,
  cancelUrl: `${window.location.origin}/payment/cancel`,

  // Notify URL (backend) - PayHere server-to-server notification
  get notifyUrl(): string {
    // In production, this should be your public backend URL
    // For local development, you'll need a tunnel like ngrok
    return import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/payments/payhere/notify`
      : 'http://localhost:8000/api/v1/payments/payhere/notify';
  },

  // Currency (Sri Lankan Rupee)
  currency: 'LKR',
  country: 'Sri Lanka',
};

/**
 * Validate PayHere configuration
 * Call this before initiating payments
 */
export const validatePayhereConfig = (): { valid: boolean; error?: string } => {
  if (!payhereConfig.merchantId) {
    return {
      valid: false,
      error: 'PayHere Merchant ID is not configured. Set VITE_PAYHERE_MERCHANT_ID in your .env file.'
    };
  }
  return { valid: true };
};

export default payhereConfig;
