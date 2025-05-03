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

export const paymentService = {

  async createPaymentIntent(orderId: number) {
    try {
      const response = await axios.post(`${API_URL}/payments/stripe/payment-intents`, {orderId}, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating promo code:', error);
      throw error;
    }
  },
};

