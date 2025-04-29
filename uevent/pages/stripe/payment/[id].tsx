import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import PaymentForm from '../../../components/PaymentForm';
import Link from 'next/link';
import { paymentService } from '../../../services/paymentService';
import Head from 'next/head';
import { 
  CreditCard, ArrowLeft, CheckCircle, Shield 
} from 'lucide-react';

// Global variable for Stripe Promise
let stripePromise: ReturnType<typeof loadStripe> | null = null;

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const initializePayment = async () => {
      if (!id || typeof id !== 'string') {
        if (router.isReady) {
          setError('Order ID is missing or invalid.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setClientSecret(null);

      try {
        const response = await paymentService.createPaymentIntent(id);
        console.log('response', response);
        const { clientSecret: cs, publishableKey: pk, orderDetails: details } = response;
        
        if (details) {
          setOrderDetails(details);
          setOrderStatus(details.status);
        }

        if (!stripePromise && pk) {
          stripePromise = loadStripe(pk);
        }

        if (!cs) {
          throw new Error('Client Secret not received from backend.');
        }

        setClientSecret(cs);
      } catch (err: any) {
        console.error('Error initializing payment:', err);
        setError(err.response?.data?.message || 'Failed to load payment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      initializePayment();
    }
  }, [id, router.isReady]);

  // Options for Stripe Elements
  const options: StripeElementsOptions = {
    clientSecret: clientSecret ?? undefined,
    appearance: {
      theme: 'flat',
      variables: {
        colorPrimary: '#10b981',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '12px',
        fontSizeBase: '15px',
      },
      rules: {
        '.Input': {
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e5e7eb',
          padding: '14px',
          borderRadius: '10px'
        },
        '.Input:focus': {
          boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.4)',
          borderColor: '#34d399'
        },
        '.Label': {
          marginBottom: '8px',
          fontWeight: '500',
          color: '#4b5563'
        },
        '.Error': {
          color: '#ef4444',
          marginTop: '6px'
        }
      }
    },
  };

  return (
    <>
      <Head>
        <title>Complete Payment | uevent</title>
        <meta name="description" content="Complete your payment for your event tickets" />
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950">
        <div className="container max-w-3xl mx-auto px-4 py-10">
          {/* Navigation */}
          <nav className="mb-4">
            <button 
              onClick={() => router.back()}
              className="group inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Event</span>
            </button>
          </nav>

          {/* Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl mb-4 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/30 animate-float">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Order <span className="font-medium text-emerald-600 dark:text-emerald-400">#{id}</span>
            </p>
          </header>

          {/* Steps */}
          <div className="max-w-lg mx-auto mb-8 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle size={16} />
                </div>
                <span className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">Select</span>
              </div>
              
              <div className="flex-1 h-1 mx-2 bg-green-200 dark:bg-green-900/30"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center ring-2 ring-emerald-50 dark:ring-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                  <CreditCard size={16} />
                </div>
                <span className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Payment</span>
              </div>
              
              <div className="flex-1 h-1 mx-2 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <CheckCircle size={16} />
                </div>
                <span className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">Confirmation</span>
              </div>
            </div>
          </div>

          {/* Main content */}
          {loading ? (
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <div className="relative w-16 h-16">
                  <div className="absolute top-0 left-0 w-full h-full border-3 border-emerald-200 dark:border-emerald-900/30 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-3 border-transparent border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
                </div>
                <p className="mt-5 text-gray-600 dark:text-gray-300 font-medium">Preparing payment...</p>
              </div>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Payment Error</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                <div className="flex justify-center">
                  <Link 
                    href="/profile"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-lg transition-all shadow-md"
                  >
                    View My Orders
                  </Link>
                </div>
              </div>
            </div>
          ) : !clientSecret || !stripePromise ? (
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
              <div className="p-4">
                <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Configuration Error</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">We couldn't initialize the payment form. Please try refreshing the page.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-lg transition-all shadow-md"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              {/* Payment form */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <CreditCard size={18} className="mr-2 text-emerald-500" />
                  Payment Details
                </h2>
                
                <Elements options={options} stripe={stripePromise}>
                  <PaymentForm 
                    orderId={Number(id)} 
                    clientSecret={clientSecret} 
                  />
                </Elements>
                
                <div className="mt-6">
                  {/* <div className="flex items-center justify-center my-4 space-x-4">
                    <img src="/images/visa.svg" alt="Visa" className="h-6 opacity-80" />
                    <img src="/images/mastercard.svg" alt="Mastercard" className="h-6 opacity-80" />
                    <img src="/images/amex.svg" alt="American Express" className="h-6 opacity-80" />
                    <img src="/images/discover.svg" alt="Discover" className="h-6 opacity-80" />
                  </div> */}
                  
                  <div className="flex items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <Shield size={14} className="text-emerald-500 mr-2" />
                    <span>Your payment information is encrypted and secure</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default PaymentPage;