import { useEffect, useRef } from "react";
import styled from "styled-components";

export default function InitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // InitBackground의 three.js 로딩을 지연시켜 LCP 개선
    // requestAnimationFrame 1회 후 초기화로 첫 페인트 이후 로딩
    requestAnimationFrame(async () => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;

      // three.js 동적 로딩
      const THREE = await import('three');
      
      let scene: any, camera: any, renderer: any, particles: any, animationFrameId: number;
      let geometry: any, material: any; // dispose를 위해 외부 스코프에 선언
      let isFirstFrame = true; // 초기 캔버스 축소 렌더링 플래그

      const init = () => {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0c0a1a); // 배경색 설정
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: currentCanvas });
        
        // 초기 캔버스 축소 렌더링: 절반 크기로 시작하여 초기 렌더링 부하 감소
        const initialWidth = Math.floor(window.innerWidth / 2);
        const initialHeight = Math.floor(window.innerHeight / 2);
        renderer.setSize(initialWidth, initialHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const particleCount = 5000;
        geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 20;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
          let z;
          do {
            z = (Math.random() - 0.5) * 20; // -10에서 10 사이
          } while (z >= 3 && z <= 7); // z가 3에서 7 사이면 다시 생성
          positions[i * 3 + 2] = z;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        material = new THREE.PointsMaterial({
          size: 0.01,
          color: 0x8b5cf6, // 보라색
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);
      };

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        
        // 첫 프레임 렌더링 후 전체 크기로 확대
        if (isFirstFrame) {
          isFirstFrame = false;
          // 전체 크기로 확대 및 카메라 비율 재조정
          renderer.setSize(window.innerWidth, window.innerHeight);
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
        }
        
        if(particles) {
          particles.rotation.x += 0.0001;
          particles.rotation.y += 0.0002;
        }
        renderer.render(scene, camera);
      };
      
      init();
      animate();

      const onWindowResize = () => {
        if (camera && renderer) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
      };

      window.addEventListener('resize', onWindowResize);

      return () => {
        window.removeEventListener('resize', onWindowResize);
        cancelAnimationFrame(animationFrameId);
        
        // 리소스 명시적 정리: 메모리 누수 방지 및 GPU 안정화
        if (geometry) geometry.dispose();
        if (material) material.dispose();
        if (renderer) renderer.dispose();
      };
    });
  }, []);

  return <BackgroundCanvas ref={canvasRef} />;
}

const BackgroundCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
`;