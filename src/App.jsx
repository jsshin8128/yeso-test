import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import { Toaster } from "react-hot-toast";
import DebateRoom from "./components/DebateRoom";
import DebateRoomDetail from "./components/DebateRoomDetail";
import AuthPage from "./components/AuthPage";
import PrivateRoute from "./components/PrivateRoute";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    background: ${({ theme }) => theme.bodyBg};
    color: ${({ theme }) => theme.text};
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    transition: background 0.3s ease, color 0.3s ease;
  }
`;

const lightTheme = {
  mode: "light",
  bodyBg: "#f9f7f3",
  cardBg: "#ffffff",
  inputBg: "#fffdf8",
  text: "#2c1e13",
  heading: "#4c3f30",
  border: "#d7c5a9",
  accent: "#c2a675",
  toastBg: "#4c3f30",
};

const darkTheme = {
  mode: "dark",
  bodyBg: "#121212",
  cardBg: "#1e1e1e",
  inputBg: "#2a2a2a",
  text: "#f0e9dc",
  heading: "#fceec5",
  border: "#333",
  accent: "#d4b077",
  toastBg: "#333",
};

export default function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [user, setUser] = useState(null);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Toaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* ✅ 초기 경로 → 사용자 상태에 따라 조건부 라우팅 */}
          <Route
            path="/"
            element={
              user ? (
                <DebateRoom
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  user={user}
                  setUser={setUser}
                />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />

          {/* ✅ 로그인 및 회원가입 통합 페이지 */}
          <Route path="/auth" element={<AuthPage onLogin={setUser} />} />

          {/* ✅ 로그인된 사용자만 접근 가능 */}
          <Route
            path="/debate/:roomId"
            element={
              <PrivateRoute user={user}>
                <DebateRoomDetail
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  user={user}
                  setUser={setUser}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/main"
            element={
              <PrivateRoute user={user}>
                <DebateRoom
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  user={user}
                  setUser={setUser}
                />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
