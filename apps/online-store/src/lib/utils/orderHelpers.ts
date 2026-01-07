import { Order } from '@/types/order';

export const getOrderStatusColor = (status: Order['status']) => {
  const colors = {
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || colors.processing;
};

export const isActiveOrder = (status: Order['status']) => {
  return ['processing', 'confirmed', 'shipped'].includes(status);
};

export const getOrderStatusText = (status: Order['status']) => {
  const texts = {
    processing: 'Processing',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return texts[status] || 'Unknown';
};
