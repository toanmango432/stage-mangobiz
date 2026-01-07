import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Delete } from 'lucide-react';

export function ClockInPage() {
  const [pin, setPin] = useState('');

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Staff Clock-In</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* PIN Display */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 mb-4">Enter your 4-digit PIN</p>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                    pin.length > i
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {pin.length > i ? '*' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="h-16 text-2xl font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-16 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="h-16 text-2xl font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-16 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Delete className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            disabled={pin.length !== 4}
            className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clock In
          </button>
        </div>
      </main>
    </div>
  );
}
