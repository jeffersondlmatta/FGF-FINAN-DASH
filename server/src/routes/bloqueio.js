import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/**
 * BLOQUEIO INDIVIDUAL
 */
router.post("/", async (req, res) => {
  try {
    const { codemp, codparc, novaSituacao } = req.body;

    if (!codemp || !codparc || !novaSituacao) {
      return res.status(400).json({
        ok: false,
        message: "Parâmetros inválidos.",
      });
    }

    await q(
      `
      UPDATE titulos_financeiro
         SET situacao = $3
       WHERE codemp = $1
         AND codparc = $2
      `,
      [Number(codemp), Number(codparc), novaSituacao.toUpperCase()]
    );

    return res.json({
      ok: true,
      message: "Situação atualizada.",
    });
  } catch (err) {
    console.error("Erro POST /api/bloqueio:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao aplicar bloqueio.",
    });
  }
});


/**
 * BLOQUEIO OU DESBLOQUEIO EM LOTE
 *
 * FRONT SEMPRE USA:
 * POST /api/bloqueio/lote
 *
 * novaSituacao enviada pelo front:
 *  - modo bloqueio     => BLOQUEADO
 *  - modo desbloqueio  => ATIVO
 */
router.post("/lote", async (req, res) => {
  try {
    const { clientes } = req.body;

    if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Nenhum cliente informado.",
      });
    }

    for (const c of clientes) {
      if (!c.codparc || !c.codemp || !c.novaSituacao) continue;

      await q(
        `
        UPDATE titulos_financeiro
           SET situacao = $3
         WHERE codparc = $1
           AND codemp = $2
        `,
        [
          Number(c.codparc),
          Number(c.codemp),
          c.novaSituacao.toUpperCase(),
        ]
      );
    }

    return res.json({
      ok: true,
      count: clientes.length,
      message: "Operação aplicada com sucesso.",
    });

  } catch (err) {
    console.error("Erro POST /api/bloqueio/lote:", err);
    return res.status(500).json({
      ok: false,
      message: "Erro ao aplicar operação em lote.",
    });
  }
});

export default router;
