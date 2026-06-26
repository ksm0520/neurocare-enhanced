import type { AxiosError } from 'axios';
import type { Event, EventHint } from '@sentry/types';

type SentryClient = typeof import('@sentry/react');

export type SentryFeature =
  | 'auth'
  | 'ad8'
  | 'drawing'
  | 'text_chat'
  | 'voice_chat'
  | 'report'
  | 'mypage'
  | 'onboarding';

export type SentryErrorKind = 'api' | 'render' | 'stream' | 'voice_task' | 'unknown';

type SentryLevel = 'fatal' | 'error' | 'warning' | 'info';

interface BaseCaptureContext {
  feature: SentryFeature;
  handled?: boolean;
  userId?: string;
  reportId?: string;
  chatId?: string;
  voiceTaskId?: string;
  retry?: boolean;
  fallbackProvided?: boolean;
}

export interface ApiErrorCaptureContext extends BaseCaptureContext {
  method: string;
  routeTemplate: string;
  status: number;
}

export interface StreamErrorCaptureContext extends BaseCaptureContext {
  reason: string;
  routeTemplate?: string;
}

export interface VoiceTaskErrorCaptureContext extends BaseCaptureContext {
  reason: string;
  routeTemplate?: string;
}

export interface RenderErrorCaptureContext extends BaseCaptureContext {
  componentName: string;
}

const IGNORED_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
];

const DENY_URL_PATTERNS = [/^chrome-extension:\/\//, /^moz-extension:\/\//];

const SECRET_KEY_PATTERN =
  /authorization|access[_-]?token|refresh[_-]?token|password|cookie|secret|api[_-]?key/i;

const PII_KEY_PATTERN = /email|phone|주민|ssn/i;

const USER_CONTENT_KEY_PATTERN =
  /message|text|content|transcript|conversation|chat[_-]?history|audio|audio[_-]?content|file[_-]?name|filename|original[_-]?name|path/i;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const PHONE_PATTERN = /\b01[016789]-?\d{3,4}-?\d{4}\b/g;
const RRN_PATTERN = /\b\d{6}-?[1-4]\d{6}\b/g;

let sentryClientPromise: Promise<SentryClient> | null = null;

function scrubValue(key: string, value: unknown): unknown {
  if (SECRET_KEY_PATTERN.test(key) || PII_KEY_PATTERN.test(key) || USER_CONTENT_KEY_PATTERN.test(key)) {
    return '[Filtered]';
  }
  if (typeof value === 'string') {
    return value
      .replace(BEARER_PATTERN, '[Filtered]')
      .replace(EMAIL_PATTERN, '[Filtered]')
      .replace(PHONE_PATTERN, '[Filtered]')
      .replace(RRN_PATTERN, '[Filtered]');
  }
  return value;
}

function scrubObject(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(scrubObject);
  }
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null ? scrubObject(value) : scrubValue(key, value),
      ]),
    );
  }
  return input;
}

function scrubUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0];
  }
}

function beforeSend(event: Event, _hint: EventHint): Event | null {
  if (event.message) {
    event.message = scrubValue('event_message', event.message) as string;
  }
  if (event.request?.url) {
    event.request.url = scrubUrl(event.request.url);
  }
  if (event.request?.headers) {
    event.request.headers = scrubObject(event.request.headers) as Record<string, string>;
  }
  if (event.request?.cookies) {
    event.request.cookies = {};
  }
  if (event.request?.data) {
    event.request.data = scrubObject(event.request.data);
  }
  if (event.extra) {
    event.extra = scrubObject(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = scrubObject(event.contexts) as Event['contexts'];
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.message ? (scrubValue('breadcrumb_message', breadcrumb.message) as string) : breadcrumb.message,
      data: breadcrumb.data ? (scrubObject(breadcrumb.data) as Record<string, unknown>) : breadcrumb.data,
    }));
  }
  return event;
}

/** URL path에서 ID를 제거한 route template 생성 */
export function normalizeRouteTemplate(path: string): string {
  return path
    .split('?')[0]
    .replace(/\/reports\/\d+/g, '/reports/{reportId}')
    .replace(/\/chat\/logs\/\d+/g, '/chat/logs/{id}')
    .replace(/\/chat\/chats\/\d+/g, '/chat/chats/{chatId}')
    .replace(/\/chat\/task-status\/[^/]+/g, '/chat/task-status/{taskId}');
}

function inferFeatureFromRoute(routeTemplate: string): SentryFeature {
  if (routeTemplate.startsWith('/user')) return 'auth';
  if (routeTemplate.startsWith('/ad8')) return 'ad8';
  if (routeTemplate.startsWith('/drawing')) return 'drawing';
  if (routeTemplate === '/chat/voice' || routeTemplate.startsWith('/chat/task-status')) {
    return 'voice_chat';
  }
  if (routeTemplate.startsWith('/chat')) return 'text_chat';
  if (routeTemplate.startsWith('/reports')) return 'report';
  if (routeTemplate.startsWith('/mypage')) return 'mypage';
  return 'unknown' as SentryFeature;
}

export function shouldCaptureApiError(
  method: string,
  routeTemplate: string,
  status: number,
): boolean {
  const normalizedMethod = method.toUpperCase();
  if (status === 401 && normalizedMethod === 'POST' && routeTemplate === '/user/login') {
    return false;
  }
  if (status >= 500) return true;
  if (status === 403 || status === 404) return true;
  return false;
}

function apiErrorLevel(status: number): SentryLevel {
  if (status >= 500) return 'error';
  return 'warning';
}

function getSentryClient(): Promise<SentryClient> | null {
  if (!import.meta.env.VITE_SENTRY_DSN) return null;

  if (!sentryClientPromise) {
    sentryClientPromise = new Promise((resolve) => {
      requestAnimationFrame(() => {
        void import('@sentry/react').then((Sentry) => {
          Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            ...(import.meta.env.VITE_SENTRY_RELEASE
              ? { release: import.meta.env.VITE_SENTRY_RELEASE }
              : {}),
            integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
            tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            environment: import.meta.env.MODE,
            ignoreErrors: IGNORED_ERRORS,
            denyUrls: DENY_URL_PATTERNS,
            beforeSend,
            beforeBreadcrumb(breadcrumb) {
              if (breadcrumb.message) {
                breadcrumb.message = scrubValue('breadcrumb_message', breadcrumb.message) as string;
              }
              if (breadcrumb.data) {
                breadcrumb.data = scrubObject(breadcrumb.data) as Record<string, unknown>;
              }
              return breadcrumb;
            },
          });
          resolve(Sentry);
        });
      });
    });
  }

  return sentryClientPromise;
}

function withSentryCapture(run: (Sentry: SentryClient) => void): void {
  const sentryClient = getSentryClient();
  if (!sentryClient) return;
  void sentryClient.then(run);
}

function applyBaseScope(
  scope: import('@sentry/react').Scope,
  ctx: BaseCaptureContext,
  errorKind: SentryErrorKind,
): void {
  scope.setTag('feature', ctx.feature);
  scope.setTag('error.kind', errorKind);
  scope.setTag('handled', String(ctx.handled ?? true));
  scope.setTag('environment', import.meta.env.MODE);

  const context: Record<string, unknown> = {};
  if (ctx.userId) context.userId = ctx.userId;
  if (ctx.reportId) context.reportId = ctx.reportId;
  if (ctx.chatId) context.chatId = ctx.chatId;
  if (ctx.voiceTaskId) context.voiceTaskId = ctx.voiceTaskId;
  if (ctx.retry !== undefined) context.retry = ctx.retry;
  if (ctx.fallbackProvided !== undefined) context.fallbackProvided = ctx.fallbackProvided;
  if (Object.keys(context).length > 0) {
    scope.setContext('app', context);
  }
}

export function captureApiError(ctx: ApiErrorCaptureContext, cause?: unknown): void {
  if (!shouldCaptureApiError(ctx.method, ctx.routeTemplate, ctx.status)) return;

  const message = `APIError: ${ctx.method.toUpperCase()} ${ctx.routeTemplate} ${ctx.status}`;
  const error = cause instanceof Error ? new Error(message, { cause }) : new Error(message);

  withSentryCapture((Sentry) => {
    Sentry.withScope((scope) => {
      scope.setLevel(apiErrorLevel(ctx.status));
      scope.setTag('route_template', ctx.routeTemplate);
      scope.setTag('status', String(ctx.status));
      scope.setFingerprint(['api', ctx.method.toUpperCase(), ctx.routeTemplate, String(ctx.status)]);
      applyBaseScope(scope, ctx, 'api');
      scope.setContext('api', {
        method: ctx.method.toUpperCase(),
        routeTemplate: ctx.routeTemplate,
        status: ctx.status,
      });
      Sentry.captureException(error);
    });
  });
}

export function captureApiErrorFromAxios(error: AxiosError, overrides?: Partial<ApiErrorCaptureContext>): void {
  const method = (error.config?.method ?? 'GET').toUpperCase();
  const url = error.config?.url ?? '';
  const routeTemplate = normalizeRouteTemplate(url.startsWith('/') ? url : `/${url}`);
  const status = error.response?.status ?? 0;

  if (!status) return;

  captureApiError({
    feature: overrides?.feature ?? inferFeatureFromRoute(routeTemplate),
    method,
    routeTemplate,
    status,
    handled: overrides?.handled,
    userId: overrides?.userId,
    reportId: overrides?.reportId,
    chatId: overrides?.chatId,
    voiceTaskId: overrides?.voiceTaskId,
    retry: overrides?.retry,
    fallbackProvided: overrides?.fallbackProvided ?? true,
  }, error);
}

export function captureStreamError(ctx: StreamErrorCaptureContext, cause?: unknown): void {
  const message = `StreamError: ${ctx.reason}`;
  const error = cause instanceof Error ? new Error(message, { cause }) : new Error(message);

  withSentryCapture((Sentry) => {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      if (ctx.routeTemplate) scope.setTag('route_template', ctx.routeTemplate);
      scope.setFingerprint(['stream', ctx.reason]);
      applyBaseScope(scope, ctx, 'stream');
      scope.setContext('stream', {
        reason: ctx.reason,
        routeTemplate: ctx.routeTemplate,
      });
      Sentry.captureException(error);
    });
  });
}

export function captureVoiceTaskError(ctx: VoiceTaskErrorCaptureContext, cause?: unknown): void {
  const message = `VoiceTaskError: ${ctx.reason}`;
  const error = cause instanceof Error ? new Error(message, { cause }) : new Error(message);

  withSentryCapture((Sentry) => {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      if (ctx.routeTemplate) scope.setTag('route_template', ctx.routeTemplate);
      scope.setFingerprint(['voice_task', ctx.reason]);
      applyBaseScope(scope, ctx, 'voice_task');
      scope.setContext('voice_task', {
        reason: ctx.reason,
        routeTemplate: ctx.routeTemplate,
      });
      Sentry.captureException(error);
    });
  });
}

export function captureRenderError(ctx: RenderErrorCaptureContext, cause?: unknown): void {
  const message = `RenderError: ${ctx.componentName}`;
  const error = cause instanceof Error ? new Error(message, { cause }) : new Error(message);

  withSentryCapture((Sentry) => {
    Sentry.withScope((scope) => {
      scope.setLevel('fatal');
      scope.setFingerprint(['render', ctx.componentName]);
      applyBaseScope(scope, { ...ctx, handled: ctx.handled ?? false }, 'render');
      scope.setContext('render', { componentName: ctx.componentName });
      Sentry.captureException(error);
    });
  });
}

export function initSentry(): void {
  const sentryClient = getSentryClient();
  if (!sentryClient) return;

  if (import.meta.env.DEV) {
    void sentryClient.then(() =>
      import('../mocks/run-sentry-phase0-mocks').then(
        ({ getSentryMockScenario, runSentryPhase0Mock }) => {
          const scenario = getSentryMockScenario();
          if (scenario) runSentryPhase0Mock(scenario);
        },
      ),
    );
  }
}
