import './index.css';
import { createRoot } from "react-dom/client";
import { App } from "./App";
import * as serviceWorkerRegistration from './services/serviceWorkerRegistration';

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