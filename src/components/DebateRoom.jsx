import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes, useTheme } from "styled-components";
import { useNavigate } from "react-router-dom";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  background: ${({ theme }) => theme.bodyBg};
  color: ${({ theme }) => theme.text};
`;

const Heading = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.heading};
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const SubHeading = styled.h2`
  font-size: 1.4rem;
  margin: 3rem 0 1.5rem;
  text-align: center;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
`;

const ThemeToggle = styled.button`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
`;

const FormWrapper = styled.form`
  background: ${({ theme }) => theme.cardBg};
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: 1.25rem;
  padding: 2rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.6s ease;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.9rem 1.2rem;
  border-radius: 0.75rem;
  border: 2px solid ${({ theme }) => theme.border};
  font-size: 1rem;
  background: ${({ theme }) => theme.inputBg};
  color: ${({ theme }) => theme.text};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 3px rgba(245, 231, 196, 0.2);
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
  opacity: 0.7;
  margin-top: 0.5rem;
`;

const CreateButton = styled.button`
  margin-top: 1rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.bodyBg};
  font-size: 1rem;
  font-weight: bold;
  padding: 0.75rem 2rem;
  border-radius: 1rem;
  border: none;
  cursor: pointer;
  font-family: 'Pretendard', sans-serif;
  transition: background 0.2s;
  &:hover:enabled {
    filter: brightness(0.95);
  }
  &:disabled {
    background: #666;
    color: #bbb;
    cursor: not-allowed;
  }
`;

const RoomList = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.75rem;
`;

const RoomCard = styled.li`
  background: ${({ theme }) => theme.cardBg};
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.border};
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  }
`;

const RoomTitle = styled.h3`
  font-size: 1.2rem;
  font-family: 'Pretendard', sans-serif;
  color: ${({ theme }) => theme.heading};
  margin-bottom: 0.4rem;
`;

const RoomDesc = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  opacity: 0.7;
  font-style: italic;
`;

const Toast = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: ${({ error, theme }) => (error ? '#E02424' : theme.toastBg)};
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1000;
`;

export default function DebateRoom({ isDark, onToggleTheme }) {
  const [rooms, setRooms] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);
  const navigate = useNavigate();

  const fetchRooms = async (opt = false) => {
    if (!opt) setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/debate/rooms");
      const data = await res.json();
      setRooms(data);
    } catch {
      showToast("목록을 가져오는 데 실패했습니다.", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms() }, []);

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title || !description) {
      showToast("제목과 설명을 입력해주세요.", true);
      return;
    }
    const newRoom = { id: Date.now(), title, description };
    setRooms([newRoom, ...rooms]);
    setTitle(""); setDescription("");
    try {
      const res = await fetch("http://localhost:8080/debate/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      if (!res.ok) throw new Error();
      showToast("토론방이 생성되었습니다!");
      fetchRooms(true);
    } catch {
      showToast("생성에 실패했습니다.", true);
    }
  };

  return (
    <Container>
      <Heading>
        🏛️ AGORA
        <ThemeToggle onClick={onToggleTheme}>{isDark ? "☀️" : "🌙"}</ThemeToggle>
      </Heading>

      <FormWrapper onSubmit={handleSubmit}>
        <InputGroup>
          <TextInput
            type="text"
            placeholder="제목 (≤50자)"
            value={title}
            onChange={e => e.target.value.length <= 50 && setTitle(e.target.value)}
          />
          <TextInput
            type="text"
            placeholder="설명 (≤200자)"
            value={description}
            onChange={e => e.target.value.length <= 200 && setDescription(e.target.value)}
          />
        </InputGroup>
        <CharCount>{title.length}/50, {description.length}/200</CharCount>
        <CreateButton type="submit" disabled={loading}>토론방 생성</CreateButton>
      </FormWrapper>

      <SubHeading>🗂️ 현재 토론방 목록</SubHeading>

      {loading ? (
        <p>불러오는 중입니다...</p>
      ) : rooms.length === 0 ? (
        <p>아직 생성된 토론방이 없습니다.</p>
      ) : (
        <RoomList>
          {rooms.map(r => (
            <RoomCard key={r.id} onClick={() => navigate(`/debate/${r.id}`)}>
              <RoomTitle>{r.title}</RoomTitle>
              <RoomDesc>{r.description}</RoomDesc>
            </RoomCard>
          ))}
        </RoomList>
      )}

      {toast && <Toast error={toast.error}>{toast.msg}</Toast>}
    </Container>
  );
}