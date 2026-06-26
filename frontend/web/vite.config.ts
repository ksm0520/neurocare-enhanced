import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'

const SENTRY_RELEASE_PREFIX = 'neurocare-web'

function getGitSha(): string | undefined {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA
}

function getSentryRelease(): string | undefined {
  const sha = getGitSha()
  return sha ? `${SENTRY_RELEASE_PREFIX}@${sha}` : undefined
}

function isSentrySourceMapUploadEnabled(): boolean {
  return Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT &&
      getSentryRelease(),
  )
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  const sentryRelease = getSentryRelease()
  const uploadSourceMaps = isSentrySourceMapUploadEnabled()

  return {
    define: {
      'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(sentryRelease ?? ''),
    },
    plugins: [
      react(),
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
      ...(uploadSourceMaps
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG!,
              project: process.env.SENTRY_PROJECT!,
              authToken: process.env.SENTRY_AUTH_TOKEN,
              release: {
                name: sentryRelease!,
              },
              sourcemaps: {
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
              },
            }),
          ]
        : []),
    ],
    server: {
      host: true,
      port: 3000,
    },
    build: {
      sourcemap: uploadSourceMaps ? ('hidden' as const) : false,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            charts: ['highcharts', 'highcharts-react-official', 'recharts'],
            pdf: ['html2pdf.js'],
            sentry: ['@sentry/react', '@sentry/types', '@sentry/utils'],
            utils: ['axios', 'zustand', 'styled-components'],
          },
        },
      },
      minify: 'esbuild' as const,
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['three'],
    },
  }
})
