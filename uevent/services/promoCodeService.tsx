import axios from 'axios';
import { PromoCode } from '../contexts/PromoCodeContext';

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

// PromoCode service methods
export const promoCodeService = {
  // Get all promo codes for an event
  async getPromoCodesByEventId(eventId: number): Promise<PromoCode[]> {
    try {
      const response = await axios.get(`${API_URL}/events/${eventId}/promo-codes`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching promo codes for event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get promo code by ID
  async getPromoCodeById(id: number): Promise<PromoCode> {
    try {
      const response = await axios.get(`${API_URL}/promo-codes/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching promo code with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new promo code for an event
  async createPromoCode(eventId: number, promoCodeData: Partial<PromoCode>): Promise<PromoCode> {
    try {
      const response = await axios.post(`${API_URL}/events/${eventId}/promo-codes`, promoCodeData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating promo code:', error);
      throw error;
    }
  },

  // Update an existing promo code
  async updatePromoCode(id: number, promoCodeData: Partial<PromoCode>): Promise<PromoCode> {
    try {
      const response = await axios.patch(`${API_URL}/promo-codes/${id}`, promoCodeData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating promo code:', error);
      throw error;
    }
  },

  // Validate a promo code for an event
  async validatePromoCode(eventId: number, code: string): Promise<{ discountPercent: number }> {
    try {
      const response = await axios.post(
        `${API_URL}/promo-codes/validate`, 
        { eventId, code }, 
        getAuthHeaders()
      );
      
      // Extract the discount percent from the nested structure
      return {
        discountPercent: response.data.promoCode?.discountPercent || 0
      };
    } catch (error) {
      // Extract and propagate the error message from the server
      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        const errorMessage = serverError.message || 'Failed to validate promo code';
        
        // Create a custom error with the server message
        const customError = new Error(errorMessage);
        throw customError;
      }
      
      // For other types of errors, just propagate them
      console.error('Error validating promo code:', error);
      throw error;
    }
  }
  
};