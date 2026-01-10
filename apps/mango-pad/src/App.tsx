import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PadMqttProvider } from '@/providers/PadMqttProvider';
import { WaitingPage } from './pages/WaitingPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { TipPage } from './pages/TipPage';
import { SignaturePage } from './pages/SignaturePage';

export function App() {
  return (
    <PadMqttProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WaitingPage />} />
          <Route path="/receipt" element={<ReceiptPage />} />
          <Route path="/tip" element={<TipPage />} />
          <Route path="/signature" element={<SignaturePage />} />
        </Routes>
      </BrowserRouter>
    </PadMqttProvider>
  );
}
