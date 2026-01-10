import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { CheckInMqttProvider } from './providers/MqttProvider';
import { AccessibilityProvider } from './providers/AccessibilityProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { QrScanPage } from './pages/QrScanPage';
import { VerifyPage } from './pages/VerifyPage';
import { SignupPage } from './pages/SignupPage';
import { AppointmentConfirmPage } from './pages/AppointmentConfirmPage';
import { ServicesPage } from './pages/ServicesPage';
import { TechnicianPage } from './pages/TechnicianPage';
import { GuestsPage } from './pages/GuestsPage';
import { ConfirmPage } from './pages/ConfirmPage';
import { SuccessPage } from './pages/SuccessPage';
import { OfflineBanner } from './components/OfflineBanner';
import { HelpButton } from './components/HelpButton';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminModeBar } from './components/AdminModeBar';
import { AccessibilityButton } from './components/AccessibilityButton';

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
