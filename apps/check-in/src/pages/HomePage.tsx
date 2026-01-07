import { Link } from 'react-router-dom';
import { UserPlus, Clock } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl flex items-center justify-center mb-4">
          <span className="text-white text-4xl font-bold">M</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Mango Check-In</h1>
        <p className="text-gray-600 mt-2">Welcome! Please select an option below</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        {/* Client Check-In */}
        <Link
          to="/check-in"
          className="flex-1 bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-orange-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Check-In</h2>
            <p className="text-gray-600">Walk-in registration and service selection</p>
          </div>
        </Link>

        {/* Staff Clock-In */}
        <Link
          to="/clock-in"
          className="flex-1 bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-pink-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Staff Clock-In</h2>
            <p className="text-gray-600">Clock in/out with your PIN</p>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm text-gray-400">Powered by Mango Biz</p>
    </div>
  );
}
