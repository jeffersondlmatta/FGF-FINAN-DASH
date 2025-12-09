import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/*
|----------------------------------------------------------------------
| GET /api/bloqueados/por-negocio
|
| Lista todos os parceiros que estão:
|   - situacao = 'BLOQUEADO'
|   - filtrados por negócio
|   - empresa é opcional
|   - 1 linha por parceiro (DISTINCT ON)
|----------------------------------------------------------------------
*/
router.get("/por-negocio", async (req, res) => {
  try {
    const { negocio, empresa, page = 0, pageSize = 100 } = req.query;

    if (!negocio) {
      return res.status(400).json({
        ok: false,
        message: "Parâmetro 'negocio' é obrigatório.",
      });
    }

    const limit = Number(pageSize);
    const offset = Number(page) * limit;

    let params = [];
    let i = 1;

    let where = `
      situacao ILIKE 'BLOQUEADO'
      AND negocio = $${i++}
    `;
    params.push(negocio);

    if (empresa) {
      where += ` AND codemp = $${i++}`;
      params.push(Number(empresa));
    }

    const sql = `
      SELECT DISTINCT ON (codparc)
        codemp,
        codparc,
        nome_empresa,
        nome_parceiro,
        descr_natureza,
        nufin,
        dt_vencimento,
        atraso,
        status,
        historico,
        negativado,
        situacao
      FROM titulos_financeiro
      WHERE ${where}
      ORDER BY codparc, atraso DESC
      LIMIT $${i++} OFFSET $${i++};
    `;

    params.push(limit, offset);

    const rows = await q(sql, params);

    return res.json({
      ok: true,
      data: rows,
      page: Number(page),
      pageSize: limit,
    });

  } catch (err) {
    console.error("Erro GET /api/bloqueados/por-negocio:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao listar parceiros bloqueados.",
    });
  }
});

export default router;
