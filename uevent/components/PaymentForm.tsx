import React, { useState, useRef, useEffect } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      setIsSubmitting(false);
      setIsLoading(false);
    };
  }, []);
  const isProcessingRef = useRef(false);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isProcessingRef.current) {
      console.log('Payment already in progress');
      return;
    }
    
    isProcessingRef.current = true;
    if (isSubmitting || isLoading) {
      console.log('Payment already in progress, ignoring duplicate submission');
      return;
    }

    if (!stripe || !elements) {
      console.log('Stripe.js has not loaded yet.');
      setErrorMessage("Payment system is not ready. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);
    setErrorMessage(null);

    console.log(`Attempting to confirm payment for order ${orderId}`);

    try {
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${window.location.origin}/orders/confirmation/${orderId}?source=stripe_redirect`,
  },
  redirect: 'if_required',
});
      if (error) {
        console.error('Stripe confirmPayment error:', error);
        setErrorMessage(error.message || 'An unexpected payment error occurred.');
        setIsLoading(false);
        setIsSubmitting(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {

        console.log('Payment succeeded immediately (no redirect). Redirecting to confirmation...');
        router.push(`/orders/confirmation/${orderId}?status=processing`);
      } else {
        console.log('Payment processing started, waiting for redirect or completion...');
        
        setTimeout(() => {
          if (isSubmitting) {
            console.warn('Expected redirect did not occur');
            setErrorMessage('Payment processing started. Please wait for the secure payment page or check your order status.');
            setIsLoading(false);
            setIsSubmitting(false);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Unexpected error during payment processing:', err);
      setErrorMessage('An unexpected error occurred. Please try again or use a different payment method.');
      setIsLoading(false);
      setIsSubmitting(false);
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
        disabled={isLoading || isSubmitting || !stripe || !elements}
        onClick={() => {
          event.currentTarget.disabled = true;
        }}
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

