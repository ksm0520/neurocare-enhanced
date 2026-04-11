import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import InitBackground from "../components/InitBackground";

/**
 * InitPage 컴포넌트 - 온보딩 페이지
 * 
 * Three.js를 사용하여 3D 파티클로 구성된 인터랙티브한 뇌 모양을 표현합니다.
 * 사용자의 마우스 움직임에 반응하고, 클릭 시 애니메이션 효과와 함께 시작 버튼을 보여줍니다.
 */
export default function InitPage() {
  // Three.js 캔버스를 담을 div 요소의 참조
  const canvasRef = useRef<HTMLDivElement>(null);
  // 사용자 상호작용 완료 상태
  const [interactionCompleted, setInteractionCompleted] = useState(false);
  // 배경 렌더링 지연 상태 (LCP 개선을 위해 텍스트가 먼저 렌더링되도록)
  const [showBackground, setShowBackground] = useState(false);
  const navigate = useNavigate();
  
  // 배경 렌더링 지연: LCP 요소(텍스트)가 먼저 렌더링되도록
  useEffect(() => {
    // requestAnimationFrame 2회로 텍스트가 먼저 렌더링되도록 충분한 지연 확보
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShowBackground(true);
      });
    });
  }, []);
  
  useEffect(() => {
    // Three.js 동적 로딩: 초기 번들에서 제외하고, 페이지 진입 시 로드
    // Three.js 관련 변수 선언 (타입만 import로 참조)
    let scene: import('three').Scene;
    let camera: import('three').PerspectiveCamera;
    let renderer: import('three').WebGLRenderer;
    let brainParticles: import('three').Points;
    let animationFrameId: number;
    let mouse: import('three').Vector2;  // 마우스 위치 초기값을 화면 밖으로 설정
    let clock: import('three').Clock;  // 애니메이션 타이밍을 위한 시계
    // 프레임 스킵 변수
    let lastFrameTime = 0;
    const targetFPS = 30;
    const minFrameInterval = 1000 / targetFPS;
    // three 심볼들을 구조분해로 불러오기 전에 바인딩을 선언해 타입 에러를 방지
    // 런타임에는 아래 비동기 import에서 실제 생성자/상수를 할당합니다.
    let Scene: any,
        PerspectiveCamera: any,
        WebGLRenderer: any,
        AmbientLight: any,
        DirectionalLight: any,
        BufferGeometry: any,
        BufferAttribute: any,
        PointsMaterial: any,
        Points: any,
        Vector2: any,
        Vector3: any,
        Clock: any,
        Color: any,
        AdditiveBlending: any;

    /**
     * Three.js 초기화 함수
     * 씬, 카메라, 렌더러 설정 및 파티클 시스템 생성
     */
    const init = () => {
      // 기본 Three.js 설정
      scene = new Scene();
      camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 25;  // 카메라 위치 설정

      // 렌더러 설정
      renderer = new WebGLRenderer({ 
        antialias: false,  // 안티앨리어싱 제거 (성능 향상)
        alpha: true,
        powerPreference: "high-performance"  // GPU 우선 사용
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  // PixelRatio 제한 (고해상도 디스플레이 성능 최적화)
      
      if (canvasRef.current) {
        canvasRef.current.appendChild(renderer.domElement);
      }

      // 조명 설정
      const ambientLight = new AmbientLight(0xffffff, 0.1);  // 전역 조명
      scene.add(ambientLight);
      const directionalLight = new DirectionalLight(0xffffff, 0.5);  // 방향 조명
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // 파티클 시스템 설정 (반응형 개수 조정)
      // 모바일(폭 < 768px): 5,000개, 그 외: 8,000개로 초기 부하를 완화
      const particleCount = window.innerWidth < 768 ? 5000 : 8000;
      const geometry = new BufferGeometry();
      const positions = new Float32Array(particleCount * 3);  // x, y, z 좌표를 위한 배열
      const colors = new Float32Array(particleCount * 3);     // r, g, b 색상을 위한 배열
      const originalRadii = new Float32Array(particleCount);  // 각 파티클의 원래 반지름 저장

      // 파티클 색상 설정
      const colorInside = new Color(0x6a0dad);   // 안쪽 색상 (보라색)
      const colorOutside = new Color(0x0077ff);  // 바깥쪽 색상 (파란색)

      // 각 파티클의 위치와 색상 계산
      for (let i = 0; i < particleCount; i++) {
        // 구면 좌표계 사용하여 파티클 위치 계산
        const theta = Math.random() * 2 * Math.PI;  // 방위각 (0 ~ 2π)
        const phi = Math.acos((Math.random() * 2) - 1);  // 극각 (0 ~ π)
        let radius = 8 + (Math.random() - 0.5) * 4;  // 기본 반지름에 랜덤 변화 추가
        // 사인/코사인 함수로 뇌 모양의 울퉁불퉁한 표면 생성
        radius += Math.sin(theta * 6) * Math.cos(phi * 8) * 1.5;
        originalRadii[i] = radius;
        
        // 구면 좌표를 직교 좌표로 변환
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // 반지름에 따른 그라데이션 색상 계산
        const color = colorInside.clone().lerp(colorOutside, (radius - 6) / 6);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      // 버퍼 지오메트리에 속성 추가
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      geometry.setAttribute('color', new BufferAttribute(colors, 3));
      geometry.setAttribute('originalRadius', new BufferAttribute(originalRadii, 1));

      // 파티클 재질 설정
      const material = new PointsMaterial({
        size: 0.1,                          // 파티클 크기
        
        vertexColors: true,                 // 개별 파티클 색상 사용
        transparent: true,                  // 투명도 활성화
        opacity: 0.8,                       // 기본 투명도
        blending: AdditiveBlending,   // 파티클 블렌딩 모드
        depthWrite: false,                  // 깊이 버퍼 비활성화
      });

      // 파티클 시스템 생성 및 씬에 추가
      brainParticles = new Points(geometry, material);
      scene.add(brainParticles);
    };

    /**
     * 창 크기 변경 시 처리 함수
     */
    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    /**
     * 마우스 이동 처리 함수
     * 마우스 좌표를 Three.js 좌표계로 변환 (-1 ~ 1 범위)
     */
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    /**
     * 애니메이션 루프 함수
     * 매 프레임마다 파티클 위치와 크기를 업데이트
     */
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // 프레임 스킵: 30fps 미만이면 건너뛰기
      const now = performance.now();
      if (now - lastFrameTime < minFrameInterval) {
        return;
      }
      
      // deltaTime 계산 (실제 경과 시간)
      const deltaTime = (now - lastFrameTime) / 1000; // ms -> sec
      lastFrameTime = now;
      
      const elapsedTime = clock.getElapsedTime();

      if (brainParticles) {
        // 회전 속도를 deltaTime으로 보정하여 프레임레이트와 무관하게 일정하게 유지
        brainParticles.rotation.y += 0.001 * 60 * deltaTime;  // 기본 회전 (60fps 기준 속도)
        
        if (!interactionCompleted) {
          // 상호작용 전: 마우스에 반응하는 파티클 움직임
          const positions = brainParticles.geometry.attributes.position.array;
          const radii = brainParticles.geometry.attributes.originalRadius.array;
          
          // Vector3 객체 재사용: 루프 밖에서 2개만 생성하여 GC 부하 감소
          const p = new Vector3();
          const mouseVec = new Vector3(mouse.x, mouse.y, 1);
          
          for (let i = 0; i < positions.length; i += 3) {
            // 기존 객체 재사용 - set()으로 값만 변경
            p.set(positions[i], positions[i+1], positions[i+2]).normalize();
            const originalRadius = radii[i / 3];
            const mouseDist = p.distanceTo(mouseVec);
            const mouseFactor = Math.max(0, 1 - mouseDist / 1.5);  // 마우스와의 거리에 따른 영향
            const waveFactor = Math.sin(originalRadius * 0.5 - elapsedTime);  // 시간에 따른 파동 효과
            const currentRadius = originalRadius + waveFactor * 0.2 + mouseFactor * 2.0;
            
            p.multiplyScalar(currentRadius);
            positions[i] = p.x;
            positions[i+1] = p.y;
            positions[i+2] = p.z;
          }
          brainParticles.geometry.attributes.position.needsUpdate = true;
        } else {
          // 상호작용 후: 파티클 크기 증가 및 빠른 회전
          (brainParticles.material as import('three').PointsMaterial).size += 
            (0.2 - (brainParticles.material as import('three').PointsMaterial).size) * 0.05;
          brainParticles.rotation.y += 0.005 * 60 * deltaTime;  // 빠른 회전 (60fps 기준 속도)
        }
      }

      renderer.render(scene, camera);
    };

    // 동적으로 Three.js를 불러온 뒤 초기화 및 애니메이션 시작
    (async () => {
      const three = await import('three');
      ({
        Scene, PerspectiveCamera, WebGLRenderer,
        AmbientLight, DirectionalLight,
        BufferGeometry, BufferAttribute,
        PointsMaterial, Points,
        Vector2, Vector3, Clock,
        Color, AdditiveBlending,
      } = three);
      // 런타임 객체들 준비
      mouse = new Vector2(0, 0);  // 화면 중앙으로 초기화
      clock = new Clock();

      // 단순한 지연: 첫 페인트 이후 초기화
      requestAnimationFrame(() => {
        init();
        animate();
      });
    })();

    // 이벤트 리스너 등록
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (renderer && canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  /**
   * 화면 클릭 시 처리 함수
   * 상호작용 완료 상태로 전환
   */
  const handleInteraction = () => {
    if (!interactionCompleted) {
      setInteractionCompleted(true);
    }
  };

  /**
   * 시작 버튼 클릭 시 처리 함수
   * 로그인 페이지로 이동
   */
  const handleStart = () => {
    navigate('/login');
  };

  return (
    <Wrapper onClick={handleInteraction}>
      {showBackground && <InitBackground />} {/* 조건부 렌더링: 텍스트가 먼저 렌더링되도록 지연 */}
      <CanvasContainer ref={canvasRef} />
      <ContentContainer>
        <Title className={`ui-element ${interactionCompleted ? '' : 'visible'}`}>
          당신의 두뇌 건강
        </Title>
        <Subtitle className={`ui-element ${interactionCompleted ? '' : 'visible'}`}>
          그 소중한 여정을 함께합니다
        </Subtitle>
        {!interactionCompleted && (
          <InteractionPrompt className="ui-element visible">
            뇌를 터치하여 활성화하세요
          </InteractionPrompt>
        )}
        {interactionCompleted && (
          <StartButton onClick={handleStart} className="ui-element visible">
            검사 시작
          </StartButton>
        )}
      </ContentContainer>
    </Wrapper>
  );
}

/**
 * 스타일 컴포넌트 정의
 */
const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background: transparent; /* 배경을 투명하게 변경 */
  overflow: hidden;
  cursor: pointer;
`;

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* 기존 뇌 파티클의 z-index */
`;

const ContentContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding-bottom: 10vh;

  /* UI 요소 페이드인 애니메이션 */
  .ui-element {
    opacity: 1;  /* LCP 개선: 초기 상태를 보이게 설정 */
    transform: translateY(0);  /* LCP 개선: 초기 위치로 설정 */
    /* transition 제거: LCP 개선을 위해 즉시 보이도록 */
  }

  .ui-element.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
  margin-top: -15vh;  /* 제목을 위쪽으로 이동 */
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  font-weight: 300;
  margin-bottom: 2rem;
  text-align: center;
`;

const InteractionPrompt = styled.p`
  font-size: 1.1rem;
  font-weight: 300;
  position: absolute;
  bottom: 30%;
  animation: pulse 2s infinite;  /* 깜빡이는 효과 */

  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
`;

const StartButton = styled.button`
  font-size: 1.2rem;
  font-weight: 700;
  padding: 0.8rem 3rem;
  border-radius: 999px;
  background: white;
  color: #0c0a1a;
  border: none;
  position: absolute;
  bottom: 25%;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    transform: scale(1.05);  /* 호버 시 약간 확대 */
  }
`;