import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import DebateRoom from "./components/DebateRoom";
import DebateRoomDetail from "./components/DebateRoomDetail";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    background: ${({ theme }) => theme.bodyBg};
    color: ${({ theme }) => theme.text};
    font-family: 'Source Sans Pro', sans-serif;
    transition: background 0.3s, color 0.3s;
  }
`;

const lightTheme = {
  bodyBg: "linear-gradient(135deg, #E9F1FF 0%, #F9FAFD 100%)",
  cardBg: "#FFFFFF",
  border: "#D0E4FF",
  text: "#154797",
  secondary: "#4986E7",
  primary: "#154797",
};
const darkTheme = {
  bodyBg: "#1e1e1e",
  cardBg: "#2a2a2a",
  border: "#444",
  text: "#e0e0e0",
  secondary: "#6ea8fe",
  primary: "#a1caff",
};

export default function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<DebateRoom isDark={isDark} onToggleTheme={toggleTheme} />}
          />
          <Route
            path="/debate/:roomId"
            element={<DebateRoomDetail isDark={isDark} onToggleTheme={toggleTheme} />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
