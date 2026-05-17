import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const normalizedId = id.replaceAll('\\', '/')
          if (
            normalizedId.includes('/node_modules/react/')
            || normalizedId.includes('/node_modules/react-dom/')
            || normalizedId.includes('/node_modules/scheduler/')
          ) return 'vendor-react'
          if (normalizedId.includes('/node_modules/@tanstack/')) return 'vendor-router'
          if (
            normalizedId.includes('/node_modules/i18next/')
            || normalizedId.includes('/node_modules/react-i18next/')
            || normalizedId.includes('/node_modules/i18next-browser-languagedetector/')
          ) return 'vendor-i18n'
          if (normalizedId.includes('/node_modules/@tauri-apps/')) return 'vendor-tauri'
          return 'vendor'
        },
      },
    },
  },
})
