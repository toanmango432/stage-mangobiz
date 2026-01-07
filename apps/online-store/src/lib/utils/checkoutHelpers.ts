import { Order } from "@/types/order";
import { CartItem } from "@/types/cart";
import { toast } from "sonner";

export const processOrder = async (orderData: Omit<Order, 'id' | 'orderNumber'>): Promise<Order> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  const order: Order = {
    ...orderData,
    id: `order-${Date.now()}`,
    orderNumber: generateOrderNumber()
  };

  return order;
};

export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}-${random}`;
};

export const sendConfirmationEmail = async (order: Order): Promise<void> => {
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Confirmation email sent for order ${order.orderNumber} to ${order.customerEmail}`);
};

export const updateInventory = (items: CartItem[]): void => {
  // In a real app, this would update stock in database
  items.forEach(item => {
    if (item.type === 'product' && item.quantity) {
      console.log(`Reducing stock for ${item.name} by ${item.quantity}`);
    }
  });
};

export const createBooking = async (serviceItem: CartItem): Promise<void> => {
  if (serviceItem.type !== 'service' || !serviceItem.serviceDetails) return;

  // Simulate booking creation
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log(`Booking created for ${serviceItem.name} on ${serviceItem.serviceDetails.date}`);
};

export const activateMembership = async (membershipItem: CartItem): Promise<void> => {
  if (membershipItem.type !== 'membership') return;

  // Simulate membership activation
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log(`Membership activated: ${membershipItem.name}`);
  toast.success("Membership activated! Welcome to the family 🎉");
};

export const sendGiftCard = async (giftCardItem: CartItem): Promise<void> => {
  if (giftCardItem.type !== 'gift-card' || !giftCardItem.giftCardDetails) return;

  // Simulate gift card email
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Gift card sent to ${giftCardItem.giftCardDetails.recipientEmail}`);
  toast.success("Gift card sent to recipient!");
};

export const calculateEstimatedDelivery = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 5); // 5 business days
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};
