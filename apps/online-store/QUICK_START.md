# 🚀 Quick Start - Booking Module

Get the booking system running in **5 minutes**!

---

## Step 1: Install Dependencies (1 min)

```bash
npm install @reduxjs/toolkit react-redux date-fns
```

---

## Step 2: Add Redux Provider (1 min)

Update `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

---

## Step 3: Add Route (1 min)

Update your router (e.g., `src/App.tsx` or router config):

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookingPage } from '@/features/booking';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Your existing routes */}
        <Route path="/" element={<HomePage />} />
        
        {/* Add booking route */}
        <Route path="/booking" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Step 4: Test It! (2 min)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/booking`

3. You should see the service selection page!

---

## Step 5: Connect Backend (Later)

When ready, update `src/features/booking/services/bookingService.ts`:

```typescript
const API_BASE = process.env.VITE_API_URL || 'http://your-api.com/api';
```

And implement the required endpoints (see `BOOKING_MIGRATION_COMPLETE.md`).

---

## 🎉 That's It!

The booking system is now running. You'll see:
- ✅ Service selection page
- ✅ Progress bar
- ✅ Beautiful UI

**Note:** Some features need backend APIs to work fully:
- Loading services (will show empty until connected)
- Loading staff
- Loading time slots
- Creating bookings

---

## 🐛 Troubleshooting

### "Cannot find module '@reduxjs/toolkit'"
Run: `npm install @reduxjs/toolkit react-redux date-fns`

### "Provider is not defined"
Make sure you imported: `import { Provider } from 'react-redux';`

### "store is not defined"
Make sure the path is correct: `import { store } from './store';`

### Page is blank
Check the browser console for errors. Make sure the route is added correctly.

---

## 📚 Next Steps

1. **Read the docs:** `src/features/booking/README.md`
2. **Implement backend:** See API requirements in `BOOKING_MIGRATION_COMPLETE.md`
3. **Customize:** Update colors, text, business hours
4. **Test:** Try the complete booking flow

---

**Need help? Check the comprehensive docs in the booking folder!** 📖
