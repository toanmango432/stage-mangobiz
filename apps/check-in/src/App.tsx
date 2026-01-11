import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Suspense, lazy } from 'react';
import { store } from './store';
import { CheckInMqttProvider } from './providers/MqttProvider';
import { AccessibilityProvider } from './providers/AccessibilityProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { HelpButton } from './components/HelpButton';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminModeBar } from './components/AdminModeBar';
import { AccessibilityButton } from './components/AccessibilityButton';

// Lazy load pages for code splitting
const WelcomeScreen = lazy(() => import('./pages/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const QrScanPage = lazy(() => import('./pages/QrScanPage').then(m => ({ default: m.QrScanPage })));
const VerifyPage = lazy(() => import('./pages/VerifyPage').then(m => ({ default: m.VerifyPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const AppointmentConfirmPage = lazy(() => import('./pages/AppointmentConfirmPage').then(m => ({ default: m.AppointmentConfirmPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const TechnicianPage = lazy(() => import('./pages/TechnicianPage').then(m => ({ default: m.TechnicianPage })));
const GuestsPage = lazy(() => import('./pages/GuestsPage').then(m => ({ default: m.GuestsPage })));
const ConfirmPage = lazy(() => import('./pages/ConfirmPage').then(m => ({ default: m.ConfirmPage })));
const SuccessPage = lazy(() => import('./pages/SuccessPage').then(m => ({ default: m.SuccessPage })));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1a5f4a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      {/* Skip Link for Screen Readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AdminModeBar />
      <OfflineBanner />
      <main id="main-content" role="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<WelcomeScreen />} />
            <Route path="/qr-scan" element={<QrScanPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/appointment" element={<AppointmentConfirmPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/technician" element={<TechnicianPage />} />
            <Route path="/guests" element={<GuestsPage />} />
            <Route path="/confirm" element={<ConfirmPage />} />
            <Route path="/success" element={<SuccessPage />} />
          </Routes>
        </Suspense>
      </main>
      <AccessibilityButton />
      <HelpButton />
      <AdminPinModal />
    </BrowserRouter>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AccessibilityProvider>
          <CheckInMqttProvider>
            <AppRoutes />
          </CheckInMqttProvider>
        </AccessibilityProvider>
      </Provider>
    </ErrorBoundary>
  );
}
