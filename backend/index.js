require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Pool MySQL (RDS)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Testa conexão ao iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conectado ao MySQL RDS:", process.env.DB_HOST);
    conn.release();
  } catch (err) {
    console.error("❌ Erro ao conectar no MySQL:", err.message);
  }
})();

// Rota healthcheck
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Exemplo listar filmes
app.get("/api/movies", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM filmes");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar filmes" });
  }
});

// Exemplo login fake
app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email obrigatório" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, user: { nome: "Demo", email } });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API rodando em http://0.0.0.0:${PORT}`)
);
