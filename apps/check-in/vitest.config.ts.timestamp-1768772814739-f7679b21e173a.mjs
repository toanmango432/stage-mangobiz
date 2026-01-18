// vitest.config.ts
import { defineConfig } from "file:///Users/seannguyen/Winsurf%20built/Mango%20POS%20Offline%20V2/node_modules/.pnpm/vitest@1.6.1_@types+node@25.0.6_happy-dom@20.0.11_jsdom@24.1.3_terser@5.44.1/node_modules/vitest/dist/config.js";
import react from "file:///Users/seannguyen/Winsurf%20built/Mango%20POS%20Offline%20V2/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@6.4.1_@types+node@25.0.6_jiti@1.21.7_terser@5.44.1_yaml@2.8.2_/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/seannguyen/Winsurf built/Mango POS Offline V2/apps/check-in";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/testing/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/testing/**"]
    }
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9zZWFubmd1eWVuL1dpbnN1cmYgYnVpbHQvTWFuZ28gUE9TIE9mZmxpbmUgVjIvYXBwcy9jaGVjay1pblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NlYW5uZ3V5ZW4vV2luc3VyZiBidWlsdC9NYW5nbyBQT1MgT2ZmbGluZSBWMi9hcHBzL2NoZWNrLWluL3ZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NlYW5uZ3V5ZW4vV2luc3VyZiUyMGJ1aWx0L01hbmdvJTIwUE9TJTIwT2ZmbGluZSUyMFYyL2FwcHMvY2hlY2staW4vdml0ZXN0LmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGVzdC9jb25maWcnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBzZXR1cEZpbGVzOiBbJy4vc3JjL3Rlc3Rpbmcvc2V0dXAudHMnXSxcbiAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnt0ZXN0LHNwZWN9Lnt0cyx0c3h9J10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcbiAgICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoue3RzLHRzeH0nXSxcbiAgICAgIGV4Y2x1ZGU6IFsnc3JjLyoqLyoudGVzdC57dHMsdHN4fScsICdzcmMvdGVzdGluZy8qKiddLFxuICAgIH0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvWSxTQUFTLG9CQUFvQjtBQUNqYSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBRnhCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMsd0JBQXdCO0FBQUEsSUFDckMsU0FBUyxDQUFDLCtCQUErQjtBQUFBLElBQ3pDLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxNQUM3QixTQUFTLENBQUMsMEJBQTBCLGdCQUFnQjtBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUNqQztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
