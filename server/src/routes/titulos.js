import { Router } from "express";
import { q } from "../db.js";

const router = Router();

//titulos pega titulos em aberto por filtro de cliente
/**
 * /api/titulos?clienteId=...&status=[aberto|pago|atrasado|todos]&empresa=...
 */
router.get("/", async (req, res) => {
  try {
    const { clienteId, status = "todos", empresa } = req.query;

    const where = [];
    const params = [];
    let i = 1;

    if (clienteId) { where.push(`codparc = $${i++}`); params.push(Number(clienteId)); }
    if (empresa)   { where.push(`codemp = $${i++}`);  params.push(Number(empresa)); }

    if (status !== "todos") {
      if (status === "pago")      where.push(`dh_baixa IS NOT NULL`);
      else if (status === "aberto")   where.push(`dh_baixa IS NULL AND dt_vencimento >= CURRENT_DATE`);
      else if (status === "atrasado") where.push(`dh_baixa IS NULL AND dt_vencimento < CURRENT_DATE`);
    }

    const sql = `
      SELECT codemp, codparc, num_nota, dt_vencimento, dh_baixa, valor, status
        FROM titulos_financeiro
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY dt_vencimento DESC
       LIMIT 100
    `;

    const data = await q(sql, params);
    res.json({ ok: true, count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Erro ao listar títulos" });
  }
});

export default router;
