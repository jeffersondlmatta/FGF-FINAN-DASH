// src/components/TitulosTable.jsx

// formata "2025-11-05T03:00:00.000Z" -> "05/11/2025"
function formatarData(valor) {
  if (!valor) return "";
  if (typeof valor === "string") {
    // se já estiver no formato dd/mm/aaaa, só retorna
    if (valor.includes("/") && !valor.includes("T")) return valor;
  }

  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function temFuro(datas) {
  if (!datas || datas.length < 2) return false;

  const meses = datas.map(d => Number(d.split("-")[1]));

  for (let i = 1; i < meses.length; i++) {
    if (meses[i] - meses[i - 1] > 1) return true;
  }
  return false;
}

export function TitulosTable({
  titulos,
  updating,
  modo, // "titulos" | "bloqueio" | "desbloqueio" | "negativacao" | "removerRestricao"
  selectedCodparcs = [],
  onToggleSelect,
  onToggleSelectAll,
}) {
  if (!titulos || titulos.length === 0) return null;

  // AGORA COBRE TODOS OS MODOS QUE USAM CHECKBOX
  const mostraSelecao =
    modo === "bloqueio" ||
    modo === "desbloqueio" ||
    modo === "negativacao" ||
    modo === "removerRestricao";

  // lista de clientes (codparc) que podem ser selecionados
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
            <th>Valor</th>
            <th>Dias atraso</th>
            <th>Histórico</th>
            <th>Situação</th>
          </tr>
        </thead>

        <tbody>
          {titulos.map((t, index) => {
            const canSelect = mostraSelecao && !!t.codparc;
            const isSelected =
              canSelect && selectedCodparcs.includes(t.codparc);

            const rowClass =
              t.situacao?.toLowerCase() === "bloqueado"
                ? "row-bloqueado"
                : index % 2 === 0
                ? "row-normal"
                : "row-alt";

            return (
              <tr
                key={t.nufin || `${t.codemp}-${t.codparc}-${index}`}
                className={rowClass}
              >
                {mostraSelecao && (
                  <td className="cell-select">
                    <input
                      type="checkbox"
                      disabled={!canSelect}
                      checked={isSelected}
                      onChange={() =>
                        canSelect &&
                        onToggleSelect &&
                        onToggleSelect(t.codparc)
                      }
                    />
                  </td>
                )}

                <td>{t.nome_empresa}</td>
                <td>{t.nome_parceiro}</td>
                <td>{t.descr_natureza}</td>
                <td>{t.nufin}</td>
                <td>{t.status}</td>
                <td>{formatarData(t.dt_vencimento)}</td>
                <td>{t.valor_desdobra}</td>
                <td>{t.atraso}</td>
                <td>{t.historico}</td>

                <td>
                  <span
                    className={
                      "tag-situacao " +
                      (t.situacao?.toLowerCase() === "bloqueado"
                        ? "tag-situacao-bloqueado"
                        : "tag-situacao-ativo")
                    }
                  >
                    {t.situacao}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
