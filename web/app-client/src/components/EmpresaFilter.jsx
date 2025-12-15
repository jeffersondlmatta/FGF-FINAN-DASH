export function EmpresaFilter({
  negocio,
  empresa,
  empresasDoNegocio = [],
  onChangeNegocio,
  onChangeEmpresa,
  onBuscarBloqueio,
  onBuscarDesbloqueio,
  onBuscarNegativacao,
  onBuscarRemoverRestricao,  // NOVO
  loading
}) {
  const disabledAcoes = loading || !negocio;

  return (
    <div className="filter-bar">

      {/* SELEÇÃO DE NEGÓCIO */}
      <label className="filter-label">
        Negócio:
        <select
          value={negocio}
          onChange={(e) => onChangeNegocio(e.target.value)}
        >
          <option value="">Selecione...</option>
          <option value="Gob">Gob</option>
          <option value="Contabilidade">Contabilidade</option>
          <option value="Revisão">Revisão</option>
          <option value="Jurídico">Jurídico</option>
          <option value="RH">RH</option>
        </select>
      </label>

      {/* SELEÇÃO DE EMPRESA */}
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

      {/* PASSIVO DE BLOQUEIO */}
      <button
        className="btn btn-danger"
        disabled={disabledAcoes}
        onClick={() => onBuscarBloqueio()}
      >
        Passivo de bloqueio
      </button>

      {/* DESBLOQUEIO */}
      <button
        className="btn btn-warning"
        disabled={disabledAcoes}
        onClick={() => onBuscarDesbloqueio()}
      >
        Desbloquear Clientes
      </button>

      {/* NEGATIVAÇÃO */}
      <button
        className="btn btn-dark"
        disabled={disabledAcoes}
        onClick={() => onBuscarNegativacao()}
      >
        Negativar Clientes
      </button>

      {/* REMOVER RESTRIÇÃO */}
      <button
        className="btn btn-success"
        disabled={disabledAcoes}
        onClick={() => onBuscarRemoverRestricao()}
      >
        Remover Restrição
      </button>

    </div>
  );
}
