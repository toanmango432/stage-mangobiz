import React from 'react';
import { Ticket } from '../../types/Ticket';
import { TAX_RATE } from '../../constants/checkoutConfig';

interface ServiceSummaryProps {
  ticket: Ticket;
  tipAmount?: number;
  discountAmount?: number;
  showTip?: boolean;
}

/**
 * ServiceSummary Component
 *
 * Displays order details in the checkout flow including:
 * - Services grouped by staff member
 * - Products with quantities
 * - Pricing breakdown (subtotal, discount, tax, tip, total)
 */
export function ServiceSummary({
  ticket,
  tipAmount = 0,
  discountAmount = 0,
  showTip = true
}: ServiceSummaryProps) {
  // Calculate totals
  const servicesTotal = ticket.services.reduce((sum, s) => sum + s.price, 0);
  const productsTotal = ticket.products.reduce((sum, p) => sum + p.total, 0);
  const subtotal = servicesTotal + productsTotal;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * TAX_RATE;
  const grandTotal = afterDiscount + taxAmount + (showTip ? tipAmount : 0);

  // Group services by staff
  const servicesByStaff = ticket.services.reduce((acc, service) => {
    const staffName = service.staffName;
    if (!acc[staffName]) {
      acc[staffName] = [];
    }
    acc[staffName].push(service);
    return acc;
  }, {} as Record<string, typeof ticket.services>);

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">Order Summary</h3>

      {/* Services grouped by staff */}
      {Object.entries(servicesByStaff).map(([staffName, services]) => (
        <div key={staffName} className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {staffName}
          </div>
          {services.map((service, idx) => (
            <div key={idx} className="flex justify-between text-sm pl-3">
              <span className="text-gray-700 flex-1">
                {service.serviceName}
                <span className="text-gray-400 ml-2">({service.duration} min)</span>
              </span>
              <span className="font-medium ml-4">${service.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Products */}
      {ticket.products.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Products
          </div>
          {ticket.products.map((product, idx) => (
            <div key={idx} className="flex justify-between text-sm pl-3">
              <span className="text-gray-700">
                {product.productName}
                <span className="text-gray-500 ml-1">x{product.quantity}</span>
              </span>
              <span className="font-medium">${product.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pricing breakdown */}
      <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
          <span className="font-medium">${taxAmount.toFixed(2)}</span>
        </div>

        {showTip && tipAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Tip</span>
            <span>+${tipAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
          <span>Total</span>
          <span className="text-green-600">${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
