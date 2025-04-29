import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { StripePaymentElementOptions } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import { Lock, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  orderId: number;
  clientSecret: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ orderId, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log('Stripe.js has not loaded yet.');
      setIsLoading(false);
      setErrorMessage("Payment system is not ready. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    console.log(`Attempting to confirm payment for order ${orderId}`);

    // Step 5 -> 6: Call confirmPayment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // URL where Stripe will return the user after 3DS (or other actions)
        return_url: `${window.location.origin}/orders/confirmation/${orderId}`,
      },
      redirect: 'if_required', // Default behavior
    });

    // This code will execute ONLY if there was NO redirect (error or rare success without 3DS)
    if (error) {
      // Card validation errors, bank rejections (without 3DS), network issues, etc.
      console.error('Stripe confirmPayment error:', error);
      setErrorMessage(error.message || 'An unexpected payment error occurred.');
      setIsLoading(false); // Allow user to try again
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Very rare case for confirmPayment with redirect: 'if_required',
      // but in case success happens immediately without 3DS.
      console.log('Payment succeeded immediately (no redirect). Redirecting to confirmation...');
      // Redirect to confirmation page for backend status verification
      router.push(`/orders/confirmation/${orderId}?status=processing`);
    } else {
      // If there's no error and no 'succeeded' status, and no redirect -
      // this is an unusual situation. Consider showing a general message.
      console.warn('Unexpected state after confirmPayment without redirect:', paymentIntent);
      setErrorMessage('Payment processing started. If you are not redirected, please check your order status.');
      setIsLoading(false); // Allow user to see the message
    }
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <PaymentElement 
          id="payment-element" 
          options={paymentElementOptions} 
        />
        
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800/30 mt-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <div className="ml-2">
                <div className="text-sm text-red-700 dark:text-red-300">
                  {errorMessage}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className={`
          relative w-full py-3 px-6 mt-4
          bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700
          text-white font-medium rounded-lg 
          shadow-md shadow-emerald-500/10
          transition-all duration-200
          disabled:opacity-70 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2">
              <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
            </div>
            <span className="inline-block">Processing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="inline-block mr-2">Pay Now</span>
            <Lock className="h-4 w-4" />
          </div>
        )}
      </button>
    </form>
  );
};

export default PaymentForm;