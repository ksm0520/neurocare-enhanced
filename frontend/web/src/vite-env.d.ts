/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string
  /** Vercel/GHA 빌드 시 neurocare-web@<git-sha>, 로컬 dev는 빈 문자열 */
  readonly VITE_SENTRY_RELEASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
