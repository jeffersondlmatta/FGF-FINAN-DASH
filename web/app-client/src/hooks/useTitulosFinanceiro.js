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

  // ---------------------------------------------------------------------------
  // CARREGAR EMPRESAS QUANDO SELECIONAR NEGÓCIO
  // ---------------------------------------------------------------------------
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

      setEmpresasDoNegocio(resp.data?.data ?? []);
      setEmpresa("");
    } catch {
      setErro("Erro ao carregar empresas do negócio.");
    }
  }, []);

  const onChangeNegocio = async (value) => {
    setNegocio(value);
    await carregarEmpresasDoNegocio(value);
  };

  // ---------------------------------------------------------------------------
  // MODO: PASSIVO DE BLOQUEIO
  // ---------------------------------------------------------------------------
  const buscarParaBloqueio = useCallback(async () => {
    try {
      limparErro();
      if (!negocio) return setErro("Selecione o negócio.");

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
  }, [empresa, negocio]);

  // ---------------------------------------------------------------------------
  // MODO: DESBLOQUEIO
  // ---------------------------------------------------------------------------
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
  }, [empresa]);

  // ---------------------------------------------------------------------------
  // MODO: NEGATIVAÇÃO
  // ---------------------------------------------------------------------------
  const buscarParaNegativar = useCallback(async () => {
    try {
      limparErro();
      if (!negocio) return setErro("Selecione o negócio.");

      setLoading(true);
      setModo("negativacao");
      setPage(0);

      const resp = await api.get("/api/negativacao/clientes", {
        params: { empresa, negocio, page: 0, pageSize },
      });

      const lista = resp.data?.data ?? [];
      setTitulos(lista);
      setHasMore(lista.length === pageSize);

    } catch {
      setErro("Erro ao buscar clientes para negativação.");
    } finally {
      setLoading(false);
    }
  }, [empresa, negocio]);

  // ---------------------------------------------------------------------------
  // MODO: REMOVER RESTRIÇÃO (DESNEGATIVAR)
  // ---------------------------------------------------------------------------
  const buscarParaRemoverRestricao = useCallback(async () => {
    try {
      limparErro();
      if (!negocio) return setErro("Selecione o negócio.");

      setLoading(true);
      setModo("removerRestricao");
      setPage(0);

      const resp = await api.get("/api/negativacao/remover", {
        params: { empresa, negocio, page: 0, pageSize },
      });

      const lista = resp.data?.data ?? [];
      setTitulos(lista);
      setHasMore(lista.length === pageSize);

    } catch (err) {
      console.error(err);
      setErro("Erro ao buscar remoção de restrição.");
    } finally {
      setLoading(false);
    }
  }, [empresa, negocio]);

  // ---------------------------------------------------------------------------
  // PAGINAÇÃO "CARREGAR MAIS"
  // ---------------------------------------------------------------------------
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
      }

      else if (modo === "desbloqueio") {
        resp = await api.get("/api/desbloqueio/clientes", {
          params: { empresa, page: next, pageSize },
        });
      }

      else if (modo === "negativacao") {
        resp = await api.get("/api/negativacao/clientes", {
          params: { empresa, negocio, page: next, pageSize },
        });
      }

      else if (modo === "removerRestricao") {
        resp = await api.get("/api/negativacao/remover", {
          params: { empresa, negocio, page: next, pageSize },
        });
      }

      const lista = resp?.data?.data ?? [];
      if (!lista.length) return setHasMore(false);

      setTitulos((prev) => [...prev, ...lista]);
      setPage(next);
      setHasMore(lista.length === pageSize);

    } catch {
      setErro("Erro ao carregar mais registros.");
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, modo, empresa, negocio, page]);

  // ---------------------------------------------------------------------------
  // LOTE: BLOQUEIO / DESBLOQUEIO
  // ---------------------------------------------------------------------------
  async function aplicarLote(selectedIds) {
    if (!selectedIds.length) return setErro("Nenhum cliente selecionado.");

    try {
      setUpdating(true);

      const itens = titulos.filter(t => selectedIds.includes(t.codparc));
      const novaSituacao = modo === "bloqueio" ? "BLOQUEADO" : "ATIVO";

      await api.post("/api/bloqueio/lote", {
        empresa,
        clientes: itens.map(t => ({
          codparc: t.codparc,
          codemp: t.codemp,
          novaSituacao,
        })),
      });

      setTitulos(prev =>
        prev.map(t =>
          selectedIds.includes(t.codparc)
            ? { ...t, situacao: novaSituacao }
            : t
        )
      );

    } catch {
      setErro("Erro ao aplicar operação em lote.");
    } finally {
      setUpdating(false);
    }
  }

  // ---------------------------------------------------------------------------
  // LOTE: NEGATIVAÇÃO
  // ---------------------------------------------------------------------------
  async function aplicarNegativacaoLote(selectedIds) {
    if (!selectedIds.length) return setErro("Nenhum cliente selecionado.");

    try {
      setUpdating(true);

      const itens = titulos.filter(t => selectedIds.includes(t.codparc));

      await api.post("/api/negativacao/lote", {
        clientes: itens.map(t => ({
          codparc: t.codparc,
          codemp: t.codemp,
        })),
      });

      setTitulos(prev =>
        prev.map(t =>
          selectedIds.includes(t.codparc)
            ? { ...t, negativado: "S" }
            : t
        )
      );

    } catch (err) {
      console.error(err);
      setErro("Erro ao negativar clientes.");
    } finally {
      setUpdating(false);
    }
  }

  // ---------------------------------------------------------------------------
  // LOTE: REMOVER RESTRIÇÃO
  // ---------------------------------------------------------------------------
  async function aplicarRemoverRestricaoLote(selectedIds) {
    if (!selectedIds.length) return setErro("Nenhum cliente selecionado.");

    try {
      setUpdating(true);

      const itens = titulos.filter(t => selectedIds.includes(t.codparc));

      await api.post("/api/negativacao/remover/lote", {
        clientes: itens.map(t => ({
          codparc: t.codparc,
          codemp: t.codemp,
        })),
      });

      setTitulos(prev =>
        prev.map(t =>
          selectedIds.includes(t.codparc)
            ? { ...t, negativado: "N" }
            : t
        )
      );

    } catch (err) {
      console.error(err);
      setErro("Erro ao remover restrição.");
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
    buscarParaNegativar,
    buscarParaRemoverRestricao,

    carregarMais,
    aplicarLote,
    aplicarNegativacaoLote,
    aplicarRemoverRestricaoLote,
  };
}
