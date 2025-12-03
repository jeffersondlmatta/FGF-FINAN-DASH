import { useState, useCallback } from "react";
import api from "../services/api.js";

export function useTitulosFinanceiro() {
  const [negocio, setNegocio] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [empresasDoNegocio, setEmpresasDoNegocio] = useState([]);

  const [titulos, setTitulos] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [page, setPage] = useState(0);
  const pageSize = 100;
  const [modo, setModo] = useState("idle");
  const [hasMore, setHasMore] = useState(false);

  const limparErro = () => setErro(null);

  const carregarEmpresasDoNegocio = useCallback(async (_negocio) => {
    try {
      if (!_negocio) {
        setEmpresasDoNegocio([]);
        setEmpresa("");
        return;
      }
      const resp = await api.get("/api/home/empresas-por-negocio", {
        params: { negocio: _negocio },
      });
      const lista = resp.data?.data ?? [];
      setEmpresasDoNegocio(lista);
      setEmpresa("");
    } catch {
      setErro("Erro ao carregar empresas do negócio.");
    }
  }, []);

  const onChangeNegocio = async (value) => {
    setNegocio(value);
    await carregarEmpresasDoNegocio(value);
  };

  const buscarParaBloqueio = useCallback(async () => {
    try {
      limparErro();
      if (!negocio) {
        setErro("Selecione o negócio.");
        return;
      }
      setLoading(true);
      setModo("bloqueio");
      setPage(0);

      const resp = await api.get("/api/home/clientes-para-bloqueio", {
        params: { empresa, negocio, atrasoMin: 20, page: 0, pageSize },
      });

      const lista = resp.data?.data ?? [];
      setTitulos(lista);
      setHasMore(lista.length === pageSize);
    } catch {
      setErro("Erro ao buscar passivo de bloqueio.");
    } finally {
      setLoading(false);
    }
  }, [empresa, negocio, pageSize]);

  const buscarPagosBloqueados = useCallback(async () => {
    try {
      limparErro();
      setLoading(true);
      setModo("desbloqueio");
      setPage(0);

      const resp = await api.get("/api/desbloqueio/clientes", {
        params: { empresa, page: 0, pageSize },
      });

      const lista = resp.data?.data ?? [];
      setTitulos(lista);
      setHasMore(lista.length === pageSize);
    } catch {
      setErro("Erro ao buscar desbloqueio.");
    } finally {
      setLoading(false);
    }
  }, [empresa, pageSize]);

  const carregarMais = useCallback(async () => {
    if (!hasMore || loading) return;

    const next = page + 1;
    try {
      setLoading(true);

      let resp;
      if (modo === "bloqueio") {
        resp = await api.get("/api/home/clientes-para-bloqueio", {
          params: { empresa, negocio, page: next, pageSize, atrasoMin: 20 },
        });
      } else if (modo === "desbloqueio") {
        resp = await api.get("/api/desbloqueio/clientes", {
          params: { empresa, page: next, pageSize },
        });
      }

      const lista = resp?.data?.data ?? [];
      if (!lista.length) {
        setHasMore(false);
        return;
      }

      setTitulos((prev) => [...prev, ...lista]);
      setPage(next);
      setHasMore(lista.length === pageSize);
    } catch {
      setErro("Erro ao carregar mais registros.");
    } finally {
      setLoading(false);
    }
  }, [empresa, negocio, modo, page, pageSize, loading, hasMore]);

  async function aplicarLote(selectedIds) {
    try {
      if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
        return setErro("Nenhum cliente selecionado.");
      }

      setUpdating(true);

      const itens = titulos.filter(t => selectedIds.includes(t.codparc));

      const novaSituacao =
        modo === "bloqueio"
          ? "BLOQUEADO"
          : "ATIVO";

      const clientes = itens.map(t => ({
        codparc: t.codparc,
        codemp: t.codemp,
        novaSituacao
      }));

      await api.post("/api/bloqueio/lote", {
        empresa,
        clientes
      });

      setTitulos(prev =>
        prev.map(t =>
          selectedIds.includes(t.codparc)
            ? { ...t, situacao: novaSituacao }
            : t
        )
      );

    } catch (e) {
      console.error(e);
      setErro("Erro ao aplicar operação em lote.");
    } finally {
      setUpdating(false);
    }
  }

  return {
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
  };
}
