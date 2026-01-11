import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 5175,
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
          // Core React + Redux (essential for app shell)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Database and API (can load async)
          'vendor-data': ['@supabase/supabase-js', 'dexie'],
          // UI utilities
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          // QR code (only needed on scan page)
          'vendor-qr': ['html5-qrcode'],
          // Security
          'vendor-security': ['dompurify'],
        },
      },
    },
  }
});
