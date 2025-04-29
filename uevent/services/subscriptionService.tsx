import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Subscription types
export type SubscriptionEntityType = 'event' | 'company';

// Basic subscription structure
export interface Subscription {
  id: string;
  userId?: string;
  entityId: string;
  entityType: SubscriptionEntityType;
  createdAt: string;
  event?: any; // For event subscriptions
  company?: any; // For company subscriptions
}

export interface SubscriptionCreateParams {
  entityId: string;
  entityType: SubscriptionEntityType;
}

// Subscription service methods
export const subscriptionService = {
  // Get all user subscriptions
  async getUserSubscriptions(): Promise<Subscription[]> {
    try {
      // Get the current user ID
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      // Get both event and company subscriptions
      const [eventSubs, companySubs] = await Promise.all([
        this.getUserEventSubscriptions(userId),
        this.getUserCompanySubscriptions(userId)
      ]);
      
      // Combine both types of subscriptions
      return [...eventSubs, ...companySubs];
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }
  },

  // Get user event subscriptions
  async getUserEventSubscriptions(userId: string): Promise<Subscription[]> {
    const response = await axios.get(
      `${API_URL}/users/${userId}/subscriptions/events`, 
      getAuthHeaders()
    );
    
    // Normalize the data structure to match our Subscription interface
    return response.data.map((sub: any) => ({
      ...sub,
      entityType: 'event',
      entityId: sub.eventId || sub.entityId
    }));
  },

  // Get user company subscriptions
  async getUserCompanySubscriptions(userId: string): Promise<Subscription[]> {
    const response = await axios.get(
      `${API_URL}/users/${userId}/subscriptions/companies`, 
      getAuthHeaders()
    );
    
    // Normalize the data structure to match our Subscription interface
    return response.data.map((sub: any) => ({
      ...sub,
      entityType: 'company',
      entityId: sub.companyId || sub.entityId
    }));
  },

  // Create new subscription
  async createSubscription(params: SubscriptionCreateParams): Promise<Subscription> {
    const response = await axios.post(
      `${API_URL}/subscriptions`, 
      params, 
      getAuthHeaders()
    );
    return response.data;
  },

  // Delete subscription
  async deleteSubscription(id: string): Promise<void> {
    await axios.delete(
      `${API_URL}/subscriptions/${id}`, 
      getAuthHeaders()
    );
  },

  // Helper method to get current user ID
  getCurrentUserId(): string | null {
    // You can implement this based on how you store the user ID
    // For example, from localStorage or your auth context
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
  },

  // Check if user is subscribed to an entity
  async isSubscribed(entityId: string, entityType: SubscriptionEntityType): Promise<boolean> {
    try {
      const subscriptions = await this.getUserSubscriptions();
      return subscriptions.some(sub => 
        sub.entityId === entityId && sub.entityType === entityType
      );
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  },

  // Find subscription by entity
  async findSubscriptionByEntity(entityId: string, entityType: SubscriptionEntityType): Promise<Subscription | null> {
    try {
      const subscriptions = await this.getUserSubscriptions();
      return subscriptions.find(sub => 
        sub.entityId === entityId && sub.entityType === entityType
      ) || null;
    } catch (error) {
      console.error('Error finding subscription:', error);
      return null;
    }
  }
};