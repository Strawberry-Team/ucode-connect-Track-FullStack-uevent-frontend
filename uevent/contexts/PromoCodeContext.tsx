import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { promoCodeService } from '../services/promoCodeService';

// Types
export interface PromoCode {
  id?: number;
  eventId: number;
  title: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  createdAt?: string;
}

export interface PromoCodeContextType {
  promoCodes: PromoCode[];
  isLoading: boolean;
  error: string | null;
  getPromoCodesByEventId: (eventId: number) => Promise<PromoCode[]>;
  getPromoCodeById: (id: number) => Promise<PromoCode | null>;
  createPromoCode: (eventId: number, promoCodeData: Partial<PromoCode>) => Promise<{
    success: boolean;
    promoCode?: PromoCode;
    message?: string;
  }>;
  updatePromoCode: (id: number, promoCodeData: Partial<PromoCode>) => Promise<{
    success: boolean;
    promoCode?: PromoCode;
    message?: string;
  }>;
  validatePromoCode: (eventId: number, code: string) => Promise<{
    success: boolean;
    discountPercent?: number;
    message?: string;
  }>;
}

// Create the PromoCode context
const PromoCodeContext = createContext<PromoCodeContextType | undefined>(undefined);

// Provider component
export const PromoCodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch promo codes by event ID
  const fetchPromoCodesByEventId = useCallback(async (eventId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await promoCodeService.getPromoCodesByEventId(eventId);
      setPromoCodes(data);
      return data;
    } catch (error) {
      console.error(`Error fetching promo codes for event with ID ${eventId}:`, error);
      setError(`Failed to fetch promo codes for event with ID ${eventId}`);
      toast.error('Failed to fetch promo codes');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch a specific promo code by ID
  const fetchPromoCodeById = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await promoCodeService.getPromoCodeById(id);
      return data;
    } catch (error) {
      console.error(`Error fetching promo code with ID ${id}:`, error);
      setError(`Failed to fetch promo code with ID ${id}`);
      toast.error('Failed to fetch promo code details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new promo code
  const handleCreatePromoCode = useCallback(async (eventId: number, promoCodeData: Partial<PromoCode>) => {
    setIsLoading(true);
    setError(null);
    try {
      const promoCode = await promoCodeService.createPromoCode(eventId, promoCodeData);
      setPromoCodes(prev => [...prev, promoCode]);
      toast.success('Promo code created successfully');
      return {
        success: true,
        promoCode: promoCode
      };
    } catch (error) {
      console.error('Error creating promo code:', error);
      setError('Failed to create promo code');
      toast.error('Failed to create promo code');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create promo code' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a promo code
  const handleUpdatePromoCode = useCallback(async (id: number, promoCodeData: Partial<PromoCode>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPromoCode = await promoCodeService.updatePromoCode(id, promoCodeData);
      
      // Update the promo codes list
      setPromoCodes(prev => 
        prev.map(promoCode => promoCode.id === id ? { ...promoCode, ...updatedPromoCode } : promoCode)
      );
      
      toast.success('Promo code updated successfully');
      return { 
        success: true,
        promoCode: updatedPromoCode
      };
    } catch (error) {
      console.error('Error updating promo code:', error);
      setError('Failed to update promo code');
      toast.error('Failed to update promo code');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update promo code' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);


// Validate a promo code
// Validate a promo code
const handleValidatePromoCode = useCallback(async (eventId: number, code: string) => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await promoCodeService.validatePromoCode(eventId, code);
    
    // If service returns success: false, handle it here
    if (!result.success) {
      const errorMessage = result.message || 'Invalid promo code';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    }
    
    return {
      success: true,
      discountPercent: result.discountPercent
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to validate promo code';
    
    setError(errorMessage);
    
    return { 
      success: false, 
      message: errorMessage
    };
  } finally {
    setIsLoading(false);
  }
}, []);

  // Context value
  const value: PromoCodeContextType = {
    promoCodes,
    isLoading,
    error,
    getPromoCodesByEventId: fetchPromoCodesByEventId,
    getPromoCodeById: fetchPromoCodeById,
    createPromoCode: handleCreatePromoCode,
    updatePromoCode: handleUpdatePromoCode,
    validatePromoCode: handleValidatePromoCode
  };

  return (
    <PromoCodeContext.Provider value={value}>
      {children}
    </PromoCodeContext.Provider>
  );
};

// Custom hook to use the PromoCode context
export const usePromoCodes = (): PromoCodeContextType => {
  const context = useContext(PromoCodeContext);
  if (context === undefined) {
    throw new Error('usePromoCodes must be used within a PromoCodeProvider');
  }
  return context;
};