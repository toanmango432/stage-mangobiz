import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    // Environment variables for MSW and standalone mode
    __MODE__: JSON.stringify(process.env.MODE || 'standalone'),
    __MOCK_TURBULENCE__: JSON.stringify(process.env.MOCK_TURBULENCE === 'true'),
    __FEATURE_AI__: JSON.stringify(process.env.FEATURE_AI === 'true'),
    // Define process for browser compatibility
    'process.env': '{}',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  envPrefix: ['VITE_', 'MODE', 'MOCK_TURBULENCE', 'FEATURE_AI'],
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          
          // App chunks by feature
          'admin': [
            './src/pages/admin/Dashboard.tsx',
            './src/pages/admin/Analytics.tsx',
            './src/pages/admin/Storefront.tsx'
          ],
          'booking': [
            './src/pages/Book.tsx',
            './src/pages/BookingFlow.tsx',
            './src/hooks/useBookingFlow.ts'
          ],
          'shop': [
            './src/pages/Shop.tsx',
            './src/pages/ProductDetail.tsx',
            './src/pages/Cart.tsx'
          ]
        }
      }
    },
    // Target modern browsers for better optimization
    target: 'es2020',
    // Minimize
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Source maps for production debugging
    sourcemap: mode !== 'production'
  },
  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['msw', 'msw/browser', 'msw/node']
  }
}));
