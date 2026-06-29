import { ErrorBoundary } from '@sentry/react';
import type { ReactNode } from 'react';
import { applyRenderErrorScope, type RenderErrorCaptureContext, type SentryFeature } from '../lib/sentry';
import SentryErrorFallback from './SentryErrorFallback';

interface SentryRouteErrorBoundaryProps {
  componentName: string;
  feature: SentryFeature;
  children: ReactNode;
}

export default function SentryRouteErrorBoundary({
  componentName,
  feature,
  children,
}: SentryRouteErrorBoundaryProps) {
  const captureContext: RenderErrorCaptureContext = {
    componentName,
    feature,
  };

  return (
    <ErrorBoundary
      beforeCapture={(scope) => {
        applyRenderErrorScope(scope, captureContext);
      }}
      fallback={({ resetError }) => (
        <SentryErrorFallback componentName={componentName} onRetry={resetError} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
