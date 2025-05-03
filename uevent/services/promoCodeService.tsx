import axios from 'axios';
import { PromoCode } from '../contexts/PromoCodeContext';

const API_URL = 'http://localhost:8080/api';

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


export const promoCodeService = {

  async getPromoCodesByEventId(eventId: number): Promise<PromoCode[]> {
    try {
      const response = await axios.get(`${API_URL}/events/${eventId}/promo-codes`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching promo codes for event with ID ${eventId}:`, error);
      throw error;
    }
  },


  async getPromoCodeById(id: number): Promise<PromoCode> {
    try {
      const response = await axios.get(`${API_URL}/promo-codes/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching promo code with ID ${id}:`, error);
      throw error;
    }
  },


  async createPromoCode(eventId: number, promoCodeData: Partial<PromoCode>): Promise<PromoCode> {
    try {
      const response = await axios.post(`${API_URL}/events/${eventId}/promo-codes`, promoCodeData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating promo code:', error);
      throw error;
    }
  },


  async updatePromoCode(id: number, promoCodeData: Partial<PromoCode>): Promise<PromoCode> {
    try {
      const response = await axios.patch(`${API_URL}/promo-codes/${id}`, promoCodeData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating promo code:', error);
      throw error;
    }
  },



async validatePromoCode(eventId: number, code: string): Promise<{ success: boolean, discountPercent?: number, message?: string }> {
  try {
    const response = await axios.post(
      `${API_URL}/promo-codes/validate`,
      { eventId, code },
      getAuthHeaders()
    );
        

    return {
      success: true,
      discountPercent: response.data.promoCode?.discountPercent || 0
    };
  } catch (error) {

    if (axios.isAxiosError(error) && error.response) {
      const serverError = error.response.data;
      const errorMessage = serverError.message || 'Failed to validate promo code';
            

      return {
        success: false,
        message: errorMessage
      };
    }
        

    console.error('Error validating promo code:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to validate promo code'
    };
  }
}
  
};

