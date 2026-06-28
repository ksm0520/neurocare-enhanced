/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string
  /** Vercel/GHA 빌드 시 neurocare-web@<git-sha>, 로컬 dev는 빈 문자열 */
  readonly VITE_SENTRY_RELEASE: string
  /** production mock URL (?sentry-mock=...) — portfolio/검증용, Vercel에서 true 설정 */
  readonly VITE_SENTRY_ALLOW_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
