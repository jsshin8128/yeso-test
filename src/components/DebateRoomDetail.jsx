import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes, useTheme } from "styled-components";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet";
import useWebSocket from "../hooks/useWebSocket";
import { v4 as uuidv4 } from "uuid";

/**
 * 고유한 브라우저 ID를 생성하거나 기존 ID를 반환
 * @returns {string} 고유한 참가자 ID
 */
const getOrCreateParticipantId = () => {
  let id = localStorage.getItem("participantId");
  if (!id) {
    id = crypto.randomUUID();  // UUID 생성
    localStorage.setItem("participantId", id);
  }
  return id;
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  padding: 4rem 1.5rem;
  background: ${({ theme }) => theme.bodyBg};
  color: ${({ theme }) => theme.text};
  animation: ${fadeIn} 0.4s ease-out;
  font-family: 'Pretendard', sans-serif;
`;

const Header = styled.header`
  max-width: 800px;
  margin: 0 auto 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  & + & { margin-left: 0.75rem; }
  &:hover {
    background: ${({ theme }) => theme.primary};
    color: white;
  }
`;

const DeleteButton = styled(NavButton)`
  background-color: #ffe8e8;
  color: #d33;
  border-color: #f5b5b5;
  &:hover {
    background-color: #d33;
    color: white;
  }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 1.25rem;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  font-family: 'Pretendard', sans-serif;
  font-size: 2.2rem;
  color: ${({ theme }) => theme.text};
  border-left: 5px solid ${({ theme }) => theme.primary};
  padding-left: 1rem;
  margin-bottom: 1.5rem;
`;

const Meta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.75rem;
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
  border: 4px solid #ccc;
  border-top-color: ${({ theme }) => theme.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 5rem auto;
`;

const ErrorBox = styled.div`
  background: #ffecec;
  color: #d33;
  padding: 1.25rem;
  border-radius: 1rem;
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
  display: flex;
  justify-content: ${({ isOwn }) => (isOwn ? "flex-end" : "flex-start")};
  margin-bottom: 1rem;
`;

const CommentBubble = styled.div`
  background: ${({ isOwn }) => (isOwn ? "#fbe16b" : "#eee")};
  color: ${({ isOwn }) => (isOwn ? "#000" : "#333")};
  padding: 0.7rem 1rem;
  border-radius: 1rem;
  max-width: 60%;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  font-family: 'Pretendard', sans-serif;
`;

const Timestamp = styled.span`
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
  text-align: ${({ isOwn }) => (isOwn ? "right" : "left")};
`;

const TypingIndicator = styled.div`
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #aaa;
  font-style: italic;
`;

const CommentForm = styled.form`
  display: flex;
  gap: 0.75rem;
`;

const CommentInput = styled.input`
  flex: 1;
  padding: 0.65rem 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 1rem;
  font-size: 1rem;
  background: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.15);
  }
`;

const CommentBtn = styled.button`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 0 1.5rem;
  font-weight: bold;
  font-family: 'Pretendard', sans-serif;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.secondary};
  }
`;

const ConnectionStatus = styled.span.attrs(({ $connected }) => ({
  $connected: $connected,
}))`
  margin-left: 1rem;
  font-size: 1rem;
  font-weight: bold;
  color: ${({ $connected }) => ($connected ? '#4caf50' : '#e53935')};
`;


// — Main Component
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
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [typingUser, setTypingUser] = useState(null);
  const commentRef = useRef();

  const handleReceivedMessage = useCallback((msg) => {
    console.log("💬 수신 메시지:", msg);
    const participantId = getOrCreateParticipantId();
    console.log("🙋‍♂️ 내 participantId:", participantId, "보낸이 ID:", msg.senderId);

    if (msg.type === "typing") {
      if (msg.senderId !== participantId) {
        setTypingUser({ id: msg.senderId, name: msg.sender });
        setTimeout(() => setTypingUser(null), 3000);
      }
      return;
    }
    setComments((prev) => {
      // sender + timestamp + message 조합으로 중복 판단
      const exists = prev.some(
        (c) => c.author === msg.sender && c.timestamp === msg.timestamp && c.text === msg.message
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id: msg.messageId,
          author: msg.sender,
          senderId: msg.senderId,
          text: msg.message,
          timestamp: msg.timestamp,
          messageId: msg.messageId,
        },
      ];
    });
  }, [user]);

  const { sendMessage, sendTyping, isConnected, participantsCount } = useWebSocket(
    numericRoomId,
    handleReceivedMessage,
    user
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`http://localhost:8080/debate/rooms/${numericRoomId}`);
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
    const text = commentRef.current.value.trim();

    // 🔐 메시지 내용이 없으면 전송하지 않도록 필터링
    if (!text) return;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!isConnected) {
      alert("서버 연결 준비 중입니다.");
      return;
    }

    const now = new Date().toISOString();
    const messageId = uuidv4();
    const participantId = getOrCreateParticipantId();

    sendMessage({
      roomId: numericRoomId,
      sender: user.name,
      senderId: participantId,
      message: text, // ✅ null 아님
      timestamp: now,
      messageId,
    });

    commentRef.current.value = "";
  };

  // send typing message
  const handleTyping = () => {
    // 입력 중일 때만 타이핑 메시지 전송
    if (!user || !isConnected) return;
    const participantId = getOrCreateParticipantId();
    sendTyping({
      typing: true, // ← 중요: 서버 포맷에 맞춤
      roomId: numericRoomId,
      sender: user.name,
      senderId: participantId,
    });
  };

  const handleDeleteRoom = async () => {
    const confirmed = window.confirm("정말로 이 토론방을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:8080/debate/rooms/${numericRoomId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();
      alert("삭제가 완료되었습니다.");
      navigate("/");
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
      console.error(err);
    }
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
            <DeleteButton onClick={handleDeleteRoom}>🗑 삭제하기</DeleteButton>
            <ConnectionStatus $connected={isConnected}>
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
            <h2 style={{ marginBottom: "1rem", fontFamily: 'Playfair Display', fontSize: '1.5rem' }}>💬 토론 댓글</h2>
            {typingUser && typingUser.id !== getOrCreateParticipantId() && (
              <TypingIndicator>
                {typingUser.name} 님이 입력 중...
              </TypingIndicator>
            )}
            <CommentList>
              {comments.map((c) => {
                const participantId = getOrCreateParticipantId();
                const isOwn = String(c.senderId) === String(participantId);
                console.log('[Debug] Message:', {
                  messageId: c.messageId,
                  senderId: c.senderId,
                  participantId: participantId,
                  isOwn: isOwn,
                  author: c.author,
                  text: c.text
                });
                return (
                  <CommentItem key={c.messageId || c.id} isOwn={isOwn}>
                    <CommentBubble isOwn={isOwn}>
                      {c.text}
                      <Timestamp isOwn={isOwn}>
                        {new Date(c.timestamp).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Timestamp>
                    </CommentBubble>
                  </CommentItem>
                );
              })}
            </CommentList>
            <CommentForm onSubmit={handleComment}>
              <CommentInput ref={commentRef} placeholder="댓글을 입력하세요..." onChange={handleTyping} />
              <CommentBtn>전송</CommentBtn>
            </CommentForm>
          </CommentSection>
        </Container>
      </Wrapper>
    </>
  );
}

// Stub hooks
function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("유저 정보 파싱 실패", e);
        setUser(null);
      }
    } else {
      // 로그인하지 않은 경우에도 고유한 userId 생성
      const userId = localStorage.getItem('userId') || crypto.randomUUID();
      localStorage.setItem('userId', userId);
      setUser({ id: userId, name: "게스트" });
    }
  }, []);
  return user;
}

function useComments() {
  const [comments, setComments] = useState([]);
  return [comments, setComments];
}
