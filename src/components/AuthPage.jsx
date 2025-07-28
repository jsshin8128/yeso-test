import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Layout & Style
const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${({ theme }) => theme.bodyBg} 0%, ${({ theme }) => theme.cardBg} 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Pretendard', sans-serif;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.cardBg};
  border-radius: 1.5rem;
  padding: 3rem;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.heading};
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  &::before {
    content: "🪪";
    font-size: 2rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%) translateY(-130%);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1.2rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  font-size: 1rem;
  background: ${({ theme }) => theme.inputBg};
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  transition: 0.2s;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 4px rgba(194, 166, 117, 0.2);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.9rem;
  border-radius: 1rem;
  background: ${({ disabled, theme }) =>
    disabled ? "#ccc" : theme.accent};
  color: ${({ disabled }) => (disabled ? "#888" : "#fff")};
  font-weight: bold;
  font-size: 1.05rem;
  border: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  box-shadow: ${({ disabled }) =>
    disabled ? "none" : "0 6px 18px rgba(0,0,0,0.1)"};
  transition: background 0.2s;
  &:hover {
    background: ${({ disabled, theme }) =>
      disabled ? "#ccc" : theme.heading};
  }
`;

const ToggleMode = styled.p`
  margin-top: 2rem;
  font-size: 0.9rem;
  text-align: center;
  color: ${({ theme }) => theme.text};
  a {
    color: ${({ theme }) => theme.accent};
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.p`
  color: #d33;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 1rem;
  font-weight: 500;
`;

// — Component
export default function AuthPage({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const endpoint = isLoginMode ? 'login' : 'signup';
    try {
      const res = await fetch(`http://localhost:8080/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });

      const data = await res.json().catch(() => null); // ← 텍스트가 아닐 수도 있으니 안전하게 파싱

      if (res.ok) {
        if (isLoginMode) {
          toast.success('✅ 로그인 성공!');
          // user 상태 저장
          // 고유한 userId 생성 또는 기존 userId 사용
          const userId = localStorage.getItem('userId') || crypto.randomUUID();
          localStorage.setItem('userId', userId);
          const userInfo = { id: userId, name: username };
          localStorage.setItem("user", JSON.stringify(userInfo));
          onLogin(userInfo);
          navigate("/"); // ← 메인으로 이동
        } else {
          toast.success('✅ 회원가입 성공! 이제 로그인하세요.');
          setIsLoginMode(true);
        }
      } else {
        setErrorMsg(data?.message || '요청에 실패했습니다.');
        toast.error(data?.message || '❌ 요청에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('서버 오류가 발생했습니다.');
      toast.error('❌ 서버 오류가 발생했습니다.');
    }
  };

  return (
    <Wrapper>
      <Card>
        <Title>{isLoginMode ? '로그인' : '회원가입'}</Title>
        <AnimatePresence mode="wait">
          <motion.form
            key={isLoginMode ? 'login' : 'signup'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAuth}
          >
            <Input
              type="text"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={50}
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
            <Button type="submit">
              {isLoginMode ? '로그인' : '가입하기'}
            </Button>
          </motion.form>
        </AnimatePresence>

        {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}

        <ToggleMode>
          {isLoginMode ? (
            <>
              계정이 없으신가요?{' '}
              <a onClick={() => setIsLoginMode(false)}>회원가입</a>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <a onClick={() => setIsLoginMode(true)}>로그인</a>
            </>
          )}
        </ToggleMode>
      </Card>
    </Wrapper>
  );
}
