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
    carregarMais,
    aplicarLote,
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
    const ids = Array.from(new Set(titulos.map((t) => t.codparc)));
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
        loading={loading}
      />

      {titulos.length > 0 && (
        <div className="actions-bar">
          {(modo === "bloqueio" || modo === "desbloqueio") && (
            <>
              <button
                className="btn btn-danger"
                disabled={selectedCodparcs.length === 0 || updating}
                onClick={() => aplicarLote(selectedCodparcs)}
              >
                {modo === "bloqueio"
                  ? "Aplicar Bloqueio (em lote)"
                  : "Desbloquear (em lote)"}
              </button>

              <button
                className="btn btn-outline"
                onClick={handleExportarExcel}
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
    </div>
  );
}
