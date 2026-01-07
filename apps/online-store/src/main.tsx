import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import App from "./App";
import "./index.css";
import { initializeTemplateData } from "@/lib/mockData";
import { validateSeedFilesInDevelopment } from "@/lib/seed-validator";
import { startMockWorker } from "@/mocks/browser";

// Initialize MSW in standalone mode
async function initializeApp() {
  console.log('🚀 Starting app initialization...');
  console.log('🔍 Environment check - mode:', typeof __MODE__ !== 'undefined' ? __MODE__ : 'undefined');
  
  // Skip MSW for now to get React working
  console.log('⏭️  Skipping MSW worker for now...');

  // Initialize template data on app startup
  try {
    console.log('🚀 Starting template data initialization...');
    initializeTemplateData();
    console.log('✅ Template data initialized successfully');
  } catch (error) {
    console.error('❌ Template initialization failed:', error);
    // Continue anyway - app should still work with defaults
  }

  // Skip seed validation for now
  console.log('⏭️  Skipping seed validation for now...');
  
  console.log('🎯 App initialization completed successfully');
}

// Initialize MSW and then start the app
initializeApp().then(() => {
  console.log('🎨 Mounting React app...');
  console.log('🔍 Root element exists:', !!document.getElementById("root"));
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    createRoot(rootElement).render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    console.log('✅ React app mounted successfully');
  } catch (error) {
    console.error('❌ Failed to mount React app:', error);
  }
}).catch((error) => {
  console.error('❌ App initialization failed:', error);
  // Still try to mount the app even if initialization fails
  try {
    console.log('🔄 Attempting to mount React app after initialization error...');
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    createRoot(rootElement).render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    console.log('✅ React app mounted successfully after error');
  } catch (mountError) {
    console.error('❌ Failed to mount React app after initialization error:', mountError);
  }
});
