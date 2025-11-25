// src/routes/empresas.js
import { Router } from "express";
import { q } from "../db.js";

const router = Router();

// -----------------------------------------------------------------------------
// PARCEIROS BLOQUEADOS POR EMPRESA
// GET /api/empresas/:codemp/parceiros-bloqueados?page=0&pageSize=100
// -----------------------------------------------------------------------------
router.get("/:codemp/parceiros-bloqueados", async (req, res) => {
  try {
    const codemp = Number(req.params.codemp);
    if (Number.isNaN(codemp)) {
      return res.status(400).json({ ok: false, message: "codemp inválido" });
    }

    const page = Number(req.query.page ?? 0);
    const pageSize = Math.min(Number(req.query.pageSize ?? 100), 1000);

    const rows = await q(
      `
      SELECT DISTINCT ON (codparc)
             codemp,
             codparc,
             nome_empresa,
             nome_parceiro,
             situacao
        FROM titulos_financeiro
       WHERE codemp = $1
         AND UPPER(situacao) = 'BLOQUEADO'
       ORDER BY codparc, nome_parceiro NULLS LAST
       LIMIT $2 OFFSET $3
      `,
      [codemp, pageSize, page * pageSize]
    );

    res.json({
      ok: true,
      page,
      pageSize,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "Erro ao listar parceiros bloqueados",
    });
  }
});

export default router;
