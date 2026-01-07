import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

const TIP_OPTIONS = [
  { label: '15%', value: 0.15 },
  { label: '18%', value: 0.18 },
  { label: '20%', value: 0.20 },
  { label: '25%', value: 0.25 },
];

export function TipPage() {
  const navigate = useNavigate();
  const [selectedTip, setSelectedTip] = useState<number | null>(0.20);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  // Placeholder total
  const subtotal = 92.23;

  const calculateTipAmount = () => {
    if (isCustom && customTip) {
      return parseFloat(customTip);
    }
    if (selectedTip !== null) {
      return subtotal * selectedTip;
    }
    return 0;
  };

  const tipAmount = calculateTipAmount();
  const total = subtotal + tipAmount;

  const handleTipSelect = (value: number) => {
    setSelectedTip(value);
    setIsCustom(false);
    setCustomTip('');
  };

  const handleCustomTip = () => {
    setIsCustom(true);
    setSelectedTip(null);
  };

  const handleNoTip = () => {
    setSelectedTip(0);
    setIsCustom(false);
    setCustomTip('');
  };

  const handleContinue = () => {
    navigate('/signature');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-center">
          <Heart className="w-6 h-6 text-orange-500 mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">Add a Tip</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-md mx-auto">
          {/* Tip Options Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {TIP_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => handleTipSelect(option.value)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedTip === option.value && !isCustom
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                <div className="text-2xl font-bold text-gray-800">{option.label}</div>
                <div className="text-sm text-gray-500 mt-1">
                  ${(subtotal * option.value).toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Tip */}
          <button
            onClick={handleCustomTip}
            className={`w-full p-4 rounded-xl border-2 mb-4 transition-all ${
              isCustom
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-300'
            }`}
          >
            {isCustom ? (
              <div className="flex items-center justify-center">
                <span className="text-xl text-gray-600 mr-2">$</span>
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="0.00"
                  className="text-2xl font-bold text-center bg-transparent border-none outline-none w-32"
                  autoFocus
                />
              </div>
            ) : (
              <span className="text-lg text-gray-600">Custom Amount</span>
            )}
          </button>

          {/* No Tip */}
          <button
            onClick={handleNoTip}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              selectedTip === 0 && !isCustom
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-300'
            }`}
          >
            <span className="text-lg text-gray-600">No Tip</span>
          </button>

          {/* Summary */}
          <div className="mt-8 bg-white rounded-xl p-4 border">
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Tip</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
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
          Continue to Signature
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
