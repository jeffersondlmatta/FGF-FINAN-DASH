import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/**
 * GET /api/desbloqueio/clientes
 *
 * Regras:
 *  - situacao = BLOQUEADO
 *  - status = 'PAGO'
 *  - cliente só deve aparecer se NÃO existir nenhum título atrasado > 20 dias
 *  - empresa OPCIONAL
 */
router.get("/clientes", async (req, res) => {
  try {
    const empresa = req.query.empresa?.trim() || null;

    const page = Number(req.query.page ?? 0);
    const pageSize = Math.min(Number(req.query.pageSize ?? 100), 500);

    const params = [];
    let i = 1;

    // ---------------------------------------------------------------------
    // WHERE + NOT EXISTS (sem atraso > 20)
    // ---------------------------------------------------------------------
    let where = `
      UPPER(t.situacao) = 'BLOQUEADO'
      AND UPPER(t.status) = 'PAGO'
      AND NOT EXISTS (
            SELECT 1
              FROM titulos_financeiro x
             WHERE x.codparc = t.codparc
               AND x.codemp = t.codemp
               AND UPPER(x.status) = 'ATRASADO'
               AND x.atraso > 20
      )
    `;

    if (empresa) {
      where += ` AND t.codemp = $${i++} `;
      params.push(Number(empresa));
    }

    // ---------------------------------------------------------------------
    // SQL principal com DISTINCT ON para evitar duplicatas por título
    // ---------------------------------------------------------------------
    const sql = `
      SELECT DISTINCT ON (t.codparc)
             t.codemp,
             t.codparc,
             t.nome_empresa,
             t.nome_parceiro,
             t.descr_natureza,
             t.nufin,
             t.valor_desdobra,
             t.dt_vencimento,
             t.dt_baixa,
             t.status,
             t.atraso,
             t.historico,
             t.situacao
        FROM titulos_financeiro t
       WHERE ${where}
       ORDER BY t.codparc, t.nome_parceiro NULLS LAST
       LIMIT $${i++} OFFSET $${i++}
    `;

    params.push(pageSize, page * pageSize);

    const rows = await q(sql, params);

    return res.json({
      ok: true,
      data: rows,
      page,
      pageSize,
      count: rows.length
    });

  } catch (err) {
    console.error("Erro GET /api/desbloqueio/clientes:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao listar clientes para desbloqueio."
    });
  }
});

/**
 * POST /api/desbloqueio/lote
 *
 * DESBLOQUEIO EM LOTE:
 *   situacao = ATIVO
 */
router.post("/lote", async (req, res) => {
  try {
    const { clientes } = req.body;

    if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Nenhum cliente informado."
      });
    }

    for (const c of clientes) {
      if (!c.codparc || !c.codemp) continue;

      await q(
        `
        UPDATE titulos_financeiro
           SET situacao = 'ATIVO'
         WHERE codparc = $1
           AND codemp = $2
        `,
        [Number(c.codparc), Number(c.codemp)]
      );
    }

    return res.json({
      ok: true,
      count: clientes.length,
      message: "Clientes desbloqueados com sucesso."
    });

  } catch (err) {
    console.error("Erro POST /api/desbloqueio/lote:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao desbloquear clientes."
    });
  }
});

export default router;
