// src/components/TitulosTable.jsx
import { formatarDataIsoParaBR } from "../utils/formatarDataIsoParaBR.js";

export function TitulosTable({ titulos, updating, onToggleBloqueio }) {
  if (!titulos || titulos.length === 0) return null;

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Parceiro</th>
            <th>Natureza</th>
            <th>Número financeiro</th>
            <th>Status</th>
            <th>Vencimento</th>
            <th>Dias atraso</th>
            <th>Situação</th>
            <th>Ação</th>
             
          </tr>
        </thead>
        <tbody>
          {titulos.map((t, i) => {
            const chave = `${t.codemp}-${t.codparc}`;
            const bloqueado = t.situacao === "BLOQUEADO";

            return (
              <tr
                key={t.nufin ?? `${chave}-${i}`}
                className={
                  bloqueado
                    ? "row-bloqueado"
                    : i % 2 === 0
                    ? "row-normal"
                    : "row-normal row-alt"
                }
              >
                <td>{t.nome_empresa ?? t.codemp}</td>
                <td>{t.nome_parceiro ?? t.codparc}</td>
                <td>{t.descr_natureza}</td>
                <td>{t.nufin}</td>
                <td>{t.status}</td>
                <td>{formatarDataIsoParaBR(t.dt_vencimento)}</td>
                <td>{t.dias_atraso}</td>
                <td>
                  <span
                    className={
                      bloqueado
                        ? "tag-situacao tag-situacao-bloqueado"
                        : "tag-situacao tag-situacao-ativo"
                    }
                  >
                    {bloqueado ? "Bloqueado" : "Ativo"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onToggleBloqueio(t)}
                    disabled={updating === chave}
                    className="btn btn-outline"
                  >
                    {bloqueado ? "Desbloquear" : "Bloquear"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
