import React, { useEffect, useState } from 'react';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
TicketsSkeletonLoader
import TicketsSkeletonLoader from './TicketsSkeletonLoader';
import { toast } from 'react-toastify';
import {
  CheckCircle,
  Clock,
  XCircle,
  CalendarDays,
  MapPin,
  CreditCard,
  Ticket,
  ChevronDown,
  Eye,
  AlertCircle,
  Lock
} from 'lucide-react';
// Define types based on the actual API response structure
interface Ticket {
  id: number;
  title: string;
  price: number;
  number: string;
  event: {
    id: number;
    title: string;
    startedAt: string;
    endedAt: string;
    posterName: string;
  };
}

interface OrderItem {
  id: number;
  finalPrice: number;
  ticket: Ticket;
  quantity?: number; // Adding quantity in case it exists
}

interface Order {
  id: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'PAID';
  paymentMethod: string;
  createdAt: string;
  orderItems: OrderItem[];
}

// Helper function to format dates
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit',
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Helper function to format time
const formatTime = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

// Status color mapping
const statusColors = {
  PENDING: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock className="h-4 w-4" />
  },
  PAID: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle className="h-4 w-4" />
  },
  COMPLETED: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle className="h-4 w-4" />
  },
  FAILED: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="h-4 w-4" />
  },
  CANCELED: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-800 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
    icon: <XCircle className="h-4 w-4" />
  }
};

// Props interface to accept user data
interface MyTicketsSectionProps {
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    profilePictureUrl?: string;
  };
}

const MyTicketsSection: React.FC<MyTicketsSectionProps> = ({ user }) => {
  const { getUserOrders, orders: contextOrders, isLoading, error, cancelOrder } = useOrders();
  const { user: authUser } = useAuth(); // Fallback to Auth context if no user prop is provided
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);

  // Use the user prop if provided, otherwise fallback to auth context
  const currentUser = user || authUser;

  // Cast to match our expected format - the actual data structure in the API response
  const orders = contextOrders as unknown as Order[];

  useEffect(() => {
    if (currentUser?.id) {
      fetchOrders(currentUser.id);
    } else {
      console.error('User ID not available');
      toast.error('Unable to fetch orders: User information not available');
    }
  }, [currentUser]);

  const fetchOrders = async (userId: number) => {
    try {
      await getUserOrders(userId);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load your tickets. Please try again.');
    }
  };

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setCancelingOrderId(orderId);
      try {
        const result = await cancelOrder(orderId);
        if (result.success) {
          toast.success('Order cancelled successfully');
        } else {
          toast.error(result.message || 'Failed to cancel order');
        }
      } catch (error) {
        console.error('Error canceling order:', error);
        toast.error('Failed to cancel order. Please try again.');
      } finally {
        setCancelingOrderId(null);
      }
    }
  };

  // Show loading state if loading or no user is available yet
  if (isLoading || !currentUser) {
    return <TicketsSkeletonLoader />;
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800 p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Tickets</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => currentUser?.id && fetchOrders(currentUser.id)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Tickets Yet</h3>
          <p className="text-gray-600 dark:text-gray-200 text-center max-w-md mb-8">
            You don't have any purchased tickets yet. Start exploring available events!
          </p>

          <div className="flex space-x-4">
            <Link href="/events" className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Explore Events
            </Link>

            <Link href="/events/popular" className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Popular Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get the event from the order
  const getEventFromOrder = (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) return null;
    if (!order.orderItems[0].ticket || !order.orderItems[0].ticket.event) return null;
    return order.orderItems[0].ticket.event;
  };

  // Count total tickets in an order
  const countTickets = (orderItems: OrderItem[]) => {
    return orderItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Orders</h3>
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {orders.map((order) => {
            // Ensure orderItems is an array
            const orderItems = order.orderItems || [];
            // Get event info from the first item (assuming all items belong to the same event)
            const event = getEventFromOrder(order);
            // Count total tickets
            const ticketCount = countTickets(orderItems);
            // Check if payment is completed
            const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED';
            
            return (
              <div key={order.id} className="p-0">
                {/* Redesigned Order Card */}
                <div className="rounded-lg overflow-hidden">
                  {/* Order Header */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center mb-2 md:mb-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mr-3">
                          Order #{order.id}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold 
                          ${statusColors[order.paymentStatus || 'PENDING'].bg} 
                          ${statusColors[order.paymentStatus || 'PENDING'].text}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          {order.paymentMethod}
                        </div>
                        <div className="flex items-center font-semibold text-gray-900 dark:text-white">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Total:</span>
                          ${order.totalAmount?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event and Tickets Info */}
                  <div className="p-6 bg-white dark:bg-black">
                    {/* Event Information */}
                    {event && (
                      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 mb-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-800/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                          
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formatDate(event.startedAt)} · {formatTime(event.startedAt)}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Virtual Event</span>
                            </div>
                          </div>
                        </div>
                        
                        <Link 
                          href={`/events/${event.id}`}
                          className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Event
                        </Link>
                      </div>
                    )}

                    {/* Tickets Section - Always visible information */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <div 
                        className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                        onClick={() => toggleOrderExpand(order.id as number)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span className="text-base font-semibold">{ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-2 transition-transform duration-200 ${expandedOrders[order.id as number] ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
{(order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') && (
  <div className="flex flex-col md:flex-row gap-2">
    <Link 
      href={`/stripe/payment/${order.id}`}
      className="mt-3 md:mt-0 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm"
    >
      <CreditCard className="h-4 w-4 mr-1.5" />
      {order.paymentStatus === 'FAILED' ? 'Retry Payment' : 'Complete Payment'}
    </Link>
  </div>
)}
                    </div>

                    {/* Expanded Tickets List */}
                    {expandedOrders[order.id as number] && (
                      <div className="mt-4 space-y-3 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ticket Details</h5>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead>
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket Type</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Number</th>
                                <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                              {orderItems.map((item, index) => (
                                <tr key={item.id || index} className="hover:bg-gray-100 dark:hover:bg-gray-900/40 transition-colors">
                                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {item.ticket.title}
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-mono">{item.ticket.number}</span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                                    {item.quantity || 1}
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                                    ${(item.finalPrice || item.ticket.price || 0).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                                    {isPaid ? (
                                      // Show view ticket button if payment is completed
                                      <Link 
                                        href={`/orders/${order.id}/items/${item.id}/ticket`}
                                        target="_blank"
                                        className="inline-flex items-center justify-center p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
                                        title="View Ticket"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    ) : (
                                      // Show a disabled button with a different style if payment is not completed
                                      <div 
                                        className="inline-flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
                                        title="Payment required to view ticket"
                                      >
                                        <Lock className="h-4 w-4" />
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsSection;