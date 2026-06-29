import styled from 'styled-components';

interface SentryErrorFallbackProps {
  componentName: string;
  onRetry: () => void;
}

export default function SentryErrorFallback({ componentName, onRetry }: SentryErrorFallbackProps) {
  return (
    <Wrapper>
      <Card>
        <Title>일시적인 오류가 발생했습니다</Title>
        <Message>
          {componentName} 화면을 불러오는 중 문제가 생겼습니다.
          <br />
          잠시 후 다시 시도하거나 홈으로 이동해 주세요.
        </Message>
        <Actions>
          <Button type="button" onClick={onRetry}>
            다시 시도
          </Button>
          <LinkButton type="button" onClick={() => { window.location.href = '/'; }}>
            홈으로
          </LinkButton>
        </Actions>
      </Card>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #0c0a1a;
  color: #fff;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(17, 24, 39, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 700;
`;

const Message = styled.p`
  margin: 0 0 1.5rem;
  line-height: 1.6;
  color: #cbd5e1;
  font-size: 0.95rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #8b5cf6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #7c3aed;
  }
`;

const LinkButton = styled.button`
  padding: 0.75rem 1rem;
  border: 1px solid #475569;
  border-radius: 0.5rem;
  background: transparent;
  color: #e2e8f0;
  cursor: pointer;

  &:hover {
    border-color: #94a3b8;
  }
`;
