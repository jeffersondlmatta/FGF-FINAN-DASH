import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| 1) LISTAR CLIENTES PARA NEGATIVAÇÃO
|--------------------------------------------------------------------------
| Critérios:
| - atraso > 30 dias
| - negativado = 'N'
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
        dt_vencimento,
        atraso,
        status,
        historico,
        negativado,
        situacao
      FROM titulos_financeiro
      WHERE ${where}
      ORDER BY codparc, atraso DESC
      LIMIT $${i++} OFFSET $${i++}
    `;

    params.push(limit, offset);

    const rows = await q(sql, params);

    return res.json({ ok: true, data: rows });

  } catch (err) {
    console.error("Erro negativacao/clientes:", err);
    return res.status(500).json({ ok: false, message: "Erro ao listar clientes para negativação." });
  }
});


/*
|--------------------------------------------------------------------------
| 2) APLICAR NEGATIVAÇÃO EM LOTE
|--------------------------------------------------------------------------
*/
router.post("/lote", async (req, res) => {
  try {
    const { clientes } = req.body;

    if (!clientes || clientes.length === 0)
      return res.status(400).json({ ok: false, message: "Nenhum cliente enviado." });

    for (const c of clientes) {
      await q(
        `
        UPDATE titulos_financeiro
           SET negativado = 'S'
         WHERE codparc = $1 
           AND codemp = $2
        `,
        [c.codparc, c.codemp]
      );
    }

    return res.json({ ok: true, count: clientes.length });

  } catch (err) {
    console.error("Erro negativacao/lote:", err);
    return res.status(500).json({ ok: false, message: "Erro ao negativar clientes." });
  }
});


/*
|--------------------------------------------------------------------------
| 3) LISTAR CLIENTES QUE PODEM REMOVER RESTRIÇÃO
|--------------------------------------------------------------------------
| Critérios:
| - negativado = 'S'
| - cliente NÃO possui títulos com atraso > 30
*/
router.get("/remover", async (req, res) => {
  try {
    const { empresa, negocio, page = 0, pageSize = 100 } = req.query;

    const limit = Number(pageSize);
    const offset = Number(page) * limit;

    let params = [];
    let i = 1;

    let where = `
      negativado = 'S'
      AND codparc NOT IN (
        SELECT DISTINCT codparc FROM titulos_financeiro WHERE atraso > 30
      )
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
        dt_vencimento,
        atraso,
        status,
        historico,
        negativado,
        situacao
      FROM titulos_financeiro
      WHERE ${where}
      ORDER BY codparc, dt_vencimento DESC
      LIMIT $${i++} OFFSET $${i++}
    `;

    params.push(limit, offset);

    const rows = await q(sql, params);

    return res.json({ ok: true, data: rows });

  } catch (err) {
    console.error("Erro negativacao/remover:", err);
    return res.status(500).json({ ok: false, message: "Erro ao buscar remoção de restrição." });
  }
});


/*
|--------------------------------------------------------------------------
| 4) REMOVER RESTRIÇÃO EM LOTE (SET negativado = 'N')
|--------------------------------------------------------------------------
*/
router.post("/remover/lote", async (req, res) => {
  try {
    const { clientes } = req.body;

    if (!clientes || clientes.length === 0)
      return res.status(400).json({ ok: false, message: "Nenhum cliente enviado." });

    for (const c of clientes) {
      await q(
        `
        UPDATE titulos_financeiro
           SET negativado = 'N'
         WHERE codparc = $1 
           AND codemp = $2
        `,
        [c.codparc, c.codemp]
      );
    }

    return res.json({ ok: true, count: clientes.length });

  } catch (err) {
    console.error("Erro negativacao/remover/lote:", err);
    return res.status(500).json({ ok: false, message: "Erro ao remover restrição." });
  }
});

export default router;
