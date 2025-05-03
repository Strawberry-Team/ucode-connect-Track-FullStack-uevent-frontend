import React, { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface EventSubscribeButtonProps {
  eventId: string;
  className?: string;
  style?: React.CSSProperties;
}

export const EventSubscribeButton: React.FC<EventSubscribeButtonProps> = ({
  eventId,
  className = '',
  style = {}
}) => {
  const { user } = useAuth();
  const { fetchSubscriptions } = useSubscription();
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkEventSubscriptionStatus = useCallback(async () => {
    if (!user || !eventId) {
      setIsLoading(false);
      return false;
    }
    
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        setIsLoading(false);
        return false;
      }
      
      const response = await axios.get(
        `http://localhost:8080/api/users/${userId}/subscriptions/events?eventId=${eventId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      const subscribed = response.data && response.data.length > 0;
      setIsSubscribed(subscribed);
      setIsLoading(false);
      return subscribed;
    } catch (error) {
      console.error('Error checking event subscription status:', error);
      setIsLoading(false);
      return false;
    }
  }, [user, eventId]);

  const getCurrentUserId = (): string | null => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const handleToggleSubscription = async () => {
    if (!user) {
      return;
    }

    if (isToggling || !eventId) return;

    setIsToggling(true);
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }

      if (isSubscribed) {
        const response = await axios.get(
          `http://localhost:8080/api/users/${userId}/subscriptions/events?eventId=${eventId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        if (response.data && response.data.length > 0) {
          const subscriptionId = response.data[0].id;
          
          await axios.delete(
            `http://localhost:8080/api/subscriptions/${subscriptionId}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          
          setIsSubscribed(false);
        }
      } else {
        await axios.post(
          `http://localhost:8080/api/subscriptions`,
          { entityId: eventId, entityType: 'event' },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        setIsSubscribed(true);
      }
      
      await fetchSubscriptions();
    } catch (error: any) {
      console.error('Error toggling event subscription:', error);
      
      if (error.response && error.response.status === 409) {
        setIsSubscribed(true);
      }
    } finally {
      setIsToggling(false);
    }
  };

  useEffect(() => {
    checkEventSubscriptionStatus();
  }, [checkEventSubscriptionStatus]);

  if (isLoading) {
    return (
      <button
        disabled
        className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all
          bg-gray-100 text-gray-400 border border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 ${className}`}
        style={style}
      >
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleSubscription}
      disabled={isToggling}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
        isSubscribed
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700'
      } ${className}`}
      style={style}
    >
      {isToggling ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${isSubscribed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
          fill={isSubscribed ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      )}
      <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
    </button>
  );
};

export default EventSubscribeButton;

