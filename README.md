<h1 align="center">Neurocare <small>(Enhanced)</small></h1>

<div align="center">
  <h3><b>온보딩 성능 · 관측성 고도화</b></h3>
  <p>Three.js 파티클 최적화, Sentry 지연 초기화, Prometheus/Grafana 구성 정리.</p>
  <br>
  <img width="900" src="https://raw.githubusercontent.com/ksm0520/practice/main/images/Neurocare/main.png" alt="Neurocare">
</div>

<br>

# 📖 목차

* [개인 고도화](#personal-enhancements)
* [기술 스택](#tech-stack)
* [모니터링](#monitoring)
* [로컬 실행](#local-run)

<br>

<a id="personal-enhancements"></a>

# ✨ 개인 고도화

**온보딩(초기 진입) 체감 성능**과 **실시간 관측**을 중심으로 개선했습니다.

## Three.js 온보딩 렌더링 최적화

온보딩에 **약 8,000개 파티클**을 쓰면서 메인 스레드 점유가 커지고, 렌더링 블로킹·**LCP(Largest Contentful Paint)** 지연이 발생하는 문제가 있었습니다.

| 구분 | 내용 |
|------|------|
| **문제** | 대량 파티클로 인한 메인 스레드 부하, 프레임 드랍·LCP 악화 |
| **접근** | **동적 import**로 Three.js 초기 비용 분리, 루프 내 **객체 재사용(Vector3 등)** 으로 GC·할당 부담 감소, **프레임 스킵**으로 불필요한 연산 축소 |
| **결과(측정)** | 실행 비용 **약 488ms → 148ms(약 70% 감소)**, LCP **약 4.6s → 3.7s**, 초기 체감 속도·프레임 안정성 개선 |

## 관측: Sentry · Prometheus · Grafana

- **Sentry**: 프론트엔드 오류·세션 리플레이·브라우저 트레이싱. `VITE_SENTRY_DSN`이 있을 때만 동작하도록 **`frontend/web/src/main.tsx`에서 지연 로딩**해 첫 페인트 부담을 줄였습니다.
- **Prometheus / Grafana**: API·인프라 메트릭 수집·프로비저닝은 레포 루트의 `prometheus`, `grafana/provisioning` 을 기준으로 정리했습니다.

<br>

<a id="tech-stack"></a>

# 💻 기술 스택

<div align="center">
  <table>
    <tr>
      <th>구분</th>
      <th>사용 기술</th>
    </tr>
    <tr>
      <td><b>Frontend</b></td>
      <td>
        <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
        <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
        <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
        <img src="https://img.shields.io/badge/Three.js-515A6E?style=for-the-badge&logo=threejs&logoColor=white">
        <img src="https://img.shields.io/badge/Styled--Components-DB7093?style=for-the-badge&logo=styled-components&logoColor=white">
        <img src="https://img.shields.io/badge/Zustand-3E8EF7?style=for-the-badge&logo=zustand&logoColor=white">
        <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>Backend</b></td>
      <td>
        <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white">
        <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white">
        <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>Data</b></td>
      <td>
        <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
        <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
        <img src="https://img.shields.io/badge/AmazonS3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>AI</b></td>
      <td>
        <img src="https://img.shields.io/badge/OpenAI-74aa9c?style=for-the-badge&logo=openai&logoColor=white">
        <img src="https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>DevOps</b></td>
      <td>
        <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
        <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>Observability</b></td>
      <td>
        <img src="https://img.shields.io/badge/Sentry-FF5722?style=for-the-badge&logo=sentry&logoColor=white">
        <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white">
        <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white">
      </td>
    </tr>
  </table>
</div>

<br>

<a id="monitoring"></a>

# 📊 모니터링

- **Sentry**: 프론트 예외·세션 리플레이(환경 변수로 DSN 주입).
- **Prometheus**: 스크랩 타깃은 `prometheus/prometheus.yml` 에서 관리.
- **Grafana**: 데이터소스·대시보드는 `grafana/provisioning` (고도화 과정에서 불필요한 대시보드 JSON 일부 제거).

<br>

<a id="local-run"></a>

# 🧐 로컬 실행

1. 레포 클론 후 루트에서 `backend/.env` 등 필요한 환경 변수를 설정합니다.
2. **Docker** (루트 `docker-compose.yml` 기준):

```bash
docker compose up -d --build
```

3. **프론트만** (`frontend/web`):

```bash
cd frontend/web
npm install
npm run dev
```

선택: Sentry를 켜려면 `frontend/web`에 `VITE_SENTRY_DSN` 을 설정합니다.

<br>
