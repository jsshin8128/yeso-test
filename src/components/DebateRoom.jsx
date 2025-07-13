import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes, useTheme } from "styled-components";
import { useNavigate } from "react-router-dom";

// — Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// — Styled Components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  position: relative;
`;

const Heading = styled.h1`
  font-family: 'Safira March', serif;
  font-size: 3rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.text};
`;

const ThemeToggle = styled.button`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.text};
  font-size: 1.5rem;
  cursor: pointer;
`;

const FormWrapper = styled.form`
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 1rem;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TextInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: ${({ theme }) => theme.secondary};
    box-shadow: 0 0 0 3px rgba(73, 134, 231, 0.2);
    outline: none;
  }
`;

const CharCount = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.text};
  grid-column: 1 / -1;
  text-align: right;
`;

const CreateButton = styled.button`
  background: ${({ theme }) => theme.secondary};
  color: #fff;
  border: none;
  padding: 0 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  &:hover:enabled {
    background: ${({ theme }) => theme.primary};
    transform: translateY(-2px);
  }
`;

const SkeletonCard = styled.div`
  background: ${({ theme }) => theme.border};
  height: 100px;
  border-radius: 1rem;
  animation: pulse 1.5s infinite;
  @keyframes pulse {
    0%   { opacity: 0.5; }
    50%  { opacity: 1; }
    100% { opacity: 0.5; }
  }
`;

const RoomList = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 0;
`;

const RoomCard = styled.li`
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  }
`;

const RoomTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const RoomDesc = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
`;

const Toast = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: ${({ error }) => (error ? '#E02424' : '#154797')};
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  opacity: 0.9;
  z-index: 1000;
`;


export default function DebateRoom({ isDark, onToggleTheme }) {
  const theme = useTheme();
  const [rooms, setRooms] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);
  const navigate = useNavigate();

  // Fetch rooms
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

  // Toast
  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  };

  // Create room
  const handleSubmit = async e => {
    e.preventDefault();
    if (!title || !description) {
      showToast("제목과 설명을 입력해주세요.", true);
      return;
    }
    const newRoom = { id: Date.now(), title, description };
    setRooms([newRoom, ...rooms]); // optimistic
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
      <Heading>🗣 토론룸</Heading>
      <ThemeToggle onClick={onToggleTheme} aria-label="Toggle Theme">
        {isDark ? "☀️" : "🌙"}
      </ThemeToggle>

      <FormWrapper onSubmit={handleSubmit}>
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
        <CharCount>{title.length}/50, {description.length}/200</CharCount>
        <CreateButton type="submit" disabled={loading}>
          생성
        </CreateButton>
      </FormWrapper>

      <Heading style={{ fontSize: "1.75rem" }}>현재 토론방</Heading>

      {loading ? (
        <RoomList>
          {Array(4).fill().map((_, i) => <SkeletonCard key={i} />)}
        </RoomList>
      ) : rooms.length === 0 ? (
        <p>등록된 토론방이 없습니다.</p>
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
