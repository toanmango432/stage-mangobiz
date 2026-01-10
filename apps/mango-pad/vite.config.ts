import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 5176,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate large dependencies
          'vendor-react': ['react', 'react-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-motion': ['framer-motion'],
          'vendor-mqtt': ['mqtt'],
          // Settings page is large (~900 lines) - separate chunk
          'settings': ['./src/pages/SettingsPage.tsx'],
        },
      },
    },
    // Increase chunk size warning limit (we're optimizing with code splitting)
    chunkSizeWarningLimit: 300,
  },
});
