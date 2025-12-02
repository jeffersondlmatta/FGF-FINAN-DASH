import { Router } from "express";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const router = Router();

/**
 * GET /api/desbloqueio/clientes
 *
 * Lista clientes BLOQUEADOS que:
 *  - NÃO possuem títulos atrasados
 *  - POSSUEM pelo menos um título pago
 *
 * Ou seja: já podem ser liberados.
 */
router.get("/clientes", async (req, res) => {
  try {
    const { empresa, page = 0, pageSize = 100 } = req.query;

    if (!empresa) {
      return res.status(400).json({
        ok: false,
        message: "Informe o código da empresa (empresa).",
      });
    }

    const p = Number(page) || 0;
    const limit = Number(pageSize) || 100;
    const offset = p * limit;

    const sql = `
      SELECT
        codemp,
        codparc,
        nome_parceiro,
        situacao,
        MAX(atraso)         AS atraso_max,
        COUNT(*)            AS qtd_titulos,
        SUM(valor_desdobra) AS valor_total,
        SUM(CASE WHEN status = 'atrasado' THEN 1 ELSE 0 END) AS qtd_atrasados,
        SUM(CASE WHEN status = 'pago'     THEN 1 ELSE 0 END) AS qtd_pagos
      FROM titulos_financeiro
      WHERE codemp   = $1
        AND situacao = 'BLOQUEADO'
      GROUP BY codemp, codparc, nome_parceiro, situacao
      HAVING
        SUM(CASE WHEN status = 'atrasado' THEN 1 ELSE 0 END) = 0
        AND
        SUM(CASE WHEN status = 'pago' THEN 1 ELSE 0 END) > 0
      ORDER BY nome_parceiro
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(sql, [empresa, limit, offset]);

    return res.json({
      ok: true,
      page: p,
      pageSize: limit,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Erro GET /api/desbloqueio/clientes:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao buscar clientes elegíveis para desbloqueio.",
    });
  }
});

export default router;
