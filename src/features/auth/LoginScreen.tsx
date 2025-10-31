import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, loginSalonMode } from '../../store/slices/authThunks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

export function LoginScreen() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [mode, setMode] = useState<'email' | 'salon'>('salon');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email/Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Salon Mode login state
  const [salonId, setSalonId] = useState('');
  const [pin, setPin] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Redirect handled by App.tsx
    } catch (err: any) {
      setError(err || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSalonLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await dispatch(loginSalonMode({ salonId, pin })).unwrap();
      // Redirect handled by App.tsx
    } catch (err: any) {
      setError(err || 'Salon login failed');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Will be redirected by router
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
          <div className="text-5xl mb-3">🥭</div>
          <h1 className="text-3xl font-bold mb-2">Mango Biz Store</h1>
          <p className="text-purple-100">Salon POS System</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('salon')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              mode === 'salon'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            Salon Mode
          </button>
          <button
            onClick={() => setMode('email')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              mode === 'email'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            Email Login
          </button>
        </div>

        {/* Form Container */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Salon Mode Form */}
          {mode === 'salon' && (
            <form onSubmit={handleSalonLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salon ID
                </label>
                <input
                  type="text"
                  value={salonId}
                  onChange={(e) => setSalonId(e.target.value)}
                  placeholder="Enter your salon ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Code
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login to Salon'}
              </button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Demo Salon ID:</strong> salon-001<br />
                  <strong>Demo PIN:</strong> 1234
                </p>
              </div>
            </form>
          )}

          {/* Email/Password Form */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-purple-600 hover:text-purple-700">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login with Email'}
              </button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Demo Email:</strong> demo@mangobiz.com<br />
                  <strong>Demo Password:</strong> demo123
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
          <p>Offline-first POS • Real-time Sync • Multi-device</p>
          <p className="mt-1 text-xs text-gray-500">
            © 2025 Mango Biz. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
