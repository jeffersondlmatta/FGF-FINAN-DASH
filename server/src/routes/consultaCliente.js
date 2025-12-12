import { Router } from "express";
import { q } from "../db.js";

const router = Router();

/**
 * GET /api/consulta-cliente/parceiros?documento=...
 * Busca parceiros pelo CNPJ/CPF (campo cgc_cpf_parc)
 * Retorna 1 linha por parceiro (histórico resumido)
 */
router.get("/parceiros", async (req, res) => {
  try {
    const documento = (req.query.documento || "").replace(/\D/g, ""); // só números

    if (!documento) {
      return res.status(400).json({ ok: false, message: "Informe o CNPJ/CPF." });
    }

    const rows = await q(
      `
      SELECT distinct on (codparc)
             codparc,
             cgc_cpf_parc,
             nome_parceiro,
             nome_empresa,
             codemp,
             situacao,
             negativado,
             ativo_contrato
        FROM titulos_financeiro
       WHERE regexp_replace(cgc_cpf_parc, '\\D', '', 'g') = $1
       ORDER BY codparc, dt_vencimento DESC
      `,
      [documento]
    );

    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Erro GET /api/consulta-cliente/parceiros:", err);
    return res.status(500).json({ ok: false, message: "Erro ao buscar parceiro." });
  }
});

/**
 * GET /api/consulta-cliente/:codparc/titulos?empresa=&status=&page=&pageSize=
 * Traz TODOS os títulos do cliente (visão geral do histórico)
 */
router.get("/:codparc/titulos", async (req, res) => {
  try {
    const codparc = Number(req.params.codparc);
    if (Number.isNaN(codparc)) {
      return res.status(400).json({ ok: false, message: "codparc inválido." });
    }

    const empresa = req.query.empresa ? Number(req.query.empresa) : null;
    const status = (req.query.status || "todos").toString().toLowerCase();
    const page = Number(req.query.page ?? 0);
    const pageSize = Math.min(Number(req.query.pageSize ?? 100), 500);

    const where = ["codparc = $1"];
    const params = [codparc];
    let i = 2;

    if (empresa) {
      where.push(`codemp = $${i++}`);
      params.push(empresa);
    }

    if (status !== "todos") {
      if (status === "pago") {
        where.push("dt_baixa IS NOT NULL");
      } else if (status === "aberto") {
        where.push("dt_baixa IS NULL AND dt_vencimento >= CURRENT_DATE");
      } else if (status === "atrasado") {
        where.push("dt_baixa IS NULL AND dt_vencimento < CURRENT_DATE");
      }
    }

    const sql = `
      SELECT
        nufin,
        nome_empresa,
        nome_parceiro,
        descr_natureza,
        numnota,
        valor_desdobra,
        dt_vencimento,
        dt_baixa,
        codemp,
        codparc,
        status,
        situacao,
        observacao,
        atraso,
        ativo_contrato,
        cgc_cpf_parc,
        dt_negociacao,
        ctabco_baixa,
        historico,
        negocio,
        negativado
      FROM titulos_financeiro
      WHERE ${where.join(" AND ")}
      ORDER BY dt_vencimento DESC
      LIMIT $${i++} OFFSET $${i++}
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
    console.error("Erro GET /api/consulta-cliente/:codparc/titulos", err);
    return res.status(500).json({ ok: false, message: "Erro ao listar títulos do cliente." });
  }
});

export default router;
