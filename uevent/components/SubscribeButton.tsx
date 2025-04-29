import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionEntityType } from '../services/subscriptionService';

interface SubscribeButtonProps {
  entityId: string;
  entityType: SubscriptionEntityType;
  className?: string;
  style?: React.CSSProperties;
}

export const SubscribeButton: React.FC<SubscribeButtonProps> = ({
  entityId,
  entityType,
  className = '',
  style = {}
}) => {
  const { user } = useAuth();
  const { isSubscribed, toggleSubscription, isLoading } = useSubscription();
  const [isSubscribedState, setIsSubscribedState] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  // Check if user is subscribed on mount and when subscriptions change
  useEffect(() => {
    if (entityId) {
      setIsSubscribedState(isSubscribed(entityId, entityType));
    }
  }, [entityId, entityType, isSubscribed]);

  const handleToggleSubscription = async () => {
    if (!user) {
      // Redirect to login or show login modal
      // This depends on your application flow
      return;
    }

    if (isToggling || isLoading || !entityId) return;

    setIsToggling(true);
    try {
      const success = await toggleSubscription(entityId, entityType);
      if (success) {
        // Toggle the local state based on the current state
        setIsSubscribedState(prev => !prev);
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggleSubscription}
      disabled={isToggling || isLoading}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
        isSubscribedState
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
          className={`h-5 w-5 ${isSubscribedState ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
          fill={isSubscribedState ? "currentColor" : "none"}
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
      <span>{isSubscribedState ? 'Subscribed' : 'Subscribe'}</span>
    </button>
  );
};

export default SubscribeButton;