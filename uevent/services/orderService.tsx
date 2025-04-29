import axios from 'axios';

// API base URL
const API_URL = 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};
// Helper to get current user ID
const getCurrentUserId = (): number => {
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (!userData) {
      throw new Error('User not authenticated');
    }
    
    try {
      const user = JSON.parse(userData);
      if (!user.id) {
        throw new Error('User ID not found');
      }
      return user.id;
    } catch (error) {
      console.error('Error parsing user data:', error);
      throw new Error('Failed to get user ID');
    }
  };
// Order service methods
export const orderService = {
  // Create a new order
  async createOrder(orderData: {
    eventId: number;
    promoCode?: string;
    paymentMethod: string;
    items: { ticketTitle: string; quantity: number }[];
  }): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/orders`, orderData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get order by ID
  async getOrderById(id: number): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching order with ID ${id}:`, error);
      throw error;
    }
  },

  // Get all orders for a user - now accepts userId parameter
  async getUserOrders(userId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/orders`, getAuthHeaders());
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Get all orders for an event (admin/organizer only)
  async getEventOrders(eventId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/events/${eventId}/orders`, getAuthHeaders());
      return response.data.items || [];
    } catch (error) {
      console.error(`Error fetching orders for event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Update order status (admin/organizer only)
  async updateOrderStatus(orderId: number, status: string): Promise<any> {
    try {
      const response = await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating status for order with ID ${orderId}:`, error);
      throw error;
    }
  },

  // Process payment for an order
  async processPayment(orderId: number, paymentData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/orders/${orderId}/payment`,
        paymentData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error processing payment for order with ID ${orderId}:`, error);
      throw error;
    }
  },

  // Cancel an order
  async cancelOrder(orderId: number): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error canceling order with ID ${orderId}:`, error);
      throw error;
    }
  }
};