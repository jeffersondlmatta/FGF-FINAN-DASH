// server/src/routes/home.js
import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/**
 * GET /api/home/titulos
 * Lista títulos da empresa (padrão: EM ABERTO)
 *
 * Query:
 *  - empresa (obrigatório)  -> CODEMP
 *  - codparc (opcional)
 *  - status: "aberto" | "atrasado" | "pago" | "todos" (default: "aberto")
 *  - page, pageSize
 */
router.get("/titulos", async (req, res) => {
  try {
    const page = Number(req.query.page ?? 0);
    const pageSize = Math.min(Number(req.query.pageSize ?? 100), 500);

    const { empresa, codparc } = req.query;
    const status = (req.query.status ?? "todos").toString();

    const where = [];
    const params = [];
    let i = 1;

    if (!empresa) {
      return res
        .status(400)
        .json({ ok: false, message: "Parâmetro 'empresa' é obrigatório." });
    }

    where.push(`codemp = $${i++}`);
    params.push(Number(empresa));

    if (codparc) {
      where.push(`codparc = $${i++}`);
      params.push(Number(codparc));
    }

    if (status !== "todos") {
      if (status === "pago") {
        where.push("dt_baixa IS NOT NULL");
      } else if (status === "atrasado") {
        where.push("dt_baixa IS NULL");
        where.push("dt_vencimento < CURRENT_DATE");
      } else if (status === "aberto") {
        // em aberto = sem baixa (pode estar a vencer ou atrasado)
        where.push("dt_baixa IS NULL");
      }
    }

    const sql = `
      SELECT
        *,
        GREATEST(CURRENT_DATE - dt_vencimento, 0) AS dias_atraso
      FROM titulos_financeiro
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY nome_parceiro ASC, dt_vencimento ASC
      LIMIT $${i++} OFFSET $${i++}
    `;

    params.push(pageSize, page * pageSize);

    const rows = await q(sql, params);

    res.json({
      ok: true,
      page,
      pageSize,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Erro GET /api/home/titulos:", err);
    res
      .status(500)
      .json({ ok: false, message: "Erro ao listar títulos." });
  }
});

/**
 * GET /api/home/clientes-para-bloqueio
 *
 * Lista clientes elegíveis para bloqueio:
 *  - codemp = empresa
 *  - dt_baixa IS NULL
 *  - dt_vencimento < hoje (atrasados)
 *  - situacao em ('LIBERADO','ATIVO') ou NULL
 *  - dias_atraso >= atrasoMin (padrão 20)
 *  - NÃO DUPLICAR parceiro -> 1 linha por codparc (maior atraso)
 *
 * Query:
 *  - empresa (obrigatório)
 *  - atrasoMin (opcional, default 20)
 *  - page, pageSize
 */
router.get("/clientes-para-bloqueio", async (req, res) => {
  try {
    const { empresa } = req.query;
    if (!empresa) {
      return res
        .status(400)
        .json({ ok: false, message: "Parâmetro 'empresa' é obrigatório." });
    }

    const atrasoMin = Number(req.query.atrasoMin ?? 20);
    const page = Number(req.query.page ?? 0);
    const pageSize = Math.min(Number(req.query.pageSize ?? 100), 500);

    const params = [];
    let i = 1;

    // Usamos DISTINCT ON (Postgres) para pegar apenas um título por parceiro,
    // escolhendo aquele com MAIOR atraso.
    const sql = `
      SELECT
        t.*
      FROM (
        SELECT DISTINCT ON (codparc)
          *,
          GREATEST(CURRENT_DATE - dt_vencimento, 0) AS dias_atraso
        FROM titulos_financeiro
        WHERE codemp = $${i++}
          AND dt_baixa IS NULL
          AND dt_vencimento < CURRENT_DATE
          AND (
            situacao IS NULL
            OR situacao ILIKE 'LIBERADO'
            OR situacao ILIKE 'ATIVO'
          )
        ORDER BY codparc, dt_vencimento ASC  -- mais antigo = maior atraso
      ) AS t
      WHERE t.dias_atraso >= $${i++}
      ORDER BY t.nome_parceiro ASC
      LIMIT $${i++} OFFSET $${i++}
    `;

    params.push(Number(empresa), atrasoMin, pageSize, page * pageSize);

    const rows = await q(sql, params);

    res.json({
      ok: true,
      page,
      pageSize,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Erro GET /api/home/clientes-para-bloqueio:", err);
    res.status(500).json({
      ok: false,
      message: "Erro ao buscar clientes para bloqueio.",
    });
  }
});

/**
 * PATCH /api/home/clientes/:codparc/bloqueio
 * body: { empresa: 20, bloquear: true }
 *
 * Atualiza a situação do cliente na tabela titulos_financeiro
 * (LIBERADO <-> BLOQUEADO)
 */
router.patch("/clientes/:codparc/bloqueio", async (req, res) => {
  try {
    const codparc = Number(req.params.codparc);
    const { empresa, bloquear } = req.body;

    if (!empresa || Number.isNaN(Number(empresa))) {
      return res
        .status(400)
        .json({ ok: false, message: "Empresa (codemp) é obrigatória." });
    }

    if (typeof bloquear !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "Parâmetro 'bloquear' deve ser booleano.",
      });
    }

    const codemp = Number(empresa);
    const novaSituacao = bloquear ? "BLOQUEADO" : "LIBERADO";

    const sql = `
      UPDATE titulos_financeiro
         SET situacao = $3
       WHERE codemp = $1
         AND codparc = $2
    `;

    await q(sql, [codemp, codparc, novaSituacao]);

    res.json({
      ok: true,
      message: "Situação do cliente atualizada com sucesso.",
      codemp,
      codparc,
      situacao: novaSituacao,
    });
  } catch (err) {
    console.error("Erro PATCH /api/home/clientes/:codparc/bloqueio:", err);
    res.status(500).json({
      ok: false,
      message: "Erro ao atualizar situação do cliente.",
    });
  }
});

export default router;
