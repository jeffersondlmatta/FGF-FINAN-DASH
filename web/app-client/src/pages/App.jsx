import "./App.css";
import { useEffect, useState } from "react";
import { useTitulosFinanceiro } from "../hooks/useTitulosFinanceiro.js";

import { EmpresaFilter } from "../components/EmpresaFilter.jsx";
import { TitulosTable } from "../components/TitulosTable.jsx";
import { exportClientesParaExcel } from "../utils/exportClientesParaExcel.js";

export default function App() {
  const {
    negocio,
    onChangeNegocio,
    empresa,
    setEmpresa,
    empresasDoNegocio,
    titulos,
    erro,
    loading,
    updating,
    modo,
    hasMore,
    pageSize,
    buscarParaBloqueio,
    buscarPagosBloqueados,
    buscarParaNegativar,
    buscarParaRemoverRestricao,
    carregarMais,
    aplicarLote,
    aplicarNegativacaoLote,
    aplicarRemoverRestricaoLote,
    buscarParceirosBloqueados, 
  } = useTitulosFinanceiro();

  const [selectedCodparcs, setSelectedCodparcs] = useState([]);

  const handleToggleSelect = (codparc) => {
    setSelectedCodparcs((prev) =>
      prev.includes(codparc)
        ? prev.filter((c) => c !== codparc)
        : [...prev, codparc]
    );
  };

  const handleToggleSelectAll = () => {
    const ids = Array.from(
      new Set(titulos.map((t) => t.codparc).filter(Boolean))
    );

    setSelectedCodparcs(
      selectedCodparcs.length === ids.length ? [] : ids
    );
  };

  const handleExportarExcel = () => {
    if (!titulos.length) return alert("Sem dados para exportar.");
    exportClientesParaExcel(titulos);
  };

  useEffect(() => {
    setSelectedCodparcs([]);
  }, [modo, titulos]);

  return (
    <div className="app-container">
      <h1 className="app-title">FGF - FINANCEIRO</h1>

      <EmpresaFilter
        negocio={negocio}
        empresa={empresa}
        empresasDoNegocio={empresasDoNegocio}
        onChangeNegocio={onChangeNegocio}
        onChangeEmpresa={setEmpresa}
        onBuscarBloqueio={buscarParaBloqueio}
        onBuscarDesbloqueio={buscarPagosBloqueados}
        onBuscarNegativacao={buscarParaNegativar}
        onBuscarRemoverRestricao={buscarParaRemoverRestricao}

        loading={loading}
      />

      {titulos.length > 0 && (
        <div className="actions-bar">

          {/* PASSIVO DE BLOQUEIO */}
          {modo === "bloqueio" && (
            <>
              <button
                className="btn btn-danger"
                disabled={selectedCodparcs.length === 0 || updating}
                onClick={() => aplicarLote(selectedCodparcs)}
              >
                Aplicar Bloqueio (em lote)
              </button>

              {/*PARCEIROS BLOQUEADOS */}
              <button
                className="btn btn-outline"
                disabled={loading}
                onClick={buscarParceirosBloqueados}
              >
                Parceiros Bloqueados
              </button>

              {/* Exportação */}
              <button
                className="btn btn-outline"
                onClick={handleExportarExcel}
                disabled={updating}
              >
                Exportar Excel
              </button>
            </>
          )}

          {/* DESBLOQUEIO */}
          {modo === "desbloqueio" && (
            <>
            <button
              className="btn btn-warning"
              disabled={selectedCodparcs.length === 0 || updating}
              onClick={() => aplicarLote(selectedCodparcs)}
            >
              Desbloquear (em lote)
            </button>

            <button
                className="btn btn-outline"
                onClick={handleExportarExcel}
                disabled={updating}
              >
                Exportar Excel
              </button>
              </>
            
          )}

          {/* NEGATIVAÇÃO */}
          {modo === "negativacao" && (
            <>
              <button
                className="btn btn-dark"
                disabled={selectedCodparcs.length === 0 || updating}
                onClick={() => aplicarNegativacaoLote(selectedCodparcs)}
              >
                Aplicar Negativação
              </button>

              <button
                className="btn btn-outline"
                onClick={handleExportarExcel}
                disabled={updating}
              >
                Exportar Excel
              </button>
            </>
          )}

          {/* REMOVER RESTRIÇÃO */}
          {modo === "removerRestricao" && (
            <>
              <button
                className="btn btn-success"
                disabled={selectedCodparcs.length === 0 || updating}
                onClick={() => aplicarRemoverRestricaoLote(selectedCodparcs)}
              >
                Remover Restrição
              </button>

              <button
                className="btn btn-outline"
                onClick={handleExportarExcel}
                disabled={updating}
              >
                Exportar Excel
              </button>
            </>
          )}

          <span>
            Registros: {titulos.length} (lote {pageSize})
          </span>
        </div>
      )}

      {erro && <p className="msg msg-error">{erro}</p>}
      {loading && <p className="msg">Carregando…</p>}

      <TitulosTable
        titulos={titulos}
        modo={modo}
        updating={updating}
        selectedCodparcs={selectedCodparcs}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
      />

      {hasMore && !loading && (
        <button
          className="btn btn-secondary"
          onClick={carregarMais}
        >
          Carregar mais
        </button>
      )}
    </div>
  );
}
