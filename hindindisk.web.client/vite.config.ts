import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes', generatedRouteTree: './src/routeTree.gen.ts' }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  base: '/',
  server: {
    proxy: {
      '/api': 'http://localhost:5228',
      '/hubs': { target: 'http://localhost:5228', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    rolldownOptions: {
      onwarn(warning, warn) {
        // @microsoft/signalr's own bundled code has a misplaced /*#__PURE__*/ comment —
        // harmless (skips one dead-code-elimination optimization), not our code to fix.
        if (warning.code === 'INVALID_ANNOTATION') return;
        warn(warning);
      },
    },
  },
})
