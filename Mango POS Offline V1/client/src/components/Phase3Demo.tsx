import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectCurrentUser, selectSalonId } from '../store/slices/authSlice';
import { logoutUser } from '../store/slices/authThunks';
import { LoginScreen } from '../features/auth/LoginScreen';
import { socketClient } from '../api/socket';

export function Phase3Demo() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const salonId = useAppSelector(selectSalonId);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Check socket connection status every second
    const interval = setInterval(() => {
      setSocketConnected(socketClient.isConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
  };

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Phase 3: Authentication & API Complete!
              </h1>
              <p className="text-gray-600">
                Welcome back, <strong>{currentUser?.name}</strong>!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Success Checklist */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">✅ What's Working:</h2>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Axios API client with JWT interceptors</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Authentication system (Email + Salon Mode)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Socket.io client for real-time sync</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Protected routes with session restoration</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Token refresh on 401 errors</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Beautiful login screen with Tailwind</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>API endpoints for all entities</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Retry logic with exponential backoff</span>
            </li>
          </ul>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 User Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{currentUser?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salon ID:</span>
                <span className="font-medium">{salonId}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔌 Connection Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Socket.io:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">{socketConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">Mock Mode</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">IndexedDB:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 API Endpoints Available</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <strong className="text-purple-600">Authentication:</strong>
              <ul className="ml-4 mt-2 space-y-1 text-gray-600">
                <li>• POST /auth/login</li>
                <li>• POST /auth/salon-mode</li>
                <li>• POST /auth/logout</li>
                <li>• POST /auth/refresh</li>
                <li>• GET /auth/verify</li>
              </ul>
            </div>
            <div>
              <strong className="text-purple-600">Appointments:</strong>
              <ul className="ml-4 mt-2 space-y-1 text-gray-600">
                <li>• GET /appointments</li>
                <li>• POST /appointments</li>
                <li>• PUT /appointments/:id</li>
                <li>• POST /appointments/:id/check-in</li>
                <li>• DELETE /appointments/:id</li>
              </ul>
            </div>
            <div>
              <strong className="text-purple-600">Tickets:</strong>
              <ul className="ml-4 mt-2 space-y-1 text-gray-600">
                <li>• GET /tickets</li>
                <li>• POST /tickets</li>
                <li>• PUT /tickets/:id</li>
                <li>• POST /tickets/:id/complete</li>
                <li>• POST /tickets/:id/void</li>
              </ul>
            </div>
            <div>
              <strong className="text-purple-600">Transactions:</strong>
              <ul className="ml-4 mt-2 space-y-1 text-gray-600">
                <li>• GET /transactions</li>
                <li>• POST /transactions</li>
                <li>• POST /transactions/:id/void</li>
                <li>• POST /transactions/:id/refund</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Socket Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Socket.io Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong className="text-blue-600">Appointments:</strong>
              <ul className="ml-4 mt-2 space-y-1 text-gray-600">
                <li>• appointment:created</li>
                <li>• appointment:updated</li>
                <li>• appointment:deleted</li>
              </ul>
            </div>
            <div>
              <strong className="text-blue-600">Tickets:</strong>
              <ul className="ml-4 mt-2 space-y-1 text-gray-600">
                <li>• ticket:created</li>
                <li>• ticket:updated</li>
                <li>• payment:completed</li>
              </ul>
            </div>
            <div>
              <strong className="text-blue-600">Sync:</strong>
              <ul className="ml-4 mt-2 space-y-1 text-gray-600">
                <li>• sync:required</li>
                <li>• sync:conflict</li>
                <li>• queue:updated</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The API and Socket.io are currently in mock mode. 
            Connect to your Mango Biz Backend to enable real API calls and real-time sync.
          </p>
        </div>
      </div>
    </div>
  );
}
