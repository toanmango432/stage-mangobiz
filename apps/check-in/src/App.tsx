import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CheckInPage } from './pages/CheckInPage';
import { ClockInPage } from './pages/ClockInPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/clock-in" element={<ClockInPage />} />
      </Routes>
    </BrowserRouter>
  );
}
