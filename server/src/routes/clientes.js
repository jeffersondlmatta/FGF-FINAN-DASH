import { Router } from "express";
import { q } from "../db.js";

const router = Router();

// pega os cliente sem filtro de empresa
// GET /api/clientes?page=0&pageSize=20  (lista "clientes" a partir de titulos_financeiros)
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page ?? 0);
    const pageSize = Math.min(Number(req.query.pageSize ?? 20), 200);

    const data = await q(
      `
        SELECT DISTINCT ON (codparc)
        *
        FROM titulos_financeiro
        WHERE status = 'atrasado'
        ORDER BY codparc, nome_parceiro NULLS LAST
        LIMIT $1 OFFSET $2
      `,
      [pageSize, page * pageSize]
    );

    res.json({ ok: true, page, pageSize, count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Erro ao listar clientes" });
  }
});

// GET /api/clientes/:codparc/titulos?page=0&pageSize=50&status=atrasado
router.get("/:codparc/titulos", async (req, res) => {
  try {
    const codparc = Number(req.params.codparc);
    if (Number.isNaN(codparc)) return res.status(400).json({ ok: false, message: "codparc inválido" });

    const page = Number(req.query.page ?? 0);
    const pageSize = Math.min(Number(req.query.pageSize ?? 50), 500);
    const status = (req.query.status ?? "todos").toString();

    const where = ["codparc = $1"];
    const params = [codparc];
    let i = 2;

    if (status !== "todos") {
      if (status === "pago") where.push("dh_baixa IS NOT NULL");
      else if (status === "aberto") where.push("dh_baixa IS NULL AND dt_vencimento >= CURRENT_DATE");
      else if (status === "atrasado") where.push("dh_baixa IS NULL AND dt_vencimento < CURRENT_DATE");
    }

    const sql = `
      SELECT *
      FROM titulos_financeiros
      WHERE ${where.join(" AND ")}
      ORDER BY dt_vencimento DESC
      LIMIT $${i++} OFFSET $${i++}
    `;
    params.push(pageSize, page * pageSize);

    const rows = await q(sql, params);
    res.json({ ok: true, page, pageSize, count: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Erro ao listar títulos do cliente" });
  }
});

export default router;
