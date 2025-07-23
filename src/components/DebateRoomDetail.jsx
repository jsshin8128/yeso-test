import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes, useTheme } from "styled-components";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet";
import useWebSocket from "../hooks/useWebSocket";
import { v4 as uuidv4 } from "uuid";

// — Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// — Styled Components
const Wrapper = styled.div`
  min-height: 100vh;
  padding: 4rem 1.5rem;
  background: ${({ theme }) => theme.bodyBg};
  color: ${({ theme }) => theme.text};
  animation: ${fadeIn} 0.4s ease-out;
  font-family: 'Source Sans Pro', sans-serif;
`;

const Header = styled.header`
  max-width: 760px;
  margin: 0 auto 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavButton = styled.button`
  padding: 0.4rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: ${({ theme }) => theme.secondary};
    color: white;
  }
  & + & {
    margin-left: 0.75rem;
  }
`;

const Container = styled.div`
  max-width: 760px;
  margin: 0 auto;
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 1rem;
  padding: 2.5rem 2rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  font-family: 'Safira March', serif;
  font-size: 2.75rem;
  color: ${({ theme }) => theme.primary};
  border-left: 5px solid ${({ theme }) => theme.secondary};
  padding-left: 1rem;
  margin-bottom: 1rem;
`;

const Meta = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1rem;
`;

const Participants = styled.div`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 2rem;
`;

const Description = styled.div`
  font-size: 1.05rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.text};
  margin-bottom: 2.5rem;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.secondary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 5rem auto;
`;

const ErrorBox = styled.div`
  background: #ffecec;
  color: #b12a2a;
  padding: 1.25rem;
  border-radius: 0.75rem;
  text-align: center;
  margin: 2rem 0;
  font-size: 0.95rem;
`;

const CommentSection = styled.section`
  margin-top: 3rem;
`;

const CommentList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
`;

const CommentItem = styled.li`
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 0.5rem;
  padding: 0.8rem 1rem;
  margin-bottom: 0.75rem;

  strong {
    display: block;
    color: ${({ theme }) => theme.primary};
    margin-bottom: 0.25rem;
  }
`;

const CommentForm = styled.form`
  display: flex;
  gap: 0.75rem;
`;

const CommentInput = styled.input`
  flex: 1;
  padding: 0.65rem 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.secondary};
    box-shadow: 0 0 0 3px rgba(73, 134, 231, 0.2);
  }
`;

const CommentBtn = styled.button`
  background: ${({ theme }) => theme.secondary};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s ease;
  &:hover {
    background: ${({ theme }) => theme.primary};
  }
`;

const ConnectionStatus = styled.span.attrs(({ connected }) => ({
  $connected: connected,
}))`
  display: inline-block;
  margin-left: 1rem;
  font-size: 1.05rem;
  font-weight: bold;
  color: ${({ $connected, theme }) =>
    $connected ? theme.secondary : "#b12a2a"};
`;

// Auth Stub
function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    setUser({ id: 1, name: "홍길동" });
  }, []);
  return user;
}

// Comments Stub
function useComments() {
  const [comments, setComments] = useState([]);
  return [comments, setComments];
}

// —  Main Component
export default function DebateRoomDetail({ isDark, onToggleTheme }) {
  const { roomId } = useParams();
  const numericRoomId = parseInt(roomId, 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const user = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useComments();
  const commentRef = useRef();

  const handleReceivedMessage = useCallback(
    (msg) => {
      setComments((prev) => {
        const exists = prev.some((c) => c.messageId === msg.messageId);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: msg.messageId,
            author: msg.sender,
            text: msg.message,
            timestamp: msg.timestamp,
            messageId: msg.messageId,
          },
        ];
      });
    },
    [setComments]
  );

  const { sendMessage, isConnected, participantsCount } = useWebSocket(
    numericRoomId,
    handleReceivedMessage
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/debate/rooms/${numericRoomId}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (mounted) setRoom(data);
      } catch {
        if (mounted) setError("토론방 정보를 가져오는 데 실패했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [numericRoomId]);

  const handleComment = (e) => {
    e.preventDefault();
    if (!user) return alert("로그인이 필요합니다.");
    const text = commentRef.current.value.trim();
    if (!text) return;
    if (!isConnected) return alert("서버 연결 준비 중입니다.");

    const now = new Date().toISOString();
    const messageId = uuidv4();

    sendMessage({
      roomId: numericRoomId,
      sender: user.name,
      senderId: user.id,
      message: text,
      timestamp: now,
      messageId,
    });

    commentRef.current.value = "";
  };

  if (loading) return <Spinner aria-label="로딩 중" />;

  return (
    <>
      <Helmet>
        <title>{room.title} – 토론룸</title>
        <meta name="description" content={room.description.slice(0, 120)} />
      </Helmet>

      <Wrapper>
        <Header>
          <div>
            <NavButton onClick={() => navigate(-1)}>← 뒤로가기</NavButton>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <NavButton onClick={onToggleTheme}>
              {isDark ? "☀️ 밝게" : "🌙 어둡게"}
            </NavButton>
            <ConnectionStatus connected={isConnected}>
              {isConnected ? "🟢 연결됨" : "🔴 끊김"}
            </ConnectionStatus>
          </div>
        </Header>

        <Container>
          {error && <ErrorBox>{error}</ErrorBox>}
          <Title>🗣 {room.title}</Title>
          <Meta>
            생성일시:{" "}
            {new Date(room.createdAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Meta>
          <Participants>참여자: {participantsCount}명</Participants>
          <Description>
            <ReactMarkdown>{room.description}</ReactMarkdown>
          </Description>

          <CommentSection>
            <h2 style={{ marginBottom: "1rem" }}>💬 토론 댓글</h2>
            <CommentList>
              {comments.map((c) => (
                <CommentItem key={c.messageId || c.id}>
                  <strong>{c.author}</strong>
                  {c.text}
                </CommentItem>
              ))}
            </CommentList>
            <CommentForm onSubmit={handleComment}>
              <CommentInput
                ref={commentRef}
                placeholder="댓글을 입력하세요..."
              />
              <CommentBtn>전송</CommentBtn>
            </CommentForm>
          </CommentSection>
        </Container>
      </Wrapper>
    </>
  );
}
