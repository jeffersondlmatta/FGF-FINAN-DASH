import pg from "pg";
import "dotenv/config";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Parse dd/mm/yyyy
function parseDMY(dmy) {
  if (!dmy || typeof dmy !== "string" || !dmy.includes("/")) return null;
  const [d, m, y] = dmy.split("/").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

// Calcula status (pago / atrasado / a vencer)
function calcStatus(DTVENC, dhBaixa) {
  if (dhBaixa) return "Pago";
  if (!DTVENC) return null;

  const hoje = new Date();
  const z = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const vencZ = z(DTVENC);
  const hojeZ = z(hoje);

  if (vencZ < hojeZ) return "Atrasado";
  return "a vencer";
}

// Calcula atraso
function calcAtraso(DTVENC, status) {
  if (!DTVENC || status !== "Atrasado") return 0;

  const hoje = new Date();
  const z = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const vencZ = z(DTVENC);
  const hojeZ = z(hoje);

  const diffMs = hojeZ - vencZ;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDias > 0 ? diffDias : 0;
}

// 🧠 Normalização para comparar naturezas sem dor de cabeça
function normalize(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")                     // separa acentos
    .replace(/[\u0300-\u036f]/g, "")      // remove acentos
    .replace(/\./g, "")                   // remove pontos
    .replace(/\s+/g, " ")                 // normaliza espaços
    .trim();
}

// Mapeamento de NEGÓCIO
function getNegocio(codemp) {
  if (codemp === 20) return "Gob";
  if ([18, 17, 14, 9, 13].includes(codemp)) return "Contabilidade";
  if ([15, 8, 1].includes(codemp)) return "Revisão";
  if (codemp === 16) return "Jurídico";
  if (codemp === 3) return "RH";
  return null;
}

// LISTA OFICIAL DE NATUREZAS PERMITIDAS (forma "canônica")
const naturezasReceitaBase = [
  "receita de contabilidade retroativa",
  "receita de contabilidade",
  "receita servicos avulsos contabil",
  "servicos avulsos contabilidade",
  "servicos avulsos departamento pessoal",
  "servicos avulsos legalizacao",
  "receita manut revisao fiscal",        // pega "RECEITA MANUT. REVISÃO FISCAL" normalizado
  "receita portal revisao fiscal",       // pega "RECEITA PORTAL REVISÃO FISCAL" normalizado
  "receita revisao fiscal",
  "receita servico calculo st fiscal",
  "receita gob cfiscal",
  "receita gob implantacao",
  "receita gob perdcomp",
  "receita gob retroativo",
];

// transforma tudo em forma normalizada e já joga num Set
const naturezasReceitaSet = new Set(
  naturezasReceitaBase.map((n) => normalize(n))
);

// Mapeamento
function mapRowToDb(row) {
  const get = (i) => row[`f${i}`]?.["$"] ?? null;

  const nufin       = get(0) ? Number(get(0)) : null;
  const dhBaixaStr  = get(2);
  const dtVencStr   = get(3);

  const dtBaixa     = parseDMY(dhBaixaStr);
  const dtVenc      = parseDMY(dtVencStr);

  let numnota       = get(4) || get(7);
  const valorDesdobra = get(8) ? Number(get(8)) : null;

  const cgcCpfParc  = get(9);
  const dtNegStr    = get(10);
  const dtNeg       = parseDMY(dtNegStr);
  const ctaBcBaixa  = get(11);
  const historico   = get(12);

  const nomeEmpresa   = get(13);
  const nomeParceiro  = get(14);
  const descrNatureza = get(15);
  const ativoContrato = get(16);

  const codemp = get(6) ? Number(get(6)) : null;
  const codparc = get(5) ? Number(get(5)) : null;

  const status = calcStatus(dtVenc, dtBaixa);
  const atraso = calcAtraso(dtVenc, status);
  const negocio = getNegocio(codemp);

  return {
    nufin,
    nome_empresa: nomeEmpresa,
    nome_parceiro: nomeParceiro,
    descr_natureza: descrNatureza,
    numnota: numnota ? Number(numnota) : null,
    valor_desdobra: valorDesdobra,
    dt_vencimento: dtVenc ? dtVenc.toISOString().slice(0, 10) : null,
    dt_baixa: dtBaixa ? dtBaixa.toISOString() : null,
    codemp,
    codparc,
    status,
    situacao: null,
    atraso,
    ativo_contrato: ativoContrato ?? null,

    cgc_cpf_parc: cgcCpfParc ?? null,
    dt_negociacao: dtNeg ? dtNeg.toISOString().slice(0, 10) : null,
    ctabco_baixa: ctaBcBaixa ?? null,
    historico: historico ?? null,
    negocio,
  };
}

// UPSERT (igual ao seu, só mantive)
async function upsertTitulo(client, t) {
  const sql = `
    INSERT INTO titulos_financeiro
      (nufin, nome_empresa, nome_parceiro, descr_natureza, numnota, valor_desdobra,
       dt_vencimento, dt_baixa, codemp, codparc, status, situacao, atraso, ativo_contrato,
       cgc_cpf_parc, dt_negociacao, ctabco_baixa, historico, negocio)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    ON CONFLICT (nufin) DO UPDATE SET
      nome_empresa      = EXCLUDED.nome_empresa,
      nome_parceiro     = EXCLUDED.nome_parceiro,
      descr_natureza    = EXCLUDED.descr_natureza,
      numnota           = EXCLUDED.numnota,
      valor_desdobra    = EXCLUDED.valor_desdobra,
      dt_vencimento     = EXCLUDED.dt_vencimento,
      dt_baixa          = EXCLUDED.dt_baixa,
      codemp            = EXCLUDED.codemp,
      codparc           = EXCLUDED.codparc,
      status            = EXCLUDED.status,
      atraso            = EXCLUDED.atraso,
      ativo_contrato    = EXCLUDED.ativo_contrato,
      cgc_cpf_parc      = EXCLUDED.cgc_cpf_parc,
      dt_negociacao     = EXCLUDED.dt_negociacao,
      ctabco_baixa      = EXCLUDED.ctabco_baixa,
      historico         = EXCLUDED.historico,
      negocio           = EXCLUDED.negocio,
      situacao          = COALESCE(titulos_financeiro.situacao, EXCLUDED.situacao);
  `;

  const params = [
    t.nufin,
    t.nome_empresa,
    t.nome_parceiro,
    t.descr_natureza,
    t.numnota,
    t.valor_desdobra,
    t.dt_vencimento,
    t.dt_baixa,
    t.codemp,
    t.codparc,
    t.status,
    t.situacao,
    t.atraso,
    t.ativo_contrato,
    t.cgc_cpf_parc,
    t.dt_negociacao,
    t.ctabco_baixa,
    t.historico,
    t.negocio
  ];

  await client.query(sql, params);
}

// LOTE
export async function carregarTitulosNoBanco(registros) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of registros) {
      const t = mapRowToDb(row);

      const descrNorm = normalize(t.descr_natureza || "");
      const naturezaValida = naturezasReceitaSet.has(descrNorm);

      const ativo = (t.ativo_contrato || "").toString().trim().toUpperCase();

      if (!t.nufin || !t.numnota || t.numnota === 0 || !naturezaValida || ativo !== "S") {
        continue;
      }

      await upsertTitulo(client, t);
    }

    await client.query("COMMIT");
    return { ok: true, count: registros.length };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
