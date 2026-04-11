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
import './App.css';

// 큰 라이브러리를 사용하는 페이지들을 지연 로딩
const DrawingPage = lazy(() => import('./pages/DrawingPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const VoiceChattingPage = lazy(() => import('./pages/VoiceChattingPage'));
const TextChattingPage = lazy(() => import('./pages/TextChattingPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<InitPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/ad8" element={<AD8Page />} />
          <Route path="/drawing" element={<ProtectedRoute requiredChat={true} alertMessage="대화 검사를 먼저 완료해주세요." redirectCardIndex={1}><DrawingPage /></ProtectedRoute>} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/report" element={<ProtectedRoute requiredDrawing={true} alertMessage="그림 검사를 먼저 완료해주세요." redirectCardIndex={2}><ReportPage /></ProtectedRoute>} />
          <Route path="/report/:reportId" element={<ReportPage />} />
          <Route path="/chatting-select" element={<ProtectedRoute requiredAD8={true} alertMessage="AD8 검사를 먼저 완료해주세요." redirectCardIndex={0}><ChattingSelectPage /></ProtectedRoute>} />
          <Route path="/chatting/voice" element={<ProtectedRoute requiredAD8={true} alertMessage="AD8 검사를 먼저 완료해주세요." redirectCardIndex={0}><VoiceChattingPage /></ProtectedRoute>} />
          <Route path="/chatting/text" element={<ProtectedRoute requiredAD8={true} alertMessage="AD8 검사를 먼저 완료해주세요." redirectCardIndex={0}><TextChattingPage /></ProtectedRoute>} />
          {/* Lighthouse 테스트용 임시 라우트 (ProtectedRoute 없이 직접 접근) */}
          <Route path="/lighthouse-voice" element={<VoiceChattingPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
