import React, { useEffect, useState } from 'react';
import { X, DollarSign, CreditCard, Wallet, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTickets } from '../context/TicketContext';
interface PaymentProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
}
export function PaymentProcessModal({
  isOpen,
  onClose,
  ticketId
}: PaymentProcessModalProps) {
  const {
    pendingTickets,
    deleteTicket
  } = useTickets();
  const [ticket, setTicket] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('card');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Find and set the ticket when opened
  useEffect(() => {
    if (isOpen && ticketId) {
      const foundTicket = pendingTickets.find(t => t.id === ticketId);
      if (foundTicket) {
        setTicket(foundTicket);
        // Set default payment amount based on service
        // In a real app, this would come from a price list
        setPaymentAmount('45.00'); // Example default price
      }
    }
  }, [isOpen, ticketId, pendingTickets]);
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod('card');
      setPaymentAmount('');
      setTipAmount('');
      setIsProcessing(false);
      setIsComplete(false);
      setErrors({});
    }
  }, [isOpen]);
  if (!isOpen || !ticket) return null;
  // Calculate totals
  const subtotal = parseFloat(paymentAmount || '0');
  const tip = parseFloat(tipAmount || '0');
  const total = subtotal + tip;
  // Quick tip buttons
  const calculateTip = (percentage: number) => {
    if (!paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) return;
    const tipValue = (amount * percentage / 100).toFixed(2);
    setTipAmount(tipValue);
  };
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!paymentAmount.trim() || isNaN(parseFloat(paymentAmount))) {
      newErrors.paymentAmount = 'Please enter a valid payment amount';
    }
    if (tipAmount.trim() && isNaN(parseFloat(tipAmount))) {
      newErrors.tipAmount = 'Please enter a valid tip amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Handle payment submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsProcessing(true);
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        setIsComplete(true);
        // In a real app, you would record the payment in your database
        // After a successful payment, remove the ticket from pending
        setTimeout(() => {
          if (ticketId) {
            deleteTicket(ticketId, 'payment_completed');
            onClose();
          }
        }, 2000);
      }, 1500);
    }
  };
  return <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} />
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Modal header */}
          <div className="bg-gradient-to-r from-[#3498DB]/10 to-[#3498DB]/5 p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Receipt className="mr-2 text-[#3498DB]" size={20} />
              Process Payment
            </h2>
            {!isProcessing && !isComplete && <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>}
          </div>
          {/* Modal body */}
          <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
            {isComplete ?
          // Payment complete view
          <div className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Payment Complete
                </h3>
                <p className="text-gray-600 mb-6">
                  The payment of ${total.toFixed(2)} has been processed
                  successfully.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Tip:</span>
                    <span className="text-sm font-medium">
                      ${tip.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold text-gray-700">
                      Total:
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button onClick={onClose} className="w-full px-4 py-2 bg-[#3498DB] text-white rounded-md hover:bg-[#2980B9] transition-colors">
                  Close
                </button>
              </div> : isProcessing ?
          // Processing view
          <div className="p-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-lg font-medium text-gray-700">
                    Processing Payment
                  </p>
                  <p className="text-sm text-gray-500">
                    Please wait while we process your payment...
                  </p>
                </div>
              </div> :
          // Payment form view
          <form onSubmit={handleSubmit}>
                <div className="p-4">
                  {/* Ticket info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm mr-2">
                          {ticket.number}
                        </div>
                        <span className="font-medium text-gray-800">
                          {ticket.clientName}
                        </span>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {ticket.clientType}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {ticket.service}
                    </div>
                  </div>
                  {/* Payment method */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" className={`flex flex-col items-center justify-center p-3 rounded-lg border ${paymentMethod === 'card' ? 'border-[#3498DB] bg-[#3498DB]/5 ring-1 ring-[#3498DB]/30' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setPaymentMethod('card')}>
                        <CreditCard size={20} className={`mb-1 ${paymentMethod === 'card' ? 'text-[#3498DB]' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${paymentMethod === 'card' ? 'text-[#3498DB]' : 'text-gray-700'}`}>
                          Card
                        </span>
                      </button>
                      <button type="button" className={`flex flex-col items-center justify-center p-3 rounded-lg border ${paymentMethod === 'cash' ? 'border-[#3498DB] bg-[#3498DB]/5 ring-1 ring-[#3498DB]/30' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setPaymentMethod('cash')}>
                        <DollarSign size={20} className={`mb-1 ${paymentMethod === 'cash' ? 'text-[#3498DB]' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${paymentMethod === 'cash' ? 'text-[#3498DB]' : 'text-gray-700'}`}>
                          Cash
                        </span>
                      </button>
                      <button type="button" className={`flex flex-col items-center justify-center p-3 rounded-lg border ${paymentMethod === 'mobile' ? 'border-[#3498DB] bg-[#3498DB]/5 ring-1 ring-[#3498DB]/30' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setPaymentMethod('mobile')}>
                        <Wallet size={20} className={`mb-1 ${paymentMethod === 'mobile' ? 'text-[#3498DB]' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${paymentMethod === 'mobile' ? 'text-[#3498DB]' : 'text-gray-700'}`}>
                          Mobile
                        </span>
                      </button>
                    </div>
                  </div>
                  {/* Amount */}
                  <div className="mb-4">
                    <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input type="text" id="paymentAmount" value={paymentAmount} onChange={e => {
                    setPaymentAmount(e.target.value);
                    if (errors.paymentAmount) {
                      setErrors({
                        ...errors,
                        paymentAmount: ''
                      });
                    }
                  }} className={`w-full p-2 pl-10 border ${errors.paymentAmount ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#3498DB] focus:border-[#3498DB]`} placeholder="0.00" />
                    </div>
                    {errors.paymentAmount && <p className="text-red-500 text-xs mt-1">
                        {errors.paymentAmount}
                      </p>}
                  </div>
                  {/* Tip */}
                  <div className="mb-4">
                    <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Tip
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input type="text" id="tipAmount" value={tipAmount} onChange={e => {
                    setTipAmount(e.target.value);
                    if (errors.tipAmount) {
                      setErrors({
                        ...errors,
                        tipAmount: ''
                      });
                    }
                  }} className={`w-full p-2 pl-10 border ${errors.tipAmount ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#3498DB] focus:border-[#3498DB]`} placeholder="0.00" />
                    </div>
                    {errors.tipAmount && <p className="text-red-500 text-xs mt-1">
                        {errors.tipAmount}
                      </p>}
                    {/* Quick tip buttons */}
                    <div className="flex space-x-2 mt-2">
                      <button type="button" onClick={() => calculateTip(15)} className="flex-1 py-1 px-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">
                        15%
                      </button>
                      <button type="button" onClick={() => calculateTip(18)} className="flex-1 py-1 px-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">
                        18%
                      </button>
                      <button type="button" onClick={() => calculateTip(20)} className="flex-1 py-1 px-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">
                        20%
                      </button>
                      <button type="button" onClick={() => calculateTip(25)} className="flex-1 py-1 px-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">
                        25%
                      </button>
                    </div>
                  </div>
                  {/* Total */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Tip:</span>
                      <span className="text-sm font-medium">
                        ${tip.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-gray-700">
                        Total:
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Warning for cash payments */}
                  {paymentMethod === 'cash' && <div className="bg-amber-50 p-3 rounded-md border border-amber-200 flex items-start mb-4">
                      <AlertTriangle size={16} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Remember to collect ${total.toFixed(2)} in cash and
                        provide change if necessary.
                      </p>
                    </div>}
                  {/* Submit button */}
                  <button type="submit" className="w-full px-4 py-3 bg-[#3498DB] text-white rounded-md hover:bg-[#2980B9] transition-colors font-medium flex items-center justify-center">
                    Process Payment
                  </button>
                </div>
              </form>}
          </div>
        </div>
      </div>
    </>;
}