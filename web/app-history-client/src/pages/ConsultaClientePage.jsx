import { useState } from "react";
import api from "../services/api";
import "./ConsultaClientePage.css";

function formatarDocumento(doc) {
  if (!doc) return "";
  const nums = doc.replace(/\D/g, "");
  if (nums.length === 11) {
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (nums.length === 14) {
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return doc;
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const data = new Date(dataISO);
  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const ano = data.getUTCFullYear();
  return `${dia}-${mes}-${ano}`;
}

export default function ConsultaClientePage() {
  const [documento, setDocumento] = useState("");
  const [clientes, setClientes] = useState([]);
  const [titulos, setTitulos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [nome, setNome] = useState("");

  async function buscarCliente() {
  try {
    setErro(null);
    setLoading(true);
    setTitulos([]);
    setSelecionado(null);

    const resp = await api.get("/api/consulta-cliente/parceiros", {
      params: {
        documento: documento || undefined,
        nome: nome || undefined,
      },
    });

    setClientes(resp.data?.data ?? []);
  } catch {
    setErro("Erro ao buscar cliente.");
  } finally {
    setLoading(false);
  }
}


  async function carregarHistorico(cliente) {
    try {
      setErro(null);
      setLoading(true);
      setSelecionado(cliente);

      const resp = await api.get(
        `/api/consulta-cliente/${cliente.codparc}/titulos`,
        { params: { page: 0, pageSize: 200 } }
      );

      setTitulos(resp.data?.data ?? []);
    } catch {
      setErro("Erro ao carregar histórico do cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="consulta-page">
      <h1>Consulta de Cliente</h1>

      <div className="consulta-filtro">
        <input
          type="text"
          placeholder="Digite CNPJ ou CPF"
          value={documento}
          onChange={(e) => {
            setDocumento(e.target.value);
            if (e.target.value) setNome("");
          }}
        />
        <input
          type="text"
          placeholder="Digite Nome ou Razão Social"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (e.target.value) setDocumento("");
          }}
        />

        <button
          onClick={buscarCliente}
          disabled={loading || (!documento && !nome)}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {erro && <div className="msg-erro">{erro}</div>}

      {clientes.length > 0 && (
        <section className="card">
          <h2>Clientes encontrados</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cód</th>
                <th>Parceiro</th>
                <th>Documento</th>
                <th>Empresa</th>
                <th>Situação</th>
                <th>Negativado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.codparc}>
                  <td>{c.codparc}</td>
                  <td>{c.nome_parceiro}</td>
                  <td>{formatarDocumento(c.cgc_cpf_parc)}</td>
                  <td>{c.nome_empresa}</td>
                  <td>
                    <span className={`badge ${c.situacao?.toLowerCase()}`}>
                      {c.situacao}
                    </span>
                  </td>
                  <td>{c.negativado}</td>
                  <td>
                    <button
                      className="btn-secundario"
                      onClick={() => carregarHistorico(c)}
                    >
                      Histórico
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {selecionado && titulos.length > 0 && (
        <section className="card">
          <h2>Histórico financeiro · {selecionado.nome_parceiro}</h2>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NUFIN</th>
                  <th>Empresa</th>
                  <th>Natureza</th>
                  <th>Nota</th>
                  <th>Valor</th>
                  <th>Venc.</th>
                  <th>Baixa</th>
                  <th>Conta Baixa</th>
                  <th>Status</th>
                  <th>Atraso</th>
                  <th>Negócio</th>
                </tr>
              </thead>
              <tbody>
                {titulos.map((t) => (
                  <tr key={t.nufin}>
                    <td>{t.nufin}</td>
                    <td>{t.nome_empresa}</td>
                    <td>{t.descr_natureza}</td>
                    <td>{t.numnota}</td>
                    <td className="valor">
                      {Number(t.valor_desdobra).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td>{formatarData(t.dt_vencimento)}</td>
                    <td>{formatarData(t.dt_baixa)}</td>
                    <td>{t.ctabco_baixa}</td>
                    <td>
                      <span className={`badge status-${t.status?.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.atraso}</td>
                    <td>{t.negocio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
