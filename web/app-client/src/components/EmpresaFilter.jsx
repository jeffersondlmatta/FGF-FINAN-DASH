export function EmpresaFilter({
  negocio,
  empresa,
  empresasDoNegocio = [],
  onChangeNegocio,
  onChangeEmpresa,
  onBuscarBloqueio,
  onBuscarDesbloqueio,
  onBuscarNegativacao,
  loading
}) {
  const disabledAcoes = loading || !negocio;

  return (
    <div className="filter-bar">

      <label className="filter-label">
        Negócio:
        <select value={negocio} onChange={(e) => onChangeNegocio(e.target.value)}>
          <option value="">Selecione...</option>
          <option value="Gob">Gob</option>
          <option value="Contabilidade">Contabilidade</option>
          <option value="Revisão">Revisão</option>
          <option value="Jurídico">Jurídico</option>
          <option value="RH">RH</option>
        </select>
      </label>

      <label className="filter-label">
        Empresa:
        <select
          value={empresa}
          onChange={(e) => onChangeEmpresa(e.target.value)}
          disabled={empresasDoNegocio.length === 0}
        >
          <option value="">Todas</option>
          {empresasDoNegocio.map((e) => (
            <option key={e.codemp} value={e.codemp}>
              {e.codemp} - {e.nome_empresa}
            </option>
          ))}
        </select>
      </label>

      <button
        className="btn btn-danger"
        onClick={() => onBuscarBloqueio()}
        disabled={disabledAcoes}
      >
        Passivo de bloqueio
      </button>

      <button
        className="btn btn-warning"
        onClick={() => onBuscarDesbloqueio()}
        disabled={disabledAcoes}
      >
        Desbloquear Clientes
      </button>

      <button
        className="btn btn-dark"
        onClick={() => onBuscarNegativacao()}
        disabled={disabledAcoes}
      >
        Negativar Clientes
      </button>

    </div>
  );
}
