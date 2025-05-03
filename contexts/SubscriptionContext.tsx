
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { 
  subscriptionService, 
  Subscription, 
  SubscriptionEntityType,
  SubscriptionCreateParams 
} from '../services/subscriptionService';


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


export const SubscriptionProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  
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

  
  const isSubscribed = (entityId: string, entityType: SubscriptionEntityType): boolean => {
    return subscriptions.some(sub => 
      sub.entityId === entityId && sub.entityType === entityType
    );
  };

  
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
      
      
      await fetchSubscriptions();
      
      
      return true;
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast.error(`Failed to subscribe to ${entityType}`);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  
  const unsubscribe = async (entityId: string, entityType: SubscriptionEntityType): Promise<boolean> => {
    if (!user) return false;

    
    const subscription = subscriptions.find(sub => 
      sub.entityId === entityId && sub.entityType === entityType
    );

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    try {
      setIsLoading(true);
      await subscriptionService.deleteSubscription(subscription.id);
      
      
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscription.id));
      
      toast.success(`Successfully unsubscribed from ${entityType}`);
      return true;
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast.error(`Failed to unsubscribe from ${entityType}`);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  
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
      
      throw error;
    }
  };

  
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


export const useSubscription = () => useContext(SubscriptionContext);

