import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { orderService } from '../services/orderService';

// Types
export interface OrderItem {
  id?: number;
  orderId?: number;
  ticketId?: number;
  ticketTitle: string;
  quantity: number;
  initialPrice?: number;
  finalPrice?: number;
}

export interface Order {
  id?: number;
  userId?: number;
  eventId: number;
  promoCodeId?: number;
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  paymentMethod: string;
  totalAmount?: number;
  items: OrderItem[];
  promoCode?: {
    discountPercent: number;
  };
  createdAt?: string;
}

export interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  createOrder: (orderData: {
    eventId: number;
    promoCode?: string;
    paymentMethod: string;
    items: { ticketTitle: string; quantity: number }[];
  }) => Promise<{
    success: boolean;
    order?: Order;
    message?: string;
  }>;
  getOrderById: (id: number) => Promise<Order | null>;
  getUserOrders: (userId: number) => Promise<Order[]>;
  getEventOrders: (eventId: number) => Promise<Order[]>;
  updateOrderStatus: (orderId: number, status: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  processPayment: (orderId: number, paymentData: any) => Promise<{
    success: boolean;
    message?: string;
  }>;
  cancelOrder: (orderId: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
}

// Create the Order context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider component
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new order
  const handleCreateOrder = useCallback(async (orderData: {
    eventId: number;
    promoCode?: string;
    paymentMethod: string;
    items: { ticketTitle: string; quantity: number }[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await orderService.createOrder(orderData);
      setOrders(prev => [...prev, order]);
      setCurrentOrder(order);
      toast.success('Order created successfully');
      return {
        success: true,
        order: order
      };
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order');
      toast.error('Failed to create order');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create order' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get order by ID
  const fetchOrderById = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrderById(id);
      setCurrentOrder(data);
      return data;
    } catch (error) {
      console.error(`Error fetching order with ID ${id}:`, error);
      setError(`Failed to fetch order with ID ${id}`);
      toast.error('Failed to fetch order details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get user orders
  const fetchUserOrders = useCallback(async (userId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getUserOrders(userId);
      setOrders(data);
      return data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setError('Failed to fetch user orders');
      toast.error('Failed to fetch your orders');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get event orders (admin/organizer only)
  const fetchEventOrders = useCallback(async (eventId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getEventOrders(eventId);
      return data;
    } catch (error) {
      console.error(`Error fetching orders for event with ID ${eventId}:`, error);
      setError(`Failed to fetch orders for event with ID ${eventId}`);
      toast.error('Failed to fetch event orders');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update order status
  const handleUpdateOrderStatus = useCallback(async (orderId: number, status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await orderService.updateOrderStatus(orderId, status);
      
      // Update orders list
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, paymentStatus: status as any } : order
        )
      );
      
      // Update current order if it's the one being modified
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(prev => 
          prev ? { ...prev, paymentStatus: status as any } : prev
        );
      }
      
      toast.success('Order status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
      toast.error('Failed to update order status');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update order status' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentOrder]);

  // Process payment
  const handleProcessPayment = useCallback(async (orderId: number, paymentData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await orderService.processPayment(orderId, paymentData);
      
      // Update orders list
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, paymentStatus: 'COMPLETED' } : order
        )
      );
      
      // Update current order if it's the one being modified
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(prev => 
          prev ? { ...prev, paymentStatus: 'COMPLETED' } : prev
        );
      }
      
      toast.success('Payment processed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment');
      toast.error('Failed to process payment');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process payment' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentOrder]);

  // Cancel order
  const handleCancelOrder = useCallback(async (orderId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await orderService.cancelOrder(orderId);
      
      // Update orders list
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, paymentStatus: 'CANCELED' } : order
        )
      );
      
      // Update current order if it's the one being modified
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(prev => 
          prev ? { ...prev, paymentStatus: 'CANCELED' } : prev
        );
      }
      
      toast.success('Order canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('Error canceling order:', error);
      setError('Failed to cancel order');
      toast.error('Failed to cancel order');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to cancel order' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentOrder]);

  // Context value
  const value: OrderContextType = {
    orders,
    currentOrder,
    isLoading,
    error,
    createOrder: handleCreateOrder,
    getOrderById: fetchOrderById,
    getUserOrders: fetchUserOrders,
    getEventOrders: fetchEventOrders,
    updateOrderStatus: handleUpdateOrderStatus,
    processPayment: handleProcessPayment,
    cancelOrder: handleCancelOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the Order context
export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};