// server/src/routes/home.js
import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/* ============================================================================
   GET /api/home/titulos
   Lista títulos de uma empresa (atrasado / aberto / pago / todos)
============================================================================ */
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
        where.push("dt_baixa IS NULL");
      }
    }

    const sql = `
      SELECT *,
             GREATEST(CURRENT_DATE - dt_vencimento, 0) AS dias_atraso
      FROM titulos_financeiro
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY nome_parceiro ASC, dt_vencimento ASC
      LIMIT $${i++} OFFSET $${i++};
    `;

    params.push(pageSize, page * pageSize);

    const rows = await q(sql, params);

    return res.json({
      ok: true,
      page,
      pageSize,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Erro GET /api/home/titulos:", err);
    return res.status(500).json({ ok: false, message: "Erro ao listar títulos." });
  }
});

/* ============================================================================
   GET /api/home/clientes-para-bloqueio
   Regra:
   - negocio obrigatório
   - empresa opcional
   - atraso >= atrasoMin
   - status = 'Atrasado'
   - situacao NULL / ATIVO / LIBERADO
   - filtrar naturezas recorrentes
   - 1 linha por cliente (maior atraso)
============================================================================ */
router.get("/clientes-para-bloqueio", async (req, res) => {
  try {
    const { empresa, negocio, page = 0, pageSize = 100, atrasoMin = 20 } = req.query;

    if (!negocio) {
      return res.status(400).json({ ok: false, message: "Selecione um negócio." });
    }

    const limit = Number(pageSize);
    const offset = Number(page) * limit;

    // 🔥 Naturezas 100% fiéis ao banco
    const naturezasRecorrentes = [
      "receita de contabilidade",
      "receita manut. revisão fiscal",
      "receita portal revisão fiscal",
      "receita gob perdcomp",
      "receita gob cfiscal",
    ];

    // SQL base
    let sql = `
      WITH lista AS (
        SELECT
          *,
          ROW_NUMBER() OVER (PARTITION BY codparc ORDER BY atraso DESC) AS rn
        FROM titulos_financeiro
        WHERE negocio = $1
          AND atraso >= $2
          AND status = 'Atrasado'
          AND (
              situacao IS NULL OR 
              situacao ILIKE 'ATIVO' OR 
              situacao ILIKE 'LIBERADO'
          )
          AND LOWER(descr_natureza) = ANY($3)
    `;

    const params = [negocio, atrasoMin, naturezasRecorrentes];

    if (empresa) {
      sql += ` AND codemp = $4 `;
      params.push(Number(empresa));
    }

    sql += `
      ),
      selecionado AS (
        SELECT *
        FROM lista
        WHERE rn = 1
      )
      SELECT
        codemp,
        nome_empresa,
        codparc,
        nome_parceiro,
        descr_natureza,
        nufin,
        valor_desdobra,
        dt_vencimento,
        dt_baixa,
        status,
        atraso,
        historico,
        situacao,
        negocio
      FROM selecionado
      ORDER BY nome_parceiro
      LIMIT ${limit} OFFSET ${offset};
    `;

    const rows = await q(sql, params);

    return res.json({
      ok: true,
      data: rows,
      page: Number(page),
      pageSize: limit,
    });

  } catch (err) {
    console.error("Erro GET /clientes-para-bloqueio:", err);
    return res.status(500).json({ ok: false, message: "Erro interno." });
  }
});

/* ============================================================================
   GET /api/home/empresas-por-negocio
============================================================================ */
router.get("/empresas-por-negocio", async (req, res) => {
  try {
    const { negocio } = req.query;

    const sql = `
      SELECT DISTINCT codemp, nome_empresa
      FROM titulos_financeiro
      WHERE negocio = $1
      ORDER BY codemp;
    `;

    const rows = await q(sql, [negocio]);

    return res.json({ ok: true, data: rows });

  } catch (err) {
    console.error("Erro GET /empresas-por-negocio:", err);
    return res.status(500).json({ ok: false });
  }
});

/* ============================================================================
   PATCH /api/home/clientes/:codparc/bloqueio
============================================================================ */
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

    await q(
      `
      UPDATE titulos_financeiro
         SET situacao = $3
       WHERE codemp = $1
         AND codparc = $2
      `,
      [codemp, codparc, novaSituacao]
    );

    res.json({
      ok: true,
      message: "Situação do cliente atualizada.",
      codemp,
      codparc,
      situacao: novaSituacao,
    });
  } catch (err) {
    console.error("Erro PATCH /clientes/bloqueio:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao atualizar situação do cliente.",
    });
  }
});

export default router;
