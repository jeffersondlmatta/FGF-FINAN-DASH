import { Router } from "express";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const router = Router();

/**
 * Função de negócio para atualizar situação de um cliente
 * - Atualiza APENAS o campo "situacao"
 * - NÃO altera "status"
 */
async function atualizarSituacaoCliente({ codemp, codparc, novaSituacao }) {
  if (!codemp || !codparc || !novaSituacao) {
    throw new Error("codemp, codparc e novaSituacao são obrigatórios.");
  }

  const situacaoUpper = String(novaSituacao).toUpperCase();

  if (!["BLOQUEADO", "LIBERADO"].includes(situacaoUpper)) {
    throw new Error(
      "novaSituacao inválida. Use 'BLOQUEADO' ou 'LIBERADO'."
    );
  }

  const sql = `
    UPDATE titulos_financeiro
       SET situacao = $1
     WHERE codemp   = $2
       AND codparc  = $3;
  `;

  await pool.query(sql, [situacaoUpper, codemp, codparc]);

  return situacaoUpper;
}

/**
 * GET /api/bloqueio/clientes
 * Lista clientes elegíveis para bloqueio
 * - status = atrasado
 * - situacao = LIBERADO
 * - agrupado por cliente
 * - MAX(atraso)
 * - ordenado por nome_parceiro
 */
router.get("/clientes", async (req, res) => {
  try {
    const { empresa, page = 0, pageSize = 100 } = req.query;

    if (!empresa) {
      return res.status(400).json({
        ok: false,
        error: "Informe o código da empresa (empresa).",
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
        MAX(atraso)         AS atraso,
        COUNT(*)            AS qtd_titulos,
        SUM(valor_desdobra) AS valor_total
      FROM titulos_financeiro
      WHERE codemp   = $1
        AND status   = 'atrasado'
        AND situacao = 'LIBERADO'
      GROUP BY codemp, codparc, nome_parceiro, situacao
      ORDER BY nome_parceiro
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(sql, [empresa, limit, offset]);

    res.json({
      ok: true,
      page: p,
      pageSize: limit,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Erro GET /api/bloqueio/clientes:", error);
    res.status(500).json({
      ok: false,
      error: "Erro ao buscar clientes para bloqueio.",
    });
  }
});

/**
 * NOVO PADRÃO
 * POST /api/bloqueio
 *
 * Body:
 * {
 *   "codemp": number | string,
 *   "codparc": number | string,
 *   "novaSituacao": "BLOQUEADO" | "LIBERADO"
 * }
 *
 * Usado pelo front (toggleBloqueio):
 * - NÃO mexe em STATUS, só em SITUACAO
 */
router.post("/", async (req, res) => {
  try {
    const { codemp, codparc, novaSituacao } = req.body;

    if (!codemp || !codparc || !novaSituacao) {
      return res.status(400).json({
        ok: false,
        error: "Informe codemp, codparc e novaSituacao.",
      });
    }

    const situacaoFinal = await atualizarSituacaoCliente({
      codemp,
      codparc,
      novaSituacao,
    });

    return res.json({
      ok: true,
      codemp,
      codparc,
      situacao: situacaoFinal,
    });
  } catch (error) {
    console.error("Erro POST /api/bloqueio:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Erro ao atualizar situação do cliente.",
    });
  }
});

/**
 * MODO ANTIGO (mantido por compatibilidade)
 * PATCH /api/bloqueio/atualizar/:codparc
 *
 * Body:
 * {
 *   "empresa": number | string,
 *   "bloquear": true | false
 * }
 *
 * - bloquear = true  -> BLOQUEADO
 * - bloquear = false -> LIBERADO
 */
router.patch("/atualizar/:codparc", async (req, res) => {
  try {
    const { codparc } = req.params;
    const { empresa, bloquear } = req.body;

    if (!empresa || !codparc || typeof bloquear === "undefined") {
      return res.status(400).json({
        ok: false,
        error:
          "Informe empresa, codparc e bloquear (true/false).",
      });
    }

    const novaSituacao = bloquear ? "BLOQUEADO" : "LIBERADO";

    const situacaoFinal = await atualizarSituacaoCliente({
      codemp: empresa,
      codparc,
      novaSituacao,
    });

    res.json({ ok: true, situacao: situacaoFinal });
  } catch (error) {
    console.error("Erro PATCH /api/bloqueio/atualizar/:codparc:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "Erro ao atualizar situação do cliente.",
    });
  }
});

export default router;
