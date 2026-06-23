/** Phase 0 mock — 블로그/검증용 고정 ID (실제 환자 데이터 사용 금지) */
export const SENTRY_MOCK_IDS = {
  userId: 'demo-user-001',
  reportId: '9001',
  chatId: '9101',
  voiceTaskId: 'mock-voice-0001',
} as const;

export const SENTRY_MOCK_SCENARIOS = [
  'render',
  'report-500',
  'stream-parse',
  'voice-timeout',
  'login-401',
] as const;

export type SentryMockScenario = (typeof SENTRY_MOCK_SCENARIOS)[number];

export function isSentryMockScenario(value: string): value is SentryMockScenario {
  return (SENTRY_MOCK_SCENARIOS as readonly string[]).includes(value);
}
