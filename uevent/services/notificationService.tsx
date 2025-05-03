import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
};

export interface Notification {
  id: number;
  userId: number;
  eventId?: number;
  companyId?: number;
  title: string;
  content: string;
  readAt: string | null;
  hiddenAt: string | null;
  createdAt: string;
  event?: {
    id: number;
    title: string;
    logoName: string;
  };
  company?: {
    id: number;
    title: string;
    logoName: string;
  };
}

export const notificationService = {


async getUserNotifications(userId?: number): Promise<Notification[]> {
    try {
      const userIdToUse = userId || this.getCurrentUserId();
      if (!userIdToUse) throw new Error('User not authenticated');
      
      const response = await axios.get(
        `${API_URL}/users/${userIdToUse}/notifications`, 
         getAuthHeaders()
      );
      

      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      

      if (Array.isArray(response.data)) {
        return response.data;
      }
      

      console.error('Unexpected API response format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },


  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      await axios.patch(
        `${API_URL}/notifications/${notificationId}`, 
        { action: "read" },
        getAuthHeaders()
      );
      
      return true;
    } catch (error) {
      console.error('Error updating notification:', error);
      return false;
    }
  },


  async markAllAsRead(): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      await axios.patch(
        `${API_URL}/users/${userId}/notifications/mark-all-read`,
        {},
        getAuthHeaders()
      );
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },


  async getUnreadCount(): Promise<number> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return 0;

      const notifications = await this.getUserNotifications(userId);
      return notifications.filter(notification => !notification.readAt).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },


  getCurrentUserId(): number | null {
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
  }
};

