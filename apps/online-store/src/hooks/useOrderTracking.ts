import { useState, useEffect } from 'react';
import { Order } from '@/types/order';

export const useOrderTracking = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingUpdates, setTrackingUpdates] = useState<Array<{
    date: string;
    status: string;
    location: string;
  }>>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock order data - in real app, fetch from API
      const mockOrder: Order = {
        id: orderId,
        orderNumber: 'ORD-2025-1234',
        date: new Date().toISOString(),
        status: 'shipped',
        items: [],
        subtotal: 150,
        discount: 0,
        tax: 12.75,
        shipping: 8.99,
        total: 171.74,
        customerEmail: 'customer@example.com',
        customerPhone: '(555) 123-4567',
        paymentMethod: {
          type: 'Credit Card',
          last4: '4242'
        }
      };

      setOrder(mockOrder);
      
      // Mock tracking updates
      setTrackingUpdates([
        {
          date: new Date().toISOString(),
          status: 'Out for delivery',
          location: 'Local delivery facility'
        },
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'In transit',
          location: 'Regional sorting center'
        },
        {
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'Shipped',
          location: 'Distribution center'
        }
      ]);
      
      setLoading(false);
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  return { order, loading, trackingUpdates };
};
