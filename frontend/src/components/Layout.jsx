import React, { useEffect, useState } from "react";
import { initTheme } from "../theme";

export default function Layout({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => { setTheme(initTheme()); }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
        background:
          theme === "dark"
            ? "radial-gradient(1200px 600px at 20% -10%, rgba(59,130,246,.15), transparent 60%), radial-gradient(1000px 500px at 110% 10%, rgba(168,85,247,.15), transparent 60%), #0b0b0c"
            : "radial-gradient(1200px 600px at 20% -10%, rgba(59,130,246,.12), transparent 60%), radial-gradient(1000px 500px at 110% 10%, rgba(168,85,247,.12), transparent 60%), #f8fafc",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-20% -10% auto auto",
          width: "40vw",
          aspectRatio: "1/1",
          filter: "blur(80px)",
          opacity: theme === "dark" ? 0.35 : 0.25,
          background:
            theme === "dark"
              ? "conic-gradient(from 40deg, rgba(168,85,247,.6), rgba(59,130,246,.4), transparent)"
              : "conic-gradient(from 40deg, rgba(168,85,247,.4), rgba(59,130,246,.25), transparent)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
