import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/**
 * GET /api/desbloqueio/clientes
 * Lista clientes que estão BLOQUEADOS mas têm título PAGO.
 */
router.get("/clientes", async (req, res) => {
  try {
    const { empresa, page = 0, pageSize = 100 } = req.query;

    if (!empresa) {
      return res.status(400).json({
        ok: false,
        message: "Empresa é obrigatória.",
      });
    }

    const p = Number(page);
    const limit = Number(pageSize);
    const offset = p * limit;

    const sql = `
      SELECT DISTINCT ON (codparc)
             codemp,
             codparc,
             nome_empresa,
             nome_parceiro,
             situacao,
             status,
             dt_baixa,
             dt_vencimento,
             valor_desdobra,
             nufin
        FROM titulos_financeiro
       WHERE codemp = $1
         AND situacao ILIKE 'BLOQUEADO'
         AND dt_baixa IS NOT NULL
       ORDER BY codparc, dt_baixa DESC
       LIMIT $2 OFFSET $3
    `;

    const rows = await q(sql, [empresa, limit, offset]);

    res.json({
      ok: true,
      page: p,
      pageSize: limit,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Erro GET /api/desbloqueio/clientes:", err);
    res.status(500).json({
      ok: false,
      message: "Erro ao buscar clientes pagos & bloqueados.",
    });
  }
});

export default router;
