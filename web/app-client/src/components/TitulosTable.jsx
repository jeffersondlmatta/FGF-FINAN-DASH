export function TitulosTable({
  titulos,
  updating,
  modo,
  selectedCodparcs = [],
  onToggleSelect,
  onToggleSelectAll,
}) {
  if (!titulos || titulos.length === 0) return null;

  const mostraSelecao =
    modo === "bloqueio" ||
    modo === "desbloqueio" ||
    modo === "negativacao";

  const codparcsUnicos = Array.from(
    new Set(titulos.filter((t) => t.codparc).map((t) => t.codparc))
  );

  const allSelected =
    codparcsUnicos.length > 0 &&
    codparcsUnicos.every((c) => selectedCodparcs.includes(c));

  const handleSelectAllClick = () => {
    if (!mostraSelecao || !onToggleSelectAll) return;
    onToggleSelectAll(allSelected);
  };

  return (
    <div className="table-wrapper">
      {updating && (
        <p className="msg" style={{ marginBottom: "0.4rem" }}>
          Atualizando situação dos clientes...
        </p>
      )}

      <table className="data-table">
        <thead>
          <tr>
            {mostraSelecao && (
              <th className="col-select">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAllClick}
                />
              </th>
            )}
            <th>Empresa</th>
            <th>Parceiro</th>
            <th>Natureza</th>
            <th>Número financeiro</th>
            <th>Status</th>
            <th>Vencimento</th>
            <th>Dias atraso</th>
            <th>Histórico</th>
            <th>Situação</th>
          </tr>
        </thead>

        <tbody>
          {titulos.map((t, index) => {
            const canSelect = mostraSelecao && !!t.codparc;
            const isSelected = canSelect && selectedCodparcs.includes(t.codparc);

            const rowClass =
              t.situacao?.toLowerCase() === "bloqueado"
                ? "row-bloqueado"
                : index % 2 === 0
                ? "row-normal"
                : "row-alt";

            return (
              <tr key={t.nufin || `${t.codemp}-${t.codparc}-${index}`} className={rowClass}>
                {mostraSelecao && (
                  <td className="cell-select">
                    <input
                      type="checkbox"
                      disabled={!canSelect}
                      checked={isSelected}
                      onChange={() =>
                        canSelect && onToggleSelect && onToggleSelect(t.codparc)
                      }
                    />
                  </td>
                )}

                <td>{t.nome_empresa}</td>
                <td>{t.nome_parceiro}</td>
                <td>{t.descr_natureza}</td>
                <td>{t.nufin}</td>
                <td>{t.status}</td>
                <td>{t.dt_vencimento}</td>
                <td>{t.atraso}</td>
                <td>{t.historico}</td>
                <td>{t.situacao}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
