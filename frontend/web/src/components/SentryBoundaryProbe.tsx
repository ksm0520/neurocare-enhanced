/**
 * dev 또는 VITE_SENTRY_ALLOW_MOCK 시 ?sentry-boundary-test=1 로 Error Boundary 검증.
 */
export default function SentryBoundaryProbe() {
  const allowProbe =
    import.meta.env.DEV || import.meta.env.VITE_SENTRY_ALLOW_MOCK === 'true';

  if (!allowProbe) return null;

  const params = new URLSearchParams(window.location.search);
  if (!params.has('sentry-boundary-test')) return null;

  throw new Error(`RenderError: BoundaryProbe (${import.meta.env.MODE})`);
}
