import { useState } from 'react';
import { X, Plus, Trash2, User, DollarSign, Percent, Users as UsersIcon } from 'lucide-react';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saleData: any) => void;
}

export function NewSaleModal({ isOpen, onClose, onSave }: NewSaleModalProps) {
  const [isGroupTicket, setIsGroupTicket] = useState(false);
  const [clients, setClients] = useState([{
    clientName: '',
    clientPhone: '',
    services: [] as string[]
  }]);
  const [services, setServices] = useState([{
    id: crypto.randomUUID(),
    serviceName: '',
    staffName: '',
    price: 0,
    duration: 30
  }]);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [taxRate] = useState(9);
  const [tip, setTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardType, setCardType] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  if (!isOpen) return null;

  const addClient = () => {
    setClients([...clients, { clientName: '', clientPhone: '', services: [] }]);
  };

  const removeClient = (index: number) => {
    setClients(clients.filter((_, i) => i !== index));
  };

  const updateClient = (index: number, field: string, value: string) => {
    const updated = [...clients];
    updated[index] = { ...updated[index], [field]: value };
    setClients(updated);
  };

  const addService = () => {
    setServices([...services, {
      id: crypto.randomUUID(),
      serviceName: '',
      staffName: '',
      price: 0,
      duration: 30
    }]);
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const updateService = (id: string, field: string, value: any) => {
    setServices(services.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const calculateTotals = () => {
    const subtotal = services.reduce((sum, s) => sum + Number(s.price), 0);
    const discountAmount = discountPercent > 0
      ? subtotal * (discountPercent / 100)
      : discount;
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * (taxRate / 100);
    const total = afterDiscount + tax + tip;

    return { subtotal, discountAmount, tax, total };
  };

  const { subtotal, discountAmount, tax, total } = calculateTotals();

  const handleSave = () => {
    const saleData = {
      id: `ticket-${Date.now()}`,
      storeId: 'salon_123',
      clientId: `client-${Date.now()}`,
      clientName: clients[0].clientName,
      clientPhone: clients[0].clientPhone,
      isGroupTicket: isGroupTicket && clients.length > 1,
      clients: isGroupTicket && clients.length > 1 ? clients.map((c, i) => ({
        clientId: `client-${Date.now()}-${i}`,
        clientName: c.clientName,
        clientPhone: c.clientPhone,
        services: []
      })) : undefined,
      services: services.map((s, i) => ({
        serviceId: `svc-${Date.now()}-${i}`,
        serviceName: s.serviceName,
        staffId: 'staff-001',
        staffName: s.staffName,
        price: Number(s.price),
        duration: Number(s.duration),
        commission: Number(s.price) * 0.5,
        startTime: new Date(),
        endTime: new Date(Date.now() + s.duration * 60000)
      })),
      products: [],
      status: 'paid',
      subtotal,
      discount: discountAmount,
      discountReason: discountReason || undefined,
      discountPercent: discountPercent || undefined,
      tax,
      taxRate,
      tip,
      total,
      payments: [{
        id: `pay-${Date.now()}`,
        method: paymentMethod,
        cardType: paymentMethod.includes('card') ? cardType : undefined,
        cardLast4: paymentMethod.includes('card') ? cardLast4 : undefined,
        amount: total - tip,
        tip,
        total,
        transactionId: paymentMethod.includes('card') ? `txn_${Date.now()}` : undefined,
        processedAt: new Date(),
        status: 'approved'
      }],
      createdAt: new Date(),
      completedAt: new Date(),
      createdBy: 'user-001',
      lastModifiedBy: 'user-001',
      syncStatus: 'local'
    };

    onSave(saleData);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Sale</h2>
                <p className="text-sm text-blue-100">Record a new transaction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Group Ticket Toggle */}
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="groupTicket"
                checked={isGroupTicket}
                onChange={(e) => {
                  setIsGroupTicket(e.target.checked);
                  if (!e.target.checked && clients.length > 1) {
                    setClients([clients[0]]);
                  }
                }}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="groupTicket" className="text-sm font-medium text-purple-900 cursor-pointer flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                Group Ticket (Multiple Clients)
              </label>
            </div>

            {/* Clients Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Client Information
                </h3>
                {isGroupTicket && (
                  <button
                    onClick={addClient}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    Add Client
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {clients.map((client, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${isGroupTicket ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-2" />
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Client Name {index === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={client.clientName}
                            onChange={(e) => updateClient(index, 'clientName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Enter client name"
                            required={index === 0}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={client.clientPhone}
                            onChange={(e) => updateClient(index, 'clientPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>
                      {isGroupTicket && index > 0 && (
                        <button
                          onClick={() => removeClient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Services
                </h3>
                <button
                  onClick={addService}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Add Service
                </button>
              </div>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Service Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={service.serviceName}
                          onChange={(e) => updateService(service.id, 'serviceName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="e.g., Haircut"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Staff Member
                        </label>
                        <input
                          type="text"
                          value={service.staffName}
                          onChange={(e) => updateService(service.id, 'staffName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Staff name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(service.id, 'price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Duration (min)
                          </label>
                          <input
                            type="number"
                            value={service.duration}
                            onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="30"
                            min="0"
                          />
                        </div>
                        {services.length > 1 && (
                          <button
                            onClick={() => removeService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Section */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Discount (Optional)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => {
                      setDiscount(Number(e.target.value));
                      setDiscountPercent(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Or Discount %
                  </label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => {
                      setDiscountPercent(Number(e.target.value));
                      setDiscount(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="e.g., Loyalty discount"
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3">
                Payment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="debit-card">Debit Card</option>
                    <option value="venmo">Venmo</option>
                    <option value="digital-wallet">Digital Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tip Amount
                  </label>
                  <input
                    type="number"
                    value={tip}
                    onChange={(e) => setTip(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {paymentMethod.includes('card') && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Card Type
                      </label>
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="">Select card type</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">American Express</option>
                        <option value="discover">Discover</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last 4 Digits
                      </label>
                      <input
                        type="text"
                        value={cardLast4}
                        onChange={(e) => setCardLast4(e.target.value.slice(0, 4))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="1234"
                        maxLength={4}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Transaction Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Discount:</span>
                    <span className="font-medium tabular-nums">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="font-medium tabular-nums">${tax.toFixed(2)}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tip:</span>
                    <span className="font-medium tabular-nums">${tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300 text-base font-bold">
                  <span>Total:</span>
                  <span className="tabular-nums text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!clients[0].clientName || services.some(s => !s.serviceName || !s.price)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Create Sale
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
