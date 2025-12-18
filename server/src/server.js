import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import clientes from "./routes/clientes.js";
import titulos from "./routes/titulos.js";
import home from "./routes/home.js";
import empresas from "./routes/empresas.js";
import bloqueio from "./routes/bloqueio.js";
import desbloqueio from "./routes/desbloqueio.js";
import negativacao from "./routes/negativacao.js";
import parceirosBloqueados from "./routes/bloqueados.js";
import consultaCliente from "./routes/consultaCliente.js";

const app = express();
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT || 3333);


app.use(cors({
  origin: [
    "https://fgf-finan-dash-8oal.vercel.app", 
    "https://fgf-finan-dash-yduz.vercel.app"
  ], 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

if (!isProd) app.use(morgan("dev"));

if (process.env.TRUST_PROXY) app.set("trust proxy", true);

// 🔹 Rotas da API
app.use("/api/clientes", clientes);
app.use("/api/titulos", titulos);
app.use("/api/home", home);
app.use("/api/empresas", empresas);
app.use("/api/bloqueio", bloqueio);
app.use("/api/desbloqueio", desbloqueio);
app.use("/api/negativacao", negativacao);
app.use("/api/bloqueados", parceirosBloqueados);
app.use("/api/consulta-cliente", consultaCliente);

// Healthcheck
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || "development" })
);

// 404 para API
app.use("/api", (_req, res) =>
  res.status(404).json({ ok: false, message: "Rota não encontrada" })
);

// -----------------------------------------------------------------------------
// Servir front buildado (SPA)
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDist = path.resolve(__dirname, "../../web/dist");

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
} else {
  if (!isProd) {
    console.warn(`[WARN] Pasta de build do front não encontrada: ${webDist}.
Gere com: cd web && npm run build`);
  }
}

// -----------------------------------------------------------------------------
// Inicialização
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
