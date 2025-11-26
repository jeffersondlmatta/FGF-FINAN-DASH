// src/components/EmpresaFilter.jsx

export function EmpresaFilter({
  empresa,
  onChangeEmpresa,
  onBuscarTitulos,
  onBuscarBloqueio,
  onBuscarDesbloqueio,  
  loading,
}) {
  return (
    <div className="filter-bar">
      <label className="filter-label">
        Código da empresa:
        <input
          className="filter-input"
          type="number"
          value={empresa}
          onChange={(e) => onChangeEmpresa(e.target.value)}
          placeholder="Ex: 20"
        />
      </label>

      <button
        onClick={() => onBuscarTitulos(0)}
        className="btn btn-primary"
        disabled={loading}
      >
        Buscar
      </button>

      <button
        onClick={() => onBuscarBloqueio(0)}
        className="btn btn-danger"
        disabled={loading}
      >
        Passivo de bloqueio 
      </button>

      <button
        onClick={() => onBuscarDesbloqueio(0)}
        className="btn btn-warning"
        disabled={loading}
      >
        Desbloquear Clientes
      </button>
    </div>
  );
}
