import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from './components/LoadingSpinner';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CheckInPage = lazy(() => import('./pages/CheckInPage').then(m => ({ default: m.CheckInPage })));
const ClockInPage = lazy(() => import('./pages/ClockInPage').then(m => ({ default: m.ClockInPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/clock-in" element={<ClockInPage />} />
      </Routes>
    </Suspense>
  );
}
