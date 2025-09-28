import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main>
      <section
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          alignItems: "center",
          minHeight: "calc(100dvh - 70px)",
          paddingTop: "4rem",
          paddingBottom: "4rem",
        }}
      >
        <div style={{ maxWidth: 840 }}>
          <p
            style={{
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--muted, #71717a)",
            }}
          >
            Recomendações • Biblioteca • Avaliações
          </p>

          <h1
            style={{
              fontFamily: "var(--font-display, Bebas Neue, Inter, sans-serif)",
              fontSize: "clamp(48px, 8vw, 96px)",
              lineHeight: 1,
              margin: 0,
              letterSpacing: ".01em",
              color: "var(--fg, #111827)",
            }}
          >
            Descubra filmes
            <br />
            de um jeito <span style={{ color: "#7c3aed" }}>inteligente</span>.
          </h1>

          <p
            style={{
              marginTop: 20,
              fontSize: "1.125rem",
              maxWidth: 680,
              color: "rgba(24,24,27,.8)",
            }}
          >
            Explore o catálogo, veja recomendações personalizadas e salve seus
            favoritos. Tudo rápido, responsivo e integrado à sua API.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <Link to="/movies" className="btn">Explorar filmes</Link>
            <Link to="/recs" className="btn-outline">Minhas recomendações</Link>
            <Link to="/login" className="btn-outline">Entrar</Link>
          </div>

          <ApiPill />
        </div>
      </section>
    </main>
  );
}

function ApiPill() {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
        const resp = await fetch(`${base}/health`);
        setOk(resp.ok);
      } catch {
        setOk(false);
      }
    })();
  }, []);

  return (
    <div
      style={{
        marginTop: 24,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 9999,
        border: "1px solid var(--border, rgba(0,0,0,.1))",
        background: "transparent",
      }}
      title="Status da API"
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "9999px",
          background: ok ? "#16a34a" : ok === null ? "#ca8a04" : "#dc2626",
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: ".875rem", color: "rgba(24,24,27,.75)" }}>
        API: {ok ? "online" : ok === null ? "checando..." : "offline"}
      </span>
    </div>
  );
}
