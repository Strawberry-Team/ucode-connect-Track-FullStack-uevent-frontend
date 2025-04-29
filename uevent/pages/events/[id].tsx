import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useRef } from 'react';
import { User, UserPlus, Eye, EyeOff, Shield } from 'lucide-react';
import { Calendar, Clock, MapPin, Users, Tag, Share2, Edit, ExternalLink, ChevronLeft, Ticket, Heart, Newspaper, Trash2 } from 'lucide-react';
import { useEvents } from '../../contexts/EventContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import EventSubscribeButton from '../../components/EventSubscribeButton';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import EventAttendeesSection from '../../components/EventAttendeesSection';
import CompanyEventsSection from '../../components/CompanyEventsSection';
import SimilarEventsSection from '../../components/SimilarEventsSection';
import { usePromoCodes } from '../../contexts/PromoCodeContext';
import { useOrders } from '../../contexts/OrderContext';

import DisqusComments from "../../components/DisqusComments";
import { X, Plus, Minus, Check, AlertCircle, CreditCard } from 'lucide-react';
const EventDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { 
    getEventById, 
    isLoading: isEventLoading, 
    getEventNews, 
    createEventNews, 
    updateEventNews, 
    deleteEventNews,
    getEventAttendees,
    updateAttendeeVisibility,
    getTicketTypes // Add this
  } = useEvents();
  
  // Add these context hooks
  const { validatePromoCode } = usePromoCodes();
  const { createOrder } = useOrders();
  const [event, setEvent] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isEventAuthor, setIsEventAuthor] = useState(false);
  const [isCheckingAuthor, setIsCheckingAuthor] = useState(true);


  // Add these state variables with your other state variables (at the top)
const [ticketTypes, setTicketTypes] = useState([]);
const [selectedTickets, setSelectedTickets] = useState({});
const [promoCode, setPromoCode] = useState('');
const [validPromoCode, setValidPromoCode] = useState(null);
const [isValidatingPromo, setIsValidatingPromo] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [paymentMethod, setPaymentMethod] = useState('STRIPE');
const [subtotal, setSubtotal] = useState(0);
const [discount, setDiscount] = useState(0);
const [total, setTotal] = useState(0);
const ticketsLoadedRef = useRef(false);
    // News editing states
    const [editingNews, setEditingNews] = useState(null);
    const [newNewsForm, setNewNewsForm] = useState({ title: '', description: '' });
  // Placeholder for actual countdown logic
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [news, setNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
// 1. Add these new state variables at the top of the component with the other state variables:
const [attendees, setAttendees] = useState([]);
const [attendeesLoading, setAttendeesLoading] = useState(false);
const [currentUserAttendee, setCurrentUserAttendee] = useState(null);
const [canViewAttendees, setCanViewAttendees] = useState(false);
const attendeesLoadedRef = useRef(false);
  const confirmDeleteNews = (newsId) => {
    setNewsToDelete(newsId);
    setDeleteModalOpen(true);
  };
    // Execute the actual deletion after confirmation
  const executeDeleteNews = async () => {
    if (!id || !newsToDelete) return;
    
    try {
      setIsNewsLoading(true);
      await deleteEventNews(Number(id), newsToDelete);
      
      setNews(news.filter(item => item.id !== newsToDelete));
      toast.success('News deleted successfully');
    } catch (error) {
      toast.error('Failed to delete news');
    } finally {
      setIsNewsLoading(false);
      setDeleteModalOpen(false);
      setNewsToDelete(null);
    }
  };

  // Check if the current user is the event author by checking their company
  useEffect(() => {
    const checkIfEventAuthor = async () => {
      if (!user || !event) {
        setIsEventAuthor(false);
        setIsCheckingAuthor(false);
        return;
      }
      
      try {
        setIsCheckingAuthor(true);
        // Fetch the user's company information
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:8080/api/users/${user.id}/companies`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const userCompanies = response.data;
        
        // Check if any of the user's companies match the event's company
        const isAuthor = userCompanies.some(company => company.id === event.companyId);
        setIsEventAuthor(isAuthor);
      } catch (error) {
        console.error('Error checking if user is event author:', error);
        setIsEventAuthor(false);
      } finally {
        setIsCheckingAuthor(false);
      }
    };
    
    if (user && event) {
      checkIfEventAuthor();
    } else {
      setIsEventAuthor(false);
      setIsCheckingAuthor(false);
    }
  }, [user, event]);

// Fetch ticket types when modal opens
useEffect(() => {
  if (purchaseModalOpen && event?.id && !ticketsLoadedRef.current) {
    fetchTicketTypes();
    ticketsLoadedRef.current = true;
  }
  
  // Reset the ref when modal closes
  if (!purchaseModalOpen) {
    ticketsLoadedRef.current = false;
  }
}, [purchaseModalOpen, event?.id]);

// Calculate prices whenever selected tickets or promo code changes
useEffect(() => {
  calculatePrices();
}, [selectedTickets, validPromoCode]);

// Fetch available ticket types
const fetchTicketTypes = async () => {
  try {
    const types = await getTicketTypes(event.id);
    setTicketTypes(types);
    
    // Initialize selected tickets
    const initialSelected = {};
    types.forEach(type => {
      initialSelected[type.title] = 0;
    });
    setSelectedTickets(initialSelected);
  } catch (error) {
    console.error('Error fetching ticket types:', error);
    toast.error('Failed to load available tickets');
  }
};

// Handle quantity changes
const handleQuantityChange = (ticketTitle, change) => {
  setSelectedTickets(prev => {
    const currentQty = prev[ticketTitle] || 0;
    const newQty = Math.max(0, currentQty + change);
    
    // Find this ticket type to check available count
    const ticketType = ticketTypes.find(t => t.title === ticketTitle);
    if (ticketType && newQty > ticketType.count) {
      toast.warning(`Only ${ticketType.count} ${ticketTitle} tickets available`);
      return prev;
    }
    
    return {
      ...prev,
      [ticketTitle]: newQty
    };
  });
};

// Validate promo code
const handleValidatePromoCode = async (e) => {
  e.preventDefault();
  if (!promoCode.trim()) {
    toast.warning('Please enter a promo code');
    return;
  }

  setIsValidatingPromo(true);
  try {
    const result = await validatePromoCode(event.id, promoCode);
    
    if (result.success && typeof result.discountPercent === 'number') {
      setValidPromoCode({
        code: promoCode,
        discountPercent: result.discountPercent
      });
      
      // Format the percentage for display (0.5 becomes 50%)
      const displayPercent = (result.discountPercent * 100).toFixed(0);
      toast.success(`Promo code applied: ${displayPercent}% discount`);
    } else {
      // Display the specific error message from the server
      toast.error(result.message || 'Invalid promo code');
      setValidPromoCode(null);
    }
  } catch (error) {
    // If something unexpected happens, still provide a good error message
    console.error('Error validating promo code:', error);
    
    // Try to extract a meaningful message
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to validate promo code';
      
    toast.error(errorMessage);
    setValidPromoCode(null);
  } finally {
    setIsValidatingPromo(false);
  }
};

// Clear promo code
const handleClearPromoCode = () => {
  setPromoCode('');
  setValidPromoCode(null);
};

// Calculate prices based on selected tickets and promo code
const calculatePrices = () => {
  let subtotalAmount = 0;

  // Calculate subtotal
  Object.keys(selectedTickets).forEach(title => {
    const quantity = selectedTickets[title];
    const ticketType = ticketTypes.find(t => t.title === title);
    if (ticketType && quantity > 0) {
      subtotalAmount += ticketType.price * quantity;
    }
  });

  // Calculate discount
  let discountAmount = 0;
  if (validPromoCode) {
    // Apply the discount percentage directly as a decimal
    // If discountPercent is 0.5, that means 50%
    discountAmount = subtotalAmount * validPromoCode.discountPercent;
  }

  // Calculate total
  const totalAmount = subtotalAmount - discountAmount;

  setSubtotal(subtotalAmount);
  setDiscount(discountAmount);
  setTotal(totalAmount);
};
// Handle form submission
const handleSubmitOrder = async (e) => {
  e.preventDefault();
  
  // Validate form
  const orderItems = Object.keys(selectedTickets)
    .filter(title => selectedTickets[title] > 0)
    .map(title => ({
      ticketTitle: title,
      quantity: selectedTickets[title]
    }));
  
  if (orderItems.length === 0) {
    toast.warning('Please select at least one ticket');
    return;
  }

  // Prepare order data
  const orderData = {
    eventId: event.id,
    paymentMethod,
    items: orderItems
  };

  // Add promo code if valid
  if (validPromoCode) {
    orderData.promoCode = validPromoCode.code;
  }

  // Submit order
  setIsSubmitting(true);
  try {
    const result = await createOrder(orderData);
    console.log('result', result);
    if (result.success) {
      toast.success('Order created successfully!');
      setPurchaseModalOpen(false);
      console.log('order id',result.order.id);
      // Redirect to payment or order confirmation page
      router.push(`/stripe/payment/${result.order.id}`);
      // Redirect to order confirmation or payment page
      // You might want to redirect to the order details page here
    }
  } catch (error) {
    console.error('Error creating order:', error);
    toast.error('Failed to create order');
  } finally {
    setIsSubmitting(false);
  }
};

// Format price to display with currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};
  useEffect(() => {
    const fetchEventAndNews = async () => {
      if (id && typeof id === 'string') {
        try {
          // Fetch event details
          const eventData = await getEventById(Number(id));
          setEvent(eventData);
          console.log('event', event);
          // Fetch event news
          const eventNews = await getEventNews(Number(id));
          setNews(eventNews);
          console.log(news);
          // Calculate countdown
          if (eventData?.startedAt) {
            const eventDate = new Date(eventData.startedAt);
            const now = new Date();
            const diff = eventDate.getTime() - now.getTime();
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            setCountdown({ days, hours, minutes });
          }
        } catch (error) {
          console.error('Error fetching event details:', error);
          toast.error('Failed to load event details');
        }
      }
    };
    
    fetchEventAndNews();
  }, [id, getEventById, getEventNews]);

  useEffect(() => {
    const fetchAttendees = async () => {
      // Skip if no event id, no event data, or we've already loaded attendees
      if (!id || !event || attendeesLoadedRef.current) return;
      
      // Early return if attendee visibility is set to NOBODY
      //if (event.attendeeVisibility === 'NOBODY') return;
      
      try {
        setAttendeesLoading(true);
        attendeesLoadedRef.current = true;
        
        const attendeesList = await getEventAttendees(Number(id));
        console.log('attendeesList', attendeesList);
        // Check if current user is an attendee
        const isUserAttendee = user && attendeesList.some(attendee => attendee.userId === user.id);
        
        // Set visibility based on event settings and user's attendee status
        let canView = false;
        if (event.attendeeVisibility === 'EVERYONE') {
          canView = true;
        } else if (event.attendeeVisibility === 'ATTENDEES_ONLY' && isUserAttendee) {
          canView = true;
        }
        
        setCanViewAttendees(canView);
        setAttendees(attendeesList);
        
        // Find and store the current user's attendee record
        if (user) {
          const userAttendee = attendeesList.find(attendee => attendee.userId === user.id);
          setCurrentUserAttendee(userAttendee || null);
        }
      } catch (error) {
        console.error('Error fetching attendees:', error);
        toast.error('Failed to load attendees');
      } finally {
        setAttendeesLoading(false);
      }
    };
    
    fetchAttendees();
  }, [id, event, user, getEventAttendees]);
  
  // 3. Add this function to handle toggling visibility
  const toggleAttendeeVisibility = async () => {
    if (!currentUserAttendee) return;
    
    try {
      setAttendeesLoading(true);
      const newVisibility = !currentUserAttendee.isVisible;
      const result = await updateAttendeeVisibility(currentUserAttendee.id, newVisibility);
      
      if (result.success) {
        // Update local state
        setCurrentUserAttendee(prev => ({ ...prev, isVisible: newVisibility }));
        setAttendees(prev => 
          prev.map(attendee => 
            attendee.id === currentUserAttendee.id 
              ? { ...attendee, isVisible: newVisibility } 
              : attendee
          )
        );
        
        toast.success(`Your profile is now ${newVisibility ? 'visible' : 'hidden'} to others`);
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setAttendeesLoading(false);
    }
  };
  
  // 4. Add helper functions for attendees display
  const getUserDisplayName = (attendee) => {
    console.log('attendeeS',attendee);
    if (!attendee.user) return 'Unknown User';
    return `${attendee.user.firstName} ${attendee.user.lastName}`;
  };
  
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/user-avatars/${path}`;
  };
  
  // 5. Create a renderAttendees function
  // First, add this new state at the component level with your other state variables
// Add this state at the component level with your other state variables
const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);

// Then modify your renderAttendees function to ensure proper visibility control
const renderAttendees = () => {
  // Early return for cases when attendees can't be viewed
  if (!canViewAttendees) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-500" />
            Attendees ({event?.attendeeCount || 0})
          </h2>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {event?.attendeeVisibility === 'ATTENDEES_ONLY' 
              ? 'Join to see attendees' 
              : 'Attendee list is private'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-xs mx-auto">
            {event?.attendeeVisibility === 'ATTENDEES_ONLY'
              ? 'Only registered participants can view the attendee list'
              : 'The organizer has made the attendee list private'}
          </p>
          
          {event?.attendeeVisibility === 'ATTENDEES_ONLY' && (
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
              Register for Event
            </button>
          )}
        </div>
      </div>
    );
  }

  // if (attendeesLoading) {
  //   return (
  //     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 p-6">
  //       <div className="flex items-center justify-between mb-4">
  //         <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
  //           <Users className="w-5 h-5 mr-2 text-emerald-500" />
  //           Attendees
  //         </h2>
  //       </div>
        
  //       <div className="flex items-center space-x-2 mb-2">
  //         {[...Array(3)].map((_, i) => (
  //           <div key={i} className="animate-pulse w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
  //         ))}
  //         <div className="animate-pulse w-16 h-16 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
  //           <div className="h-5 w-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
  //         </div>
  //       </div>
        
  //       <div className="animate-pulse h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
  //     </div>
  //   );
  // }

  // Filter attendees for display:
  // - Current user is always visible to themselves
  // - Other users are only visible if they have set isVisible to true
  const filteredAttendees = attendees.filter(attendee => 
    (user && attendee.userId === user.id) || attendee.isVisible
  );
  
  // For count display, we want to show the actual public count
  const publicAttendeeCount = attendees.filter(a => a.isVisible).length;
  
  const displayCount = 3; // Number of attendees to display directly
  const displayedAttendees = filteredAttendees.slice(0, displayCount);
  const remainingCount = Math.max(0, filteredAttendees.length - displayCount);
  
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-500" />
            Attendees ({publicAttendeeCount})
          </h2>
          
          <a href="#" className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline" onClick={(e) => {
            e.preventDefault();
            setAttendeesModalOpen(true);
          }}>
            See all
          </a>
        </div>
        
        {/* Current user visibility toggle - always show at the top if user is an attendee */}
        {currentUserAttendee && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                  {currentUserAttendee.user?.profilePictureName ? (
                    <img 
                      src={getAvatarUrl(currentUserAttendee.user.profilePictureName)} 
                      alt={getUserDisplayName(currentUserAttendee)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Your visibility
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {currentUserAttendee.isVisible 
                      ? "You're visible to everyone" 
                      : "Only you can see yourself in the list"}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleAttendeeVisibility}
                disabled={attendeesLoading}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  currentUserAttendee.isVisible
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-800/50 dark:text-emerald-300 dark:hover:bg-emerald-700/50"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {attendeesLoading ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin mr-2"></div>
                ) : currentUserAttendee.isVisible ? (
                  <Eye className="w-4 h-4 mr-1.5" />
                ) : (
                  <EyeOff className="w-4 h-4 mr-1.5" />
                )}
                {currentUserAttendee.isVisible ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>
        )}
        
        {filteredAttendees.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No attendees yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap -ml-2 -mr-2">
            {displayedAttendees.map((attendee, index) => {
              const isHost = index === 0; // Example: first person is host
              const isCurrentUser = user && attendee.userId === user.id;
              const name = getUserDisplayName(attendee);
              
              return (
                <div key={attendee.id} className="w-1/3 px-2 mb-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      {/* Avatar */}
                      <div className={`w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mx-auto ${
                         
                        isCurrentUser ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                      }`}>
                        {attendee.user?.profilePictureName ? (
                          <img 
                            src={getAvatarUrl(attendee.user.profilePictureName)} 
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-white text-lg font-medium">
                            {name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                        {/* {isHost && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Host
                          </span>
                        )} */}
                        
                        {isCurrentUser && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            You
                          </span>
                        )}
                        
                        {isCurrentUser && !attendee.isVisible && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center dark:bg-gray-700 dark:text-gray-300">
                            <EyeOff className="w-3 h-3 mr-0.5" />
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-1 w-full">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {name}
                      </h3>
                      {/* <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {attendee.user?.company || "Member"}
                      </p> */}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* "More" button if there are additional attendees */}
            {remainingCount > 0 && (
              <div className="w-1/3 px-2 mb-4">
                <div className="flex flex-col items-center text-center" onClick={() => setAttendeesModalOpen(true)}>
                  <div className="relative mb-2 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{remainingCount}</span>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer hover:underline mt-1">
                    {remainingCount} more
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Separate function for the modal
const renderAttendeesModal = () => {
  if (!attendeesModalOpen) return null;
  
  // Apply the same filtering logic from renderAttendees
  const filteredAttendees = attendees.filter(attendee => 
    (user && attendee.userId === user.id) || attendee.isVisible
  );
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={() => setAttendeesModalOpen(false)}>
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-500" />
              Event Attendees ({attendees.filter(a => a.isVisible).length})
            </h3>
            <button 
              onClick={() => setAttendeesModalOpen(false)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Current user visibility toggle in modal */}
          {currentUserAttendee && (
            <div className="px-6 pt-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 mr-3 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                      {currentUserAttendee.user?.profilePictureName ? (
                        <img 
                          src={getAvatarUrl(currentUserAttendee.user.profilePictureName)} 
                          alt={getUserDisplayName(currentUserAttendee)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Your visibility
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {currentUserAttendee.isVisible 
                          ? "You're visible to everyone" 
                          : "Only you can see yourself in the list"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleAttendeeVisibility}
                    disabled={attendeesLoading}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentUserAttendee.isVisible
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-800/50 dark:text-emerald-300 dark:hover:bg-emerald-700/50"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {attendeesLoading ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin mr-2"></div>
                    ) : currentUserAttendee.isVisible ? (
                      <Eye className="w-4 h-4 mr-1.5" />
                    ) : (
                      <EyeOff className="w-4 h-4 mr-1.5" />
                    )}
                    {currentUserAttendee.isVisible ? "Visible" : "Hidden"}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Search input */}
            {/* <div className="mb-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search attendees..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white"
                />
                <svg 
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div> */}
            
            {/* Attendees grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAttendees.map((attendee, index) => {
                const isHost = index === 0; // Example: first person is host
                const isCurrentUser = user && attendee.userId === user.id;
                const name = getUserDisplayName(attendee);
                
                return (
                  <div key={attendee.id} className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600 transition-shadow hover:shadow-md">
                    <div className="relative mb-3">
                      {/* Avatar */}
                      <div className={`w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 ${
                         
                        isCurrentUser ? 'ring-3 ring-blue-500 dark:ring-blue-400' : ''
                      }`}>
                        {attendee.user?.profilePictureName ? (
                          <img 
                            src={getAvatarUrl(attendee.user.profilePictureName)} 
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-white text-2xl font-medium">
                            {name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                        {/* {isHost && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Host
                          </span>
                        )} */}
                        
                        {isCurrentUser && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            You
                          </span>
                        )}
                        
                        {isCurrentUser && !attendee.isVisible && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center dark:bg-gray-700 dark:text-gray-300">
                            <EyeOff className="w-3 h-3 mr-0.5" />
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {name}
                      </h3>
                      {attendee.user?.company && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {attendee.user.company}
                        </p>
                      )}
                      {attendee.user?.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {attendee.user.email}
                        </p>
                      )}
                    </div>
                    
                    {/* Connect button for other users */}
                    {/* {!isHost && !isCurrentUser && (
                      <button className="mt-3 text-xs px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-full flex items-center">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                      </button>
                    )} */}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => setAttendeesModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Don't forget to add this line in your component's return statement
// {renderAttendeesModal()}

// Then in your JSX return statement, add this line to render the modal conditionally
// Somewhere near the end of your return statement, but before the closing tags:
// {renderAttendeesModal()}
  
  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };
   // Handle creating new news
   const handleCreateNews = async (e) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      setIsNewsLoading(true);
      const result = await createEventNews(Number(id), {
        title: newNewsForm.title,
        description: newNewsForm.description
      });
      
      if (result.success) {
        setNews([...news, result.news]);
        setNewNewsForm({ title: '', description: '' });
        toast.success('News created successfully');
      }
    } catch (error) {
      toast.error('Failed to create news');
    } finally {
      setIsNewsLoading(false);
    }
  };
  
  // Handle editing news
  const handleEditNews = async (e) => {
    e.preventDefault();
    if (!id || !editingNews) return;
    
    try {
      setIsNewsLoading(true);
      const result = await updateEventNews(Number(id), editingNews.id, {
        title: editingNews.title,
        description: editingNews.description
      });
      
      if (result.success) {
        setNews(news.map(item => 
          item.id === editingNews.id ? result.news : item
        ));
        setEditingNews(null);
        toast.success('News updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update news');
    } finally {
      setIsNewsLoading(false);
    }
  };
  
  // Handle deleting news
  const handleDeleteNews = async (newsId) => {
    if (!id) return;
    
    try {
      setIsNewsLoading(true);
      await deleteEventNews(Number(id), newsId);
      
      setNews(news.filter(item => item.id !== newsId));
      toast.success('News deleted successfully');
    } catch (error) {
      toast.error('Failed to delete news');
    } finally {
      setIsNewsLoading(false);
    }
  };
  
  // Format time helper
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate event duration
  const getEventDuration = () => {
    if (!event?.startedAt || !event?.endedAt) return '';
    
    const start = new Date(event.startedAt);
    const end = new Date(event.endedAt);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs > 0 ? `${diffHrs}h` : ''} ${diffMins > 0 ? `${diffMins}m` : ''}`;
  };
  
  // Get image URL with correct domain
  const getImageUrl = (path) => {
    if (!path) return null;
    
    // Check if path is already a full URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a relative path, prepend the backend URL
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/event-posters/${path}`;
  };
  
  // Get logo URL with correct domain
  const getLogoUrl = (path) => {
    if (!path) return null;
    
    // Check if path is already a full URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a relative path, prepend the backend URL
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/company-logos/${path}`;
  };
  
  if (isEventLoading  || !event) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>{event.title} | EventMaster</title>
        <meta name="description" content={event.description.substring(0, 160)} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description.substring(0, 160)} />
        {event.posterName && <meta property="og:image" content={getImageUrl(event.posterName)} />}
      </Head>
      

      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-20">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="ml-1">Back to events</span>
          </button>
        </div>
        
        {/* Event Hero Section */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 dark:from-emerald-800 dark:to-emerald-950 text-white py-12 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Event Poster */}
              <div className="md:w-1/3 lg:w-1/4 flex-shrink-0">
                <div className="rounded-xl overflow-hidden shadow-xl bg-white dark:bg-gray-800 h-auto aspect-[3/4] relative">
                  {event.posterName ? (
                    <img 
                      src={getImageUrl(event.posterName)} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <span className="text-emerald-500 dark:text-emerald-400 text-xl font-semibold text-center px-4">
                        {event.title}
                      </span>
                    </div>
                  )}
                  
                  {/* Event status badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        event.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}
                    >
                      {event.status === 'PUBLISHED' ? 'Published' : 
                        event.status === 'CANCELLED' ? 'Cancelled' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Event Info */}
              <div className="md:w-2/3 lg:w-3/4">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {event.format?.title || "Conference"}
                      </span>
                      {event.themes?.map((theme) => (
                        <span key={theme.id} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {theme.title}
                        </span>
                      ))}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
                    <p className="text-white/90 line-clamp-3 text-lg mb-6">{event.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-emerald-300" />
                        <span>{formatDate(event.startedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-emerald-300" />
                        <span>{formatTime(event.startedAt)} - {formatTime(event.endedAt)} ({getEventDuration()})</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-emerald-300" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-5 h-5 mr-2 text-emerald-300" />
                        <span>{event.attendeeVisibility === 'EVERYONE' ? 'Public' : 
                              event.attendeeVisibility === 'ATTENDEES_ONLY' ? 'Attendees Only' : 'Private'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                  {(event.status !== 'CANCELLED' && event.status !== 'FINISHED') && user && (
  <button 
    onClick={() => setPurchaseModalOpen(true)} 
    className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold shadow-md flex items-center transition-colors"
  >
    <Ticket className="w-5 h-5 mr-2" />
    Register Now
  </button>
)}
                    
                    {user && (
    <EventSubscribeButton 
      eventId={event.id.toString()} 
      className="ml-auto sm:ml-0"
    />
  )}
                    
                    {/* <button className="p-3 rounded-lg border border-white/30 bg-transparent text-white hover:bg-white/10 flex items-center transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button> */}
                    
                    {isEventAuthor && (
    <Link
      href={`/events/${event.id}/edit`}
      className="p-3 rounded-lg border border-white/30 bg-transparent text-white hover:bg-white/10 flex items-center transition-colors"
    >
      <Edit className="w-5 h-5" />
    </Link>
  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Event Countdown */}
        {event.status !== 'CANCELLED' && new Date(event.startedAt) > new Date() && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Event Starts In</h2>
                <div className="flex justify-center space-x-4 text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 w-24">
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{countdown.days}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 w-24">
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{countdown.hours}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Hours</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 w-24">
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{countdown.minutes}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* About This Event */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About This Event</h2>
                </div>
                <div className="p-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line">{event.description}</p>
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Location</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <MapPin className="w-5 h-5 mr-2 text-emerald-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{event.venue}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{event.locationCoordinates}</p>
                    </div>
                  </div>
                  
                  {/* Map Placeholder */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight="0" 
                      marginWidth="0" 
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.locationCoordinates.split(',')[1]},${event.locationCoordinates.split(',')[0]}&layer=mapnik&marker=${event.locationCoordinates.split(',')[0]},${event.locationCoordinates.split(',')[1]}`} 
                      style={{ border: 0 }}
                    ></iframe>
                  </div>
                  
                  <div className="mt-4">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.locationCoordinates)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
              {/* Event News Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <Newspaper className="w-5 h-5 mr-2 text-emerald-500" />
                    Event News
                  </h2>
                  {/* Only show Add News button if user is the event author */}
                  {isEventAuthor && (
                    <button 
                      onClick={() => setNewNewsForm({ title: '', description: '' })}
                      className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center"
                    >
                      <Plus className="w-5 h-5 mr-1" />
                      Add News
                    </button>
                  )}
                </div>
                
                {/* New News Form - Only visible if user is event author */}
                {isEventAuthor && (newNewsForm.title || newNewsForm.description) && (
                  <form onSubmit={handleCreateNews} className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        type="text"
                        placeholder="News Title"
                        value={newNewsForm.title}
                        onChange={(e) => setNewNewsForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        required
                      />
                      <textarea 
                        placeholder="News Description"
                        value={newNewsForm.description}
                        onChange={(e) => setNewNewsForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        rows={4}
                        required
                      ></textarea>
                      <div className="flex space-x-2">
                        <button 
                          type="submit" 
                          disabled={isNewsLoading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          {isNewsLoading ? 'Submitting...' : 'Create News'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setNewNewsForm({ title: '', description: '' })}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                
                {/* News List */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {news.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No news available for this event
                    </div>
                  ) : (
                    news.map((newsItem) => (
                      <div key={newsItem.id} className="p-6">
                        {isEventAuthor && editingNews?.id === newsItem.id ? (
                          <form onSubmit={handleEditNews} className="space-y-4">
                            <input 
                              type="text"
                              value={editingNews.title}
                              onChange={(e) => setEditingNews(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                              required
                            />
                            <textarea 
                              value={editingNews.description}
                              onChange={(e) => setEditingNews(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                              rows={4}
                              required
                            ></textarea>
                            <div className="flex space-x-2">
                              <button 
                                type="submit" 
                                disabled={isNewsLoading}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                {isNewsLoading ? 'Updating...' : 'Update News'}
                              </button>
                              <button 
                                type="button"
                                onClick={() => setEditingNews(null)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {newsItem.title}
                              </h3>
                              {/* Only show edit/delete buttons if user is the event author */}
                              {isEventAuthor && (
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => setEditingNews({
                                      id: newsItem.id,
                                      title: newsItem.title,
                                      description: newsItem.description
                                    })}
                                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => confirmDeleteNews(newsItem.id)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                              {newsItem.description}
                            </p>
                            {newsItem.createdAt && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Posted on: {new Date(newsItem.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {/* Confirmation Modal */}
                <DeleteConfirmationModal
                  isOpen={deleteModalOpen}
                  title="Delete News"
                  message="Are you sure you want to delete this news item? This action cannot be undone."
                  onConfirm={executeDeleteNews}
                  onCancel={() => {
                    setDeleteModalOpen(false);
                    setNewsToDelete(null);
                  }}
                />
              </div>
            </div>
            
            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Registration/Ticket Info - показывается только авторизованным пользователям */}
{user ? (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Registration</h2>
    </div>
    <div className="p-6">
      {event.status === 'CANCELLED' || event.status === 'FINISHED' ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mb-3">
            {event.status === 'CANCELLED' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {event.status === 'CANCELLED' ? 'Event Cancelled' : 'Event Finished'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {event.status === 'CANCELLED' 
              ? 'This event has been cancelled.' 
              : 'This event has already taken place.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Tickets Available From</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatDate(event.ticketsAvailableFrom)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Type</span>
              <span className="text-gray-900 dark:text-white font-medium">Conference Pass</span>
            </div>
          </div>
          
          <button 
            onClick={() => setPurchaseModalOpen(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
          >
            Register Now
          </button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Secure your spot at this event. Limited seats available.
          </p>
        </>
      )}
    </div>
  </div>
) : (
  /* Альтернативное сообщение для неавторизованных пользователей */
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Registration</h2>
    </div>
    <div className="p-6">
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-blue-300 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          Sign in to Register
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in or create an account to register for this event.
        </p>
        <div className="flex justify-center space-x-3">
          <Link 
            href="/login" 
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
          {/* <Link 
            href="/sign-up" 
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Sign Up
          </Link> */}
        </div>
      </div>
    </div>
  </div>
)}
              
              {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
  <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Stay Updated</h2>
  </div>
  <div className="p-6">
    <div className="flex items-center mb-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white">Event Updates</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Get notified about changes, news, and announcements for this event
        </p>
      </div>
    </div>
    
    <EventSubscribeButton 
  eventId={event.id.toString()} 
  className="w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-colors"
/>
  </div>
</div> */}

{/* <EventAttendeesSection eventId={id} event={event} /> */}
{ renderAttendees()}
{renderAttendeesModal()}
              {/* Organizer Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Organizer</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-4 flex-shrink-0">
                      {event.company?.logoName ? (
                        <img 
                          src={getLogoUrl(event.company.logoName)} 
                          alt={event.company?.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-semibold">
                          {event.company?.title?.charAt(0) || "O"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{event.company?.title || 'Event Organizer'}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Organizer</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href={`/companies/${event.companyId}`}
                      className="w-full py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg font-medium flex items-center justify-center transition-colors"
                    >
                      View Organizer Profile
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Share Widget */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Share This Event</h2>
                </div>
                <div className="p-6">
                  <div className="flex justify-center space-x-4">
                    {/* Facebook */}
                    <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                      </svg>
                    </button>
                    
                    {/* Twitter */}
                    <button className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z" />
                      </svg>
                    </button>
                    
                    {/* LinkedIn */}
                    <button className="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center hover:bg-blue-900 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </button>
                    
                    {/* Email */}
                    <button className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DisqusComments
                id={event.id}
                title={event.title}
                url={`${process.env.NEXT_PUBLIC_SITE_URL}/products/${event.id}`}
            />
        {/* Related Events Section */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
  {/* Company Events */}
  <CompanyEventsSection event={event} />
  
  {/* Similar Events */}
  <div className="mt-8">
    <SimilarEventsSection event={event} />
  </div>
</div>
      </main>
      {/* Ticket Purchase Modal */}
{purchaseModalOpen && (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Tickets</h2>
        <button 
          onClick={() => setPurchaseModalOpen(false)}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmitOrder}>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-9rem)]">
          {/* Ticket Types */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Available Tickets</h3>
            
            {ticketTypes.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="animate-spin mx-auto h-8 w-8 border-2 border-emerald-500 rounded-full border-t-transparent mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading available tickets...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ticketTypes.map((ticket) => (
                  <div 
                    key={ticket.title}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{ticket.title}</h4>
                      <div className="flex items-center mt-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatPrice(ticket.price)}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {ticket.count} available
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(ticket.title, -1)}
                        disabled={selectedTickets[ticket.title] <= 0}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      
                      <span className="mx-3 w-6 text-center">
                        {selectedTickets[ticket.title] || 0}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(ticket.title, 1)}
                        disabled={selectedTickets[ticket.title] >= ticket.count}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Promo Code */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Promo Code</h3>
            
            <div className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={isValidatingPromo || validPromoCode !== null}
                  placeholder="Enter promo code"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                />
                
                {validPromoCode && (
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              
              {validPromoCode ? (
                <button
                  type="button"
                  onClick={handleClearPromoCode}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-r-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleValidatePromoCode}
                  disabled={isValidatingPromo || !promoCode.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-r-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidatingPromo ? 'Validating...' : 'Apply'}
                </button>
              )}
            </div>
            
            {validPromoCode && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                <span>{validPromoCode.discountPercent}% discount applied</span>
              </div>
            )}
          </div>
          
          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Payment Method</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`border rounded-lg p-3 flex items-center cursor-pointer ${
                  paymentMethod === 'STRIPE'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onClick={() => setPaymentMethod('STRIPE')}
              >
                <div className={`w-5 h-5 rounded-full border ${
                  paymentMethod === 'STRIPE'
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-400'
                } flex items-center justify-center mr-3`}>
                  {paymentMethod === 'STRIPE' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Credit Card</span>
                </div>
              </div>
              
              
              
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            type="button"
            onClick={() => setPurchaseModalOpen(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || Object.values(selectedTickets).every(qty => qty === 0)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                <span>Complete Purchase</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </>
  );
};

export default EventDetailsPage;