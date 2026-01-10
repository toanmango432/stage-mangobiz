import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export function App() {
  return (
    <BrowserRouter>
      {/* Global offline indicator */}
      <OfflineBanner />

      <Routes>
        {/* Client Check-In Flow */}
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
    </BrowserRouter>
  );
}
