import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { orderService } from '../../../../../services/orderService';
import { useAuth } from '../../../../../contexts/AuthContext';
import { AlertCircle, ArrowLeft, Download, Loader, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { toast } from 'react-toastify';

// Define the props type
interface TicketPageProps {
  initialError?: string;
}

const TicketPage = ({ initialError }: TicketPageProps) => {
  const router = useRouter();
  const { id, itemId } = router.query;
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(initialError || null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPendingPayment, setIsPendingPayment] = useState(false);
  const [localErrorState, setLocalErrorState] = useState<{
    error: boolean;
    message: string;
    statusCode?: number;
    paymentRequired?: boolean;
  } | null>(null);

  useEffect(() => {
    // Check if we're in the browser and have query parameters
    if (typeof window !== 'undefined' && id && itemId && user) {
      fetchTicket();
    }
  }, [id, itemId, user]);

  const fetchTicket = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLocalErrorState(null);
      setIsPendingPayment(false);
      setPdfUrl(null);

      // Use the order service to fetch the ticket PDF
      const response = await orderService.getTicketPdf(
        Number(id), 
        Number(itemId)
      );
      
      // Check if the response contains an error
      if (response.error) {
        console.log('Ticket error response:', response);
        
        // Set the error message
        setError(response.message);
        
        // Check if payment is required
        if (response.paymentRequired) {
          setIsPendingPayment(true);
        }
        
        // Store complete error state
        setLocalErrorState(response);
      } 
      // No error, process the PDF blob
      else if (response.success && response.data) {
        // Create a blob URL to display the PDF
        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);
        
        setPdfUrl(url);
      }
    } catch (err) {
      // This should never happen since our service handles all errors
      console.error('Unexpected error fetching ticket:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `ticket-order-${id}-item-${itemId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const goToPayment = () => {
    if (id) {
      router.push(`/stripe/payment/${id}`);
    } else {
      toast.error("Order ID is missing");
    }
  };

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      // Save current URL for redirect after login
      const currentPath = router.asPath;
      sessionStorage.setItem('returnUrl', currentPath);
      
      router.push(`/login?returnUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, isLoading, router]);

  return (
    <>
      <Head>
        <title>Ticket | Event Platform</title>
        {/* Add special CSS to hide PDF viewer controls and remove borders */}
        <style jsx global>{`
          /* Hide PDF viewer controls and borders */
          .pdf-container iframe {
            border: none;
            background-color: transparent !important;
          }
          
          /* Remove black frame */
          .pdf-wrapper {
            background-color: white !important;
            overflow: hidden;
          }
          
          /* Hide toolbars and navigation UI in PDF viewers */
          @media print {
            .pdf-container {
              height: 100%;
              width: 100%;
            }
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button and download */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              {/* <Link
                href="/account/tickets"
                className="inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 mb-2 sm:mb-0 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Tickets
              </Link> */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                Ticket for Order #{id}
              </h1>
            </div>
            
            {pdfUrl && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 mt-3 sm:mt-0 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download Ticket
              </button>
            )}
          </div>

          {/* Content area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 p-8 bg-white rounded-xl shadow-lg">
              <Loader className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading your ticket...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 p-8 bg-white rounded-xl shadow-lg">
              <div className={`w-full max-w-md rounded-lg p-4 border ${
                isPendingPayment 
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" 
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}>
                <div className="flex">
                  <AlertCircle className={`h-5 w-5 mt-0.5 ${
                    isPendingPayment ? "text-amber-500" : "text-red-500"
                  }`} />
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      isPendingPayment 
                        ? "text-amber-800 dark:text-amber-300" 
                        : "text-red-800 dark:text-red-300"
                    }`}>
                      {isPendingPayment ? "Payment Required" : "Error Loading Ticket"}
                    </h3>
                    <div className={`mt-2 text-sm ${
                      isPendingPayment 
                        ? "text-amber-700 dark:text-amber-400" 
                        : "text-red-700 dark:text-red-400"
                    }`}>
                      <p>{error}</p>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      {isPendingPayment ? (
                        <>
                          <button
                            onClick={goToPayment}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          >
                            <CreditCard className="h-4 w-4 mr-1.5" />
                            Complete Payment
                          </button>
                          <button
                            onClick={fetchTicket}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Check Again
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={fetchTicket}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="pdf-wrapper w-full flex justify-center bg-white rounded-lg overflow-hidden shadow-md">
              {/* Full-size PDF viewer without controls or black frame */}
              <div className="pdf-container w-full max-w-3xl">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full mx-auto h-[750px]"
                  title="Ticket PDF"
                  frameBorder="0"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 p-8 bg-white rounded-xl shadow-lg">
              <AlertCircle className="h-8 w-8 text-amber-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                No ticket found. Please check if this ticket exists or if you have access to it.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Server-side props to handle initial load and SEO
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id, itemId } = context.params || {};
  
  // Validate parameters
  if (!id || !itemId) {
    return {
      props: {
        initialError: 'Invalid ticket parameters',
      },
    };
  }

  // Return the ID and itemID to the client
  return {
    props: {}, // We'll fetch the actual data client-side
  };
};

export default TicketPage;