import './index.css';
import { createRoot } from "react-dom/client";
import { App } from "./App";
import * as serviceWorkerRegistration from './services/serviceWorkerRegistration';
import { initSentry } from './services/monitoring/sentry';

// Initialize Sentry error tracking FIRST (before any other code)
initSentry();

// Validate required environment variables before rendering
function validateEnvironment(): void {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f3f4f6;
          padding: 20px;
        ">
          <div style="
            background: white;
            border-radius: 12px;
            padding: 32px;
            max-width: 500px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            text-align: center;
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">&#9888;</div>
            <h1 style="color: #dc2626; margin: 0 0 16px 0; font-size: 24px;">
              Configuration Required
            </h1>
            <p style="color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
              Missing required environment variables:
            </p>
            <div style="
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 24px;
            ">
              <code style="color: #dc2626; font-size: 14px;">
                ${missing.join(', ')}
              </code>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Please copy <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">.env.example</code>
              to <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">.env</code>
              and configure your Supabase credentials.
            </p>
          </div>
        </div>
      `;
    }
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate environment before starting the app
validateEnvironment();

const container = document.getElementById("root");
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);
root.render(<App />);

// Register service worker for offline support
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('🎉 App is ready for offline use!');
  },
  onUpdate: () => {
    console.log('🔄 New version available! Refresh to update.');
  },
});