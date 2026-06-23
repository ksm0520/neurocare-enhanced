import {
  captureApiError,
  captureRenderError,
  captureStreamError,
  captureVoiceTaskError,
  shouldCaptureApiError,
} from '../lib/sentry';
import {
  SENTRY_MOCK_IDS,
  isSentryMockScenario,
  type SentryMockScenario,
} from './sentry-mock-ids';

/** ?sentry-mock=<scenario> 또는 레거시 ?sentry-test=1 */
export function getSentryMockScenario(): SentryMockScenario | null {
  const params = new URLSearchParams(window.location.search);
  const mock = params.get('sentry-mock');
  if (mock) {
    if (isSentryMockScenario(mock)) return mock;
    console.warn(`[sentry-mock] 알 수 없는 시나리오: ${mock}`);
    console.warn(`[sentry-mock] 사용 가능: render | report-500 | stream-parse | voice-timeout | login-401`);
    return null;
  }
  if (params.has('sentry-test')) return 'render';
  return null;
}

/**
 * Phase 0: 외부 API 없이 Sentry 수신 검증용 mock.
 * Phase 1 capture wrapper + fingerprint 정책을 그대로 사용한다.
 */
export function runSentryPhase0Mock(scenario: SentryMockScenario): void {
  const ids = SENTRY_MOCK_IDS;

  switch (scenario) {
    case 'render':
      captureRenderError({
        feature: 'onboarding',
        componentName: 'InitPage',
        userId: ids.userId,
      });
      console.info('[sentry-mock] render → Sentry 전송됨');
      break;

    case 'report-500':
      captureApiError({
        feature: 'report',
        method: 'POST',
        routeTemplate: '/reports/empty',
        status: 500,
        userId: ids.userId,
        reportId: ids.reportId,
        fallbackProvided: true,
      });
      console.info('[sentry-mock] report-500 → Sentry 전송됨');
      break;

    case 'stream-parse':
      captureStreamError({
        feature: 'text_chat',
        reason: 'invalid-json',
        routeTemplate: '/chat/stream',
        userId: ids.userId,
        chatId: ids.chatId,
        fallbackProvided: true,
      });
      console.info('[sentry-mock] stream-parse → Sentry 전송됨');
      break;

    case 'voice-timeout':
      captureVoiceTaskError({
        feature: 'voice_chat',
        reason: 'timeout',
        routeTemplate: '/chat/task-status/{taskId}',
        userId: ids.userId,
        voiceTaskId: ids.voiceTaskId,
        fallbackProvided: true,
      });
      console.info('[sentry-mock] voice-timeout → Sentry 전송됨');
      break;

    case 'login-401': {
      const wouldCapture = shouldCaptureApiError('POST', '/user/login', 401);
      console.info(
        `[sentry-mock] login-401: APIError POST /user/login 401 (handled) — Sentry ${wouldCapture ? '전송됨' : '전송 안 함'}`,
      );
      console.info('[sentry-mock] Issues에 새 이벤트가 없는지 Sentry에서 확인하세요.');
      break;
    }

    default:
      break;
  }
}
