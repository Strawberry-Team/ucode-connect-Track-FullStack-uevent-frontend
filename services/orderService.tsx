import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = 'http://localhost:8080/api';

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}

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


const getBlobAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    responseType: 'blob',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true
  } as AxiosRequestConfig;
};


const getCurrentUserId = (): number => {

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


export const orderService = {

  async createOrder(orderData: {
    eventId: number;
    promoCode?: string;
    paymentMethod: string;
    items: { ticketTitle: string; quantity: number }[];
  }): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/orders`, orderData, getAuthHeaders());
      return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      

      return {
        error: true,
        message: error.response?.data?.message || 'Failed to create order. Please try again.',
        statusCode: error.response?.status
      };
    }
  },


  async getOrderById(id: number): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`, getAuthHeaders());
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching order with ID ${id}:`, error);
      

      return {
        error: true,
        message: error.response?.data?.message || `Failed to fetch order #${id}. Please try again.`,
        statusCode: error.response?.status
      };
    }
  },


  async getUserOrders(userId: number): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/orders`, getAuthHeaders());
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      

      return {
        error: true,
        message: error.response?.data?.message || 'Failed to fetch your orders. Please try again.',
        statusCode: error.response?.status
      };
    }
  },


  async getEventOrders(eventId: number): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/events/${eventId}/orders`, getAuthHeaders());
      return response.data.items || [];
    } catch (error: any) {
      console.error(`Error fetching orders for event with ID ${eventId}:`, error);
      

      return {
        error: true,
        message: error.response?.data?.message || `Failed to fetch orders for event #${eventId}. Please try again.`,
        statusCode: error.response?.status
      };
    }
  },


  async updateOrderStatus(orderId: number, status: string): Promise<any> {
    try {
      const response = await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error updating status for order with ID ${orderId}:`, error);
      

      return {
        error: true,
        message: error.response?.data?.message || `Failed to update order status. Please try again.`,
        statusCode: error.response?.status
      };
    }
  },


  async processPayment(orderId: number, paymentData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/orders/${orderId}/payment`,
        paymentData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error processing payment for order with ID ${orderId}:`, error);
      

      return {
        error: true,
        message: error.response?.data?.message || `Failed to process payment. Please try again.`,
        statusCode: error.response?.status
      };
    }
  },


  async cancelOrder(orderId: number): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error canceling order with ID ${orderId}:`, error);
      

      return {
        error: true,
        message: error.response?.data?.message || `Failed to cancel order. Please try again.`,
        statusCode: error.response?.status
      };
    }
  },


  async getTicketPdf(orderId: number, itemId: number): Promise<any> {
    try {
      const response = await axios.get(
        `${API_URL}/orders/${orderId}/items/${itemId}/ticket`, 
        getBlobAuthHeaders()
      );
      

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error(`Error fetching ticket PDF for order ${orderId}, item ${itemId}:`, error);
      

      if (error.response && error.response.data instanceof Blob) {
        const blob = error.response.data;
        

        if (blob.type.includes('application/json')) {
          try {

            const text = await blob.text();
            const errorData = JSON.parse(text) as ApiError;
            

            const isPaymentRequired = 
              error.response.status === 403 && 
              errorData.message && 
              errorData.message.includes('payment');
            
            return {
              error: true,
              message: errorData.message || 'Failed to load ticket.',
              statusCode: errorData.statusCode || error.response.status,
              paymentRequired: isPaymentRequired
            };
          } catch (jsonError) {

            return {
              error: true,
              message: 'Failed to load ticket. Please try again later.',
              statusCode: error.response.status
            };
          }
        }
      }
      

      let errorMessage = 'Failed to load ticket. Please try again.';
      let paymentRequired = false;
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in and try again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You don\'t have permission to view this ticket. Payment may be required.';
          paymentRequired = true;
        } else if (error.response.status === 404) {
          errorMessage = 'Ticket not found. Please check the ticket details.';
        }
      }
      

      return {
        error: true,
        message: errorMessage,
        statusCode: error.response?.status,
        paymentRequired: paymentRequired
      };
    }
  }
};

