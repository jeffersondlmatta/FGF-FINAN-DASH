// src/hooks/useBloqueioActions.js
import { patchBloqueioCliente } from "./useFinanceiroApi.js";

export function useBloqueioActions({
  empresa,
  modo,
  setUpdating,
  setErro,
  carregarTitulos,
  buscarParaBloqueio,
  buscarPagosBloqueados,
}) {
  const toggleBloqueio = async (t) => {
    try {
      if (!empresa || !t.codparc) {
        setErro("Registro inválido (empresa/codparc).");
        return;
      }

      const bloquear = t.situacao !== "BLOQUEADO";
      const chave = `${t.codemp}-${t.codparc}`;

      setUpdating(chave);

      await patchBloqueioCliente({
        empresa,
        codparc: t.codparc,
        bloquear,
      });

      if (modo === "titulos") await carregarTitulos(0);
      else if (modo === "bloqueio") await buscarParaBloqueio(0);
      else if (modo === "desbloqueio") await buscarPagosBloqueados(0);
    } catch (e) {
      setErro(e.message);
    } finally {
      setUpdating(null);
    }
  };

  return { toggleBloqueio };
}
