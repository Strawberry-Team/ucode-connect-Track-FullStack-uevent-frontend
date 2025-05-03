import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { orderService } from '../../../services/orderService';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  RotateCcw,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

const POLLING_INTERVAL = 3000;
const POLLING_TIMEOUT = 120000;

const OrderConfirmationPage: React.FC = () => {
  const router = useRouter();
  const { id, payment_intent, payment_intent_client_secret, redirect_status } = router.query;
  const orderId = Array.isArray(id) ? id[0] : id;
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {

    const isStripeRedirect = router.query.payment_intent && router.query.redirect_status;
  
    
    const checkOrderStatus = async (): Promise<boolean> => {
      if (!orderId || typeof orderId !== 'string') {
        setError('Invalid Order ID in URL.');
        setLoading(false);
        return true;
      }

      try {
        console.log(`Checking order status for ${orderId}...`);
        const response = await orderService.getOrderById(orderId);

        const currentStatus = response.paymentStatus;
        console.log(`Received order status: ${currentStatus}`);
        setOrderStatus(currentStatus);
        setOrderDetails(response);

        const isFinalStatus = ['PAID', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(currentStatus);
        if (isFinalStatus) {
          setLoading(false);
          clearTimers();
        }
        return isFinalStatus;

      } catch (err: any) {
        console.error('Error checking order status:', err);

        if (loading) setError(err.response?.data?.message || 'Could not verify payment status.');
        setLoading(false);
        clearTimers();
        return true;
      }
    };
    if (isStripeRedirect) {
      console.log('Processing redirect from Stripe with status:', router.query.redirect_status);
      checkOrderStatus();
    }
    if (router.isReady) {
      setLoading(true);
      setError(null);
      console.log('Confirmation page loaded. Initial check...');
      checkOrderStatus().then(isFinal => {
        if (!isFinal) {
          console.log(`Status is not final (${orderStatus}), starting polling...`);
          intervalRef.current = setInterval(async () => {
            console.log('Polling order status...');
            const final = await checkOrderStatus();
            if (final) {
              console.log('Polling stopped: final status received.');
              clearTimers();
            }
          }, POLLING_INTERVAL);


          timeoutRef.current = setTimeout(() => {
            console.warn('Polling timeout reached for order', orderId);
            clearTimers();
            if (!['PAID', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(orderStatus ?? '')) {
              setError('Payment status verification timed out. Please check "My Orders" or contact support.');
            }
            setLoading(false);
          }, POLLING_TIMEOUT);
        } else {
          console.log(`Polling not needed. Initial status: ${orderStatus}, Is final: ${isFinal}, Redirect status: ${redirect_status}`);
          setLoading(false);
        }
      });
    }

    return () => {
      clearTimers();
    };
  }, [orderId, router.isReady, redirect_status]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = () => {
    switch (orderStatus) {
      case 'PAID':
        return <CheckCircle className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="h-12 w-12 text-red-500 dark:text-red-400" />;
      case 'CANCELLED':
        return <XCircle className="h-12 w-12 text-gray-500 dark:text-gray-400" />;
      case 'PENDING':
        return <Clock className="h-12 w-12 text-amber-500 dark:text-amber-400" />;
      case 'REFUNDED':
        return <RotateCcw className="h-12 w-12 text-blue-500 dark:text-blue-400" />;
      default:
        return <AlertCircle className="h-12 w-12 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (orderStatus) {
      case 'PAID':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'FAILED':
        return 'text-red-600 dark:text-red-400';
      case 'CANCELLED':
        return 'text-gray-600 dark:text-gray-400';
      case 'PENDING':
        return 'text-amber-600 dark:text-amber-400';
      case 'REFUNDED':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBg = () => {
    switch (orderStatus) {
      case 'PAID':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'FAILED':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'CANCELLED':
        return 'bg-gray-100 dark:bg-gray-800';
      case 'PENDING':
        return 'bg-amber-100 dark:bg-amber-900/30';
      case 'REFUNDED':
        return 'bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusHeading = () => {
    switch (orderStatus) {
      case 'PAID':
        return 'Payment Successful!';
      case 'FAILED':
        return 'Payment Failed';
      case 'CANCELLED':
        return 'Order Cancelled';
      case 'PENDING':
        return 'Payment Processing';
      case 'REFUNDED':
        return 'Payment Refunded';
      default:
        return 'Verifying Status';
    }
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case 'PAID':
        return `Thank you! Your tickets for order #${orderId} are confirmed.`;
      case 'FAILED':
        return `Payment for order #${orderId} could not be processed. Your ticket reservation has been cancelled. Please try creating a new order.`;
      case 'CANCELLED':
        return `Order #${orderId} was cancelled.`;
      case 'PENDING':
        return `Your payment for order #${orderId} is still processing. This page will update automatically. If not, please check "My Orders" shortly.`;
      case 'REFUNDED':
        return `Your payment for order #${orderId} has been refunded.`;
      default:
        return `Checking the final status for order #${orderId}.`;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-3 border-emerald-200 dark:border-emerald-900/30 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-3 border-transparent border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
            </div>
            <p className="mt-5 text-gray-600 dark:text-gray-300 font-medium">Verifying payment status...</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This will only take a moment</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="text-center p-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Verification Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                href="/profile"
                className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-lg transition-all shadow-md"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                View My Orders
              </Link>
              <Link 
                href="/ucode-connect-Track-FullStack-uevent-frontend/public"
                className="inline-flex items-center px-5 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
              >
                Browse Events
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className={`p-6 ${getStatusBg()}`}>
          <div className="flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
              {getStatusIcon()}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-2 text-center ${getStatusColor()}`}>
            {getStatusHeading()}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            {getStatusMessage()}
          </p>
          
          {orderStatus === 'PAID' && orderDetails && (
            <div className="border-t border-b border-gray-100 dark:border-gray-700 py-4 my-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Order Date: {formatDate(orderDetails.createdAt)}
              </div>
              {orderDetails.event && (
                <div className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">
                  Event: {orderDetails.event.title}
                </div>
              )}
              {orderDetails.totalAmount && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total: ${orderDetails.totalAmount.toFixed(2)}
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Link 
              href="/profile"
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-lg transition-all shadow-md"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              View My Orders
            </Link>
            <Link 
              href="/ucode-connect-Track-FullStack-uevent-frontend/public"
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
            >
              Browse Events
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Order Confirmation | uevent</title>
        <meta name="description" content="Order confirmation details" />
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
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
              <span>Go Back</span>
            </button>
          </nav>

          {/* Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl mb-4 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/30">
              <RefreshCw className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Order Confirmation
            </h1>
            {orderId && (
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                Order <span className="font-medium text-emerald-600 dark:text-emerald-400">#{orderId}</span>
              </p>
            )}
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
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle size={16} />
                </div>
                <span className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">Payment</span>
              </div>
              
              <div className="flex-1 h-1 mx-2 bg-green-200 dark:bg-green-900/30"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center ring-2 ring-emerald-50 dark:ring-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={16} />
                </div>
                <span className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Confirmation</span>
              </div>
            </div>
          </div>

          {/* Main content */}
          {renderContent()}
        </div>
      </main>
    </>
  );
};

export default OrderConfirmationPage;

