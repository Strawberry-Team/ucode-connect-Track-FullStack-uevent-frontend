// contexts/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { 
  subscriptionService, 
  Subscription, 
  SubscriptionEntityType,
  SubscriptionCreateParams 
} from '../services/subscriptionService';

// Define the context type
type SubscriptionContextType = {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  isSubscribed: (entityId: string, entityType: SubscriptionEntityType) => boolean;
  subscribe: (entityId: string, entityType: SubscriptionEntityType) => Promise<boolean>;
  unsubscribe: (entityId: string, entityType: SubscriptionEntityType) => Promise<boolean>;
  toggleSubscription: (entityId: string, entityType: SubscriptionEntityType) => Promise<boolean>;
};

// Create the context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscriptions: [],
  isLoading: false,
  error: null,
  fetchSubscriptions: async () => {},
  isSubscribed: () => false,
  subscribe: async () => false,
  unsubscribe: async () => false,
  toggleSubscription: async () => false,
});

// Provider component
export const SubscriptionProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all subscriptions for the current user
  const fetchSubscriptions = async () => {
    if (!user) {
      setSubscriptions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await subscriptionService.getUserSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to load subscriptions. Please try again.');
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is subscribed to an entity
  const isSubscribed = (entityId: string, entityType: SubscriptionEntityType): boolean => {
    return subscriptions.some(sub => 
      sub.entityId === entityId && sub.entityType === entityType
    );
  };

  // Subscribe to an entity
  const subscribe = async (entityId: string, entityType: SubscriptionEntityType): Promise<boolean> => {
    if (!user) {
      toast.warning('Please log in to subscribe');
      return false;
    }

    try {
      setIsLoading(true);
      const params: SubscriptionCreateParams = {
        entityId,
        entityType
      };
      
      const newSubscription = await subscriptionService.createSubscription(params);
      
      // Update local state - refresh subscriptions to get full data
      await fetchSubscriptions();
      
      //toast.success(`Successfully subscribed to ${entityType}`);
      return true;
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast.error(`Failed to subscribe to ${entityType}`);
      throw error; // Re-throw to allow component to handle specific errors
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from an entity
  const unsubscribe = async (entityId: string, entityType: SubscriptionEntityType): Promise<boolean> => {
    if (!user) return false;

    // Find the subscription to delete
    const subscription = subscriptions.find(sub => 
      sub.entityId === entityId && sub.entityType === entityType
    );

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    try {
      setIsLoading(true);
      await subscriptionService.deleteSubscription(subscription.id);
      
      // Update local state
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscription.id));
      
      toast.success(`Successfully unsubscribed from ${entityType}`);
      return true;
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast.error(`Failed to unsubscribe from ${entityType}`);
      throw error; // Re-throw to allow component to handle specific errors
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle subscription (subscribe/unsubscribe)
  const toggleSubscription = async (entityId: string, entityType: SubscriptionEntityType): Promise<boolean> => {
    if (!user) {
      toast.warning('Please log in to subscribe');
      return false;
    }

    const isCurrentlySubscribed = isSubscribed(entityId, entityType);
    
    try {
      if (isCurrentlySubscribed) {
        return await unsubscribe(entityId, entityType);
      } else {
        return await subscribe(entityId, entityType);
      }
    } catch (error) {
      // Let the error propagate to the component
      throw error;
    }
  };

  // Load subscriptions when user changes
  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    } else {
      setSubscriptions([]);
    }
  }, [user]);

  const value = {
    subscriptions,
    isLoading,
    error,
    fetchSubscriptions,
    isSubscribed,
    subscribe,
    unsubscribe,
    toggleSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook to use the subscription context
export const useSubscription = () => useContext(SubscriptionContext);