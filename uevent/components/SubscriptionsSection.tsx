import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '../contexts/SubscriptionContext';
import { toast } from 'react-toastify';

// Company Subscription Card Component
const CompanySubscriptionCard = ({ subscription, onUnsubscribe }) => {
  const company = subscription.company;
  
  const getLogoUrl = (logoName) => {
    if (!logoName) return null;
    
    if (logoName.startsWith('http://') || logoName.startsWith('https://')) {
      return logoName;
    }
    
    return `http://localhost:8080/uploads/company-logos/${logoName}`;
  };
  
  // Generate random pastel background for companies without logo
  const generatePastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsla(${hue}, 70%, 80%, 0.2)`;
  };
  
  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md dark:shadow-none border border-gray-100 dark:border-gray-800 p-5 flex flex-col md:flex-row justify-between items-center transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800">
      <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-100 dark:bg-emerald-900/30 mr-4 flex-shrink-0 transition-transform group-hover:scale-105">
          {company?.logoName ? (
            <img 
              src={getLogoUrl(company.logoName)} 
              alt={company.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400 dark:from-emerald-600 dark:to-teal-700">
              <span className="text-xl font-bold text-white">{company?.title?.charAt(0) || "C"}</span>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{company?.title || "Company"}</h3>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
              Company
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organizer • Updates on events and news</p>
        </div>
      </div>
      
      <div className="flex space-x-3 w-full md:w-auto justify-end">
        <Link 
          href={`/companies/${company?.id}`} 
          className="px-4 py-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors font-medium"
        >
          View Profile
        </Link>
        <button 
          onClick={() => onUnsubscribe(subscription.id, 'company')}
          className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 font-medium"
        >
          Unsubscribe
        </button>
      </div>
    </div>
  );
};

// Event Subscription Card Component
const EventSubscriptionCard = ({ subscription, onUnsubscribe }) => {
  const event = subscription.event;
  
  const getPosterUrl = (posterName) => {
    if (!posterName) return null;
    
    if (posterName.startsWith('http://') || posterName.startsWith('https://')) {
      return posterName;
    }
    
    return `http://localhost:8080/uploads/event-posters/${posterName}`;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md dark:shadow-none border border-gray-100 dark:border-gray-800 p-5 flex flex-col md:flex-row justify-between items-center transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800">
      <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 mr-4 flex-shrink-0 transition-transform group-hover:scale-105">
          {event?.posterName ? (
            <img 
              src={getPosterUrl(event.posterName)} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-400 dark:from-indigo-600 dark:to-purple-700">
              <span className="text-xl font-bold text-white">{event?.title?.charAt(0) || "E"}</span>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{event?.title || "Event"}</h3>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400">
              Event
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {event?.startedAt ? formatDate(event.startedAt) : 'Date TBA'}
            </span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {event?.venue || 'Location TBA'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3 w-full md:w-auto justify-end">
        <Link 
          href={`/events/${event?.id}`} 
          className="px-4 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors font-medium"
        >
          View Event
        </Link>
        <button 
          onClick={() => onUnsubscribe(subscription.id, 'event')}
          className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 font-medium"
        >
          Unsubscribe
        </button>
      </div>
    </div>
  );
};

// Main Subscriptions Section Component
const SubscriptionsSection = () => {
  const { 
    subscriptions, 
    isLoading, 
    error, 
    fetchSubscriptions, 
    unsubscribe 
  } = useSubscription();

  const [eventSubscriptions, setEventSubscriptions] = useState([]);
  const [companySubscriptions, setCompanySubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); 

  // Load subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Separate subscriptions into events and companies when data updates
  useEffect(() => {
    if (subscriptions) {
      setEventSubscriptions(subscriptions.filter(sub => sub.entityType === 'event'));
      setCompanySubscriptions(subscriptions.filter(sub => sub.entityType === 'company'));
    }
  }, [subscriptions]);

  // Handle unsubscribe action
  const handleUnsubscribe = async (subscriptionId, entityType) => {
    try {
      const result = await unsubscribe(subscriptionId, entityType);
      if (result) {
        toast.success(`Successfully unsubscribed from ${entityType}`, {
          position: "bottom-right",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: '🔔'
        });
      } else {
        toast.error(`Failed to unsubscribe from ${entityType}`);
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('An error occurred while unsubscribing');
    }
  };

  // Calculate visible subscriptions based on active tab
  const visibleSubscriptions = activeTab === 'all' 
    ? subscriptions 
    : activeTab === 'events' 
      ? eventSubscriptions 
      : companySubscriptions;

  // Empty state component
  const EmptyState = () => (
    <div className="p-10 flex flex-col items-center justify-center">
      <div className="w-28 h-28 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-8 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Subscriptions Yet</h3>
      <p className="text-gray-600 dark:text-gray-300 text-center max-w-lg mb-10 text-lg">
        {activeTab === 'events' 
          ? "You're not subscribed to any events yet. Subscribe to events to stay updated on new information." 
          : activeTab === 'companies' 
            ? "You're not subscribed to any organizers yet. Subscribe to organizers you're interested in to stay updated on their new events!"
            : "You're not subscribed to any events or organizers yet. Subscribe to stay updated on what matters to you!"}
      </p>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-5">
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none hover:shadow-xl hover:shadow-emerald-200/30 dark:shadow-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Explore Events
        </Link>
        
        {/* <Link href="/companies" className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all shadow-sm dark:shadow-none hover:shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Browse Companies
        </Link> */}
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-10 flex flex-col justify-center items-center">
          <div className="w-16 h-16 relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-100 dark:border-emerald-900/30"></div>
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500 dark:border-emerald-400 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-300 text-lg">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Something went wrong</h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={fetchSubscriptions}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-200/50 dark:shadow-none"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
      {/* Modern Tab Navigation */}
      <div className="border-b border-gray-100 dark:border-gray-800 px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Subscriptions</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'} total
          </div>
        </div>
        
        <div className="flex space-x-1 md:space-x-2">
          <button 
            className={`px-5 py-3 font-medium text-sm rounded-t-lg transition-all ${
              activeTab === 'all' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              All
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                {subscriptions.length}
              </span>
            </div>
          </button>
          
          <button 
            className={`px-5 py-3 font-medium text-sm rounded-t-lg transition-all ${
              activeTab === 'events' 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('events')}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Events
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                {eventSubscriptions.length}
              </span>
            </div>
          </button>
          
          <button 
            className={`px-5 py-3 font-medium text-sm rounded-t-lg transition-all ${
              activeTab === 'companies' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('companies')}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              Companies
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                {companySubscriptions.length}
              </span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Subscription Cards or Empty State */}
      {visibleSubscriptions && visibleSubscriptions.length > 0 ? (
        <div className="p-6 space-y-4">
          {visibleSubscriptions.map(subscription => (
            subscription.entityType === 'event' ? (
              <EventSubscriptionCard 
                key={subscription.id} 
                subscription={subscription} 
                onUnsubscribe={handleUnsubscribe} 
              />
            ) : (
              <CompanySubscriptionCard 
                key={subscription.id} 
                subscription={subscription} 
                onUnsubscribe={handleUnsubscribe} 
              />
            )
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default SubscriptionsSection;