export function EmpresaFilter({
  empresa,
  onChangeEmpresa,
  onBuscarTitulos,
  onBuscarBloqueio,
  onBuscarDesbloqueio,
  loading
}) {
  const disabled = !empresa || loading;

  return (
    <div className="filter-bar">
      <label className="filter-label">
        Empresa:
        <input
          type="text"
          value={empresa}
          onChange={(e) => onChangeEmpresa(e.target.value)}
          placeholder="CODEMP"
        />
      </label>

      <button
        className="btn btn-primary"
        onClick={() => onBuscarTitulos()}
        disabled={disabled}
      >
        Buscar
      </button>

      <button
        className="btn btn-danger"
        onClick={() => onBuscarBloqueio()}
        disabled={disabled}
      >
        Passivo de bloqueio
      </button>

      <button
        className="btn btn-warning"
        onClick={() => onBuscarDesbloqueio()}
        disabled={disabled}
      >
        Desbloquear Clientes
      </button>
    </div>
  );
}
