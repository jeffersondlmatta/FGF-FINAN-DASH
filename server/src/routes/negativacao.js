import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/**
 * GET /api/negativacao/clientes
 * Lista clientes com atraso > 30 e ainda não negativados
 */
router.get("/clientes", async (req, res) => {
  try {
    const { empresa, negocio, page = 0, pageSize = 100 } = req.query;

    const limit = Number(pageSize);
    const offset = Number(page) * limit;

    let params = [];
    let i = 1;

    let where = `
      atraso > 30
      AND negativado = 'N'
    `;

    if (empresa) {
      where += ` AND codemp = $${i++}`;
      params.push(Number(empresa));
    }

    if (negocio) {
      where += ` AND negocio = $${i++}`;
      params.push(negocio);
    }

    const sql = `
      SELECT DISTINCT ON (codparc)
        codemp,
        codparc,
        nome_empresa,
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
        negativado
      FROM titulos_financeiro
      WHERE ${where}
      ORDER BY codparc, atraso DESC
      LIMIT $${i++} OFFSET $${i++}
    `;

    params.push(limit, offset);

    const rows = await q(sql, params);

    return res.json({
      ok: true,
      data: rows,
      page,
      pageSize,
      count: rows.length,
    });

  } catch (err) {
    console.error("Erro negativação:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao listar clientes para negativação."
    });
  }
});



/**
 * POST /api/negativacao/lote
 * Marca clientes como negativados
 */
router.post("/lote", async (req, res) => {
  try {
    const { clientes } = req.body;

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return res.status(400).json({ ok: false, message: "Nenhum cliente informado." });
    }

    for (const c of clientes) {
      await q(
        `
        UPDATE titulos_financeiro
           SET negativado = 'S'
         WHERE codemp = $1
           AND codparc = $2
        `,
        [Number(c.codemp), Number(c.codparc)]
      );
    }

    return res.json({
      ok: true,
      count: clientes.length,
      message: "Clientes negativados com sucesso.",
    });

  } catch (err) {
    console.error("Erro NEGATIVAR:", err);
    return res.status(500).json({ ok: false, message: "Erro ao negativar clientes." });
  }
});

export default router;
