import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PadMqttProvider } from './providers/PadMqttProvider';
import { WaitingPage } from './pages/WaitingPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { TipPage } from './pages/TipPage';
import { SignaturePage } from './pages/SignaturePage';
import { WelcomePage, isPaired } from './pages/WelcomePage';
import { PairingPage } from './pages/PairingPage';

/**
 * Root route component that redirects based on pairing status.
 * If device is paired, show WaitingPage.
 * If not paired, redirect to WelcomePage.
 */
function RootRoute() {
  // Check if demo mode is active (for unpaird devices in demo)
  const isDemoMode = localStorage.getItem('mango_pad_demo_mode') === 'true';

  // Show WaitingPage if paired OR in demo mode
  if (isPaired() || isDemoMode) {
    return <WaitingPage />;
  }

  // Otherwise redirect to welcome screen
  return <Navigate to="/welcome" replace />;
}

export function App() {
  return (
    <PadMqttProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/pair" element={<PairingPage />} />
          <Route path="/receipt" element={<ReceiptPage />} />
          <Route path="/tip" element={<TipPage />} />
          <Route path="/signature" element={<SignaturePage />} />
        </Routes>
      </BrowserRouter>
    </PadMqttProvider>
  );
}
