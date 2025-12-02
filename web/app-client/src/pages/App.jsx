// src/pages/App.jsx
import "./App.css";
import { useEffect, useState } from "react";
import { useTitulosFinanceiro } from "../hooks/useTitulosFinanceiro.js";
import { EmpresaFilter } from "../components/EmpresaFilter.jsx";
import { TitulosTable } from "../components/TitulosTable.jsx";
import { exportClientesParaExcel } from "../utils/exportClientesParaExcel.js";

export default function App() {
  const {
    empresa,
    setEmpresa,
    titulos,
    erro,
    loading,
    updating,
    modo, // "titulos" | "bloqueio" | "desbloqueio"
    hasMore,
    pageSize,
    carregarTitulos,
    buscarParaBloqueio,
    buscarPagosBloqueados,
    carregarMais,
    toggleBloqueio, // recebe o OBJETO título
  } = useTitulosFinanceiro();

  const [showToTop, setShowToTop] = useState(false);

  // guarda os codparc selecionados
  const [selectedCodparcs, setSelectedCodparcs] = useState([]);

  const handleExportarExcel = () => {
    if (modo !== "bloqueio" && modo !== "desbloqueio") {
      alert(
        "A exportação está disponível apenas para 'Clientes para bloqueio' ou 'Pagos & Bloqueados'."
      );
      return;
    }

    if (!titulos.length) {
      alert("Não há registros para exportar.");
      return;
    }

    exportClientesParaExcel(titulos);
  };

  // aplica bloqueio/desbloqueio em lote
  const handleAplicarSituacaoLote = async () => {
    if (!selectedCodparcs.length) {
      alert("Selecione pelo menos um cliente para aplicar a ação.");
      return;
    }

    const acao = modo === "bloqueio" ? "bloquear" : "desbloquear";

    const ok = window.confirm(
      `Confirma ${acao} ${selectedCodparcs.length} cliente(s) selecionado(s)?`
    );
    if (!ok) return;

    // pega 1 título representativo por cliente (codparc)
    const mapaClientes = new Map();
    for (const t of titulos) {
      if (!t.codparc || !t.codemp) continue;
      if (!selectedCodparcs.includes(t.codparc)) continue;
      if (!mapaClientes.has(t.codparc)) {
        mapaClientes.set(t.codparc, t);
      }
    }

    for (const t of mapaClientes.values()) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await toggleBloqueio(t); // mesma função que já existia no botão antigo
      } catch (e) {
        console.error("Falha ao aplicar situação para registro:", t, e);
      }
    }

    setSelectedCodparcs([]);
  };

  // toggle de seleção por codparc
  const handleToggleSelect = (codparc) => {
    if (!codparc) return;
    setSelectedCodparcs((prev) =>
      prev.includes(codparc)
        ? prev.filter((c) => c !== codparc)
        : [...prev, codparc]
    );
  };

  // selecionar / limpar todos (clientes únicos)
  const handleToggleSelectAll = (alreadyAllSelected) => {
    if (alreadyAllSelected) {
      setSelectedCodparcs([]);
    } else {
      const ids = Array.from(
        new Set(
          titulos
            .filter((t) => t.codparc)
            .map((t) => t.codparc)
        )
      );
      setSelectedCodparcs(ids);
    }
  };

  // sempre que mudar o modo ou a lista de títulos, zera a seleção
  useEffect(() => {
    setSelectedCodparcs([]);
  }, [modo, titulos]);

  // Scroll infinito + botão "voltar ao topo"
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop;
      const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const fullHeight = document.documentElement.scrollHeight;

      setShowToTop(scrollTop > 300);

      if (loading || !titulos.length || !hasMore) return;

      if (scrollTop + windowHeight >= fullHeight - 200) {
        carregarMais();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, titulos.length, hasMore, carregarMais]);

  return (
    <div className="app-container">
      <h1 className="app-title">FGF - Financeiro</h1>

      <EmpresaFilter
        empresa={empresa}
        onChangeEmpresa={setEmpresa}
        onBuscarTitulos={carregarTitulos}
        onBuscarBloqueio={buscarParaBloqueio}
        onBuscarDesbloqueio={buscarPagosBloqueados}
        loading={loading}
      />

      {/* Ações gerais (bloqueio em lote, exportar, contagem) */}
      {titulos.length > 0 && (
        <div className="actions-bar">
          {(modo === "bloqueio" || modo === "desbloqueio") && (
            <>
              <button
                className="btn btn-danger"
                onClick={handleAplicarSituacaoLote}
                disabled={
                  loading || updating || selectedCodparcs.length === 0
                }
              >
                {modo === "bloqueio"
                  ? "Bloquear selecionados"
                  : "Desbloquear selecionados"}
              </button>

              <button
                className="btn btn-outline"
                onClick={handleExportarExcel}
                disabled={loading || titulos.length === 0}
              >
                {modo === "bloqueio"
                  ? "Exportar Excel (clientes para bloqueio)"
                  : "Exportar Excel (pagos & bloqueados)"}
              </button>
            </>
          )}

          <span className="pagination-info">
            Registros carregados: {titulos.length} (lote de {pageSize})
            {hasMore ? " — rolando carrega mais..." : " — fim da lista."}
          </span>
        </div>
      )}

      {/* Mensagens */}
      {erro && <p className="msg msg-error">Erro: {erro}</p>}
      {loading && <p className="msg">Carregando...</p>}
      {!loading && !erro && titulos.length === 0 && (
        <p className="msg">Nenhum título encontrado.</p>
      )}

      <TitulosTable
        titulos={titulos}
        updating={updating}
        modo={modo}
        selectedCodparcs={selectedCodparcs}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
      />

      {!loading && titulos.length > 0 && (
        <p className="msg">
          Modo atual:{" "}
          <strong>
            {modo === "titulos"
              ? "Títulos em aberto da empresa"
              : modo === "bloqueio"
              ? "Clientes para bloqueio"
              : "Pagos & Bloqueados"}
          </strong>
        </p>
      )}

      {/* Botão Voltar ao topo */}
      {showToTop && (
        <button
          className="btn btn-secondary btn-voltar-topo"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          Voltar ao topo
        </button>
      )}
    </div>
  );
}
