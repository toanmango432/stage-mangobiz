import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Receipt, ArrowRight } from 'lucide-react';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { usePadMqtt } from '../providers/PadMqttProvider';

export function ReceiptPage() {
  const navigate = useNavigate();
  const { setCurrentScreen } = usePadMqtt();

  // Update current screen for heartbeat
  useEffect(() => {
    setCurrentScreen('receipt');
  }, [setCurrentScreen]);

  // Placeholder receipt data
  const receiptData = {
    storeName: 'Mango Salon & Spa',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    items: [
      { name: 'Haircut', price: 45.00 },
      { name: 'Deep Conditioning', price: 25.00 },
      { name: 'Blow Dry', price: 15.00 },
    ],
    subtotal: 85.00,
    tax: 7.23,
    total: 92.23,
  };

  const handleContinue = () => {
    navigate('/tip');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 relative">
        <div className="flex items-center justify-center">
          <Receipt className="w-6 h-6 text-orange-500 mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">Your Receipt</h1>
        </div>
        {/* Connection status indicator - top right */}
        <ConnectionIndicator className="absolute top-3 right-4" />
      </div>

      {/* Receipt Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-md mx-auto">
          {/* Store Info */}
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800">{receiptData.storeName}</h2>
            <p className="text-sm text-gray-500">{receiptData.date} at {receiptData.time}</p>
          </div>

          {/* Line Items */}
          <div className="space-y-3 mb-4">
            {receiptData.items.map((item, index) => (
              <div key={index} className="flex justify-between text-gray-700">
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${receiptData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${receiptData.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
              <span>Total</span>
              <span>${receiptData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="p-6 bg-white border-t">
        <button
          onClick={handleContinue}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center hover:bg-orange-600 transition-colors"
        >
          Continue to Tip
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
