import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true, open: false })
  ],
  server: {
    host: true, // 0.0.0.0으로 바뀜 (Docker용)
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 큰 라이브러리들을 별도 청크로 분리
          three: ['three'],
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['highcharts', 'highcharts-react-official', 'recharts'],
          pdf: ['html2pdf.js'],
          sentry: ['@sentry/react', '@sentry/types', '@sentry/utils'],
          utils: ['axios', 'zustand', 'styled-components']
        },
      },
    },
    // 압축 최적화 (esbuild 사용)
    minify: 'esbuild',
    // 청크 크기 경고 임계값 증가
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['three']
  },
})

