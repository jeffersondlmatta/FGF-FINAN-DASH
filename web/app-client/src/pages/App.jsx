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
    toggleBloqueio,
    aplicarLote, // <<<<<< IMPORTADO
  } = useTitulosFinanceiro();

  const [selectedCodparcs, setSelectedCodparcs] = useState([]);
  const [showToTop, setShowToTop] = useState(false);

  const handleToggleSelect = (codparc) => {
    setSelectedCodparcs((prev) =>
      prev.includes(codparc)
        ? prev.filter((c) => c !== codparc)
        : [...prev, codparc]
    );
  };

  const handleToggleSelectAll = () => {
    const ids = Array.from(
      new Set(titulos.filter((t) => t.codparc).map((t) => t.codparc))
    );
    setSelectedCodparcs(
      ids.length === selectedCodparcs.length ? [] : ids
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
      <h1 className="app-title">FGF - Financeiro</h1>

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
                Aplicar Bloqueio/Desbloqueio (em lote)
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
