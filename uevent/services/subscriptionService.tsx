import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};


export type SubscriptionEntityType = 'event' | 'company';


export interface Subscription {
  id: string;
  userId?: string;
  entityId: string;
  entityType: SubscriptionEntityType;
  createdAt: string;


}

export interface SubscriptionCreateParams {
  entityId: string;
  entityType: SubscriptionEntityType;
}


export const subscriptionService = {

  async getUserSubscriptions(): Promise<Subscription[]> {
    try {

      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      

      const [eventSubs, companySubs] = await Promise.all([
        this.getUserEventSubscriptions(userId),
        this.getUserCompanySubscriptions(userId)
      ]);
      

      return [...eventSubs, ...companySubs];
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }
  },


  async getUserEventSubscriptions(userId: string): Promise<Subscription[]> {
    const response = await axios.get(
      `${API_URL}/users/${userId}/subscriptions/events`, 
      getAuthHeaders()
    );
    

    return response.data.map((sub: any) => ({
      ...sub,
      entityType: 'event',
      entityId: sub.eventId || sub.entityId
    }));
  },


  async getUserCompanySubscriptions(userId: string): Promise<Subscription[]> {
    const response = await axios.get(
      `${API_URL}/users/${userId}/subscriptions/companies`, 
      getAuthHeaders()
    );
    

    return response.data.map((sub: any) => ({
      ...sub,
      entityType: 'company',
      entityId: sub.companyId || sub.entityId
    }));
  },


  async createSubscription(params: SubscriptionCreateParams): Promise<Subscription> {
    const response = await axios.post(
      `${API_URL}/subscriptions`, 
      params, 
      getAuthHeaders()
    );
    return response.data;
  },


  async deleteSubscription(id: string): Promise<void> {
    await axios.delete(
      `${API_URL}/subscriptions/${id}`, 
      getAuthHeaders()
    );
  },


  getCurrentUserId(): string | null {


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

