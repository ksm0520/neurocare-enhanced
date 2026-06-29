import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import InitPage from './pages/InitPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';
import MyPage from './pages/MyPage';
import AD8Page from './pages/AD8Page';
import LoadingPage from './pages/LoadingPage';
import ChattingSelectPage from './pages/ChattingSelectPage';
import ProtectedRoute from './components/ProtectedRoute';
import SentryBoundaryProbe from './components/SentryBoundaryProbe';
import SentryRouteErrorBoundary from './components/SentryRouteErrorBoundary';
import './App.css';

const DrawingPage = lazy(() => import('./pages/DrawingPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const VoiceChattingPage = lazy(() => import('./pages/VoiceChattingPage'));
const TextChattingPage = lazy(() => import('./pages/TextChattingPage'));

function App() {
  return (
    <Router>
      <SentryRouteErrorBoundary componentName="App" feature="onboarding">
        <SentryBoundaryProbe />
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<InitPage />} />
            <Route
              path="/login"
              element={
                <SentryRouteErrorBoundary componentName="LoginPage" feature="auth">
                  <LoginPage />
                </SentryRouteErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <SentryRouteErrorBoundary componentName="RegisterPage" feature="auth">
                  <RegisterPage />
                </SentryRouteErrorBoundary>
              }
            />
            <Route path="/main" element={<MainPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route
              path="/ad8"
              element={
                <SentryRouteErrorBoundary componentName="AD8Page" feature="ad8">
                  <AD8Page />
                </SentryRouteErrorBoundary>
              }
            />
            <Route
              path="/drawing"
              element={
                <SentryRouteErrorBoundary componentName="DrawingPage" feature="drawing">
                  <ProtectedRoute
                    requiredChat={true}
                    alertMessage="대화 검사를 먼저 완료해주세요."
                    redirectCardIndex={1}
                  >
                    <DrawingPage />
                  </ProtectedRoute>
                </SentryRouteErrorBoundary>
              }
            />
            <Route path="/loading" element={<LoadingPage />} />
            <Route
              path="/report"
              element={
                <SentryRouteErrorBoundary componentName="ReportPage" feature="report">
                  <ProtectedRoute
                    requiredDrawing={true}
                    alertMessage="그림 검사를 먼저 완료해주세요."
                    redirectCardIndex={2}
                  >
                    <ReportPage />
                  </ProtectedRoute>
                </SentryRouteErrorBoundary>
              }
            />
            <Route
              path="/report/:reportId"
              element={
                <SentryRouteErrorBoundary componentName="ReportPage" feature="report">
                  <ReportPage />
                </SentryRouteErrorBoundary>
              }
            />
            <Route path="/chatting-select" element={<ProtectedRoute requiredAD8={true} alertMessage="AD8 검사를 먼저 완료해주세요." redirectCardIndex={0}><ChattingSelectPage /></ProtectedRoute>} />
            <Route
              path="/chatting/voice"
              element={
                <SentryRouteErrorBoundary componentName="VoiceChattingPage" feature="voice_chat">
                  <ProtectedRoute
                    requiredAD8={true}
                    alertMessage="AD8 검사를 먼저 완료해주세요."
                    redirectCardIndex={0}
                  >
                    <VoiceChattingPage />
                  </ProtectedRoute>
                </SentryRouteErrorBoundary>
              }
            />
            <Route
              path="/chatting/text"
              element={
                <SentryRouteErrorBoundary componentName="TextChattingPage" feature="text_chat">
                  <ProtectedRoute
                    requiredAD8={true}
                    alertMessage="AD8 검사를 먼저 완료해주세요."
                    redirectCardIndex={0}
                  >
                    <TextChattingPage />
                  </ProtectedRoute>
                </SentryRouteErrorBoundary>
              }
            />
            <Route path="/lighthouse-voice" element={<VoiceChattingPage />} />
          </Routes>
        </Suspense>
      </SentryRouteErrorBoundary>
    </Router>
  );
}

export default App;
