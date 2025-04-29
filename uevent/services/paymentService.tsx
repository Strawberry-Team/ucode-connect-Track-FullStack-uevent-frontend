import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:8080/api';

// Helper function to get auth headers
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
// Update an existing promo code
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