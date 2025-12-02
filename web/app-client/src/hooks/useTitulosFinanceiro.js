import { useState, useCallback } from "react";
import api from "../services/api.js";

export function useTitulosFinanceiro() {
  const [empresa, setEmpresa] = useState("");
  const [titulos, setTitulos] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 100;
  const [modo, setModo] = useState("titulos");
  const [hasMore, setHasMore] = useState(false);

  const limparErro = () => setErro(null);

  const validarEmpresa = () => {
    if (!empresa) {
      setErro("Informe o código da empresa (CODEMP).");
      setTitulos([]);
      return false;
    }
    return true;
  };

  // 🔹 Buscar títulos em aberto
  const carregarTitulos = useCallback(async (pageNumber = 0) => {
    try {
      limparErro();
      if (!validarEmpresa()) return;

      setLoading(true);
      setModo("titulos");

      const resp = await api.get("/api/home/titulos", {
        params: { empresa, page: pageNumber, pageSize }
      });

      const lista = Array.isArray(resp.data?.data) ? resp.data.data : [];

      setTitulos(lista);
      setPage(pageNumber);
      setHasMore(lista.length === pageSize);
    } catch (e) {
      setErro(e.message || "Erro ao buscar títulos.");
      setTitulos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [empresa, pageSize]);

  // 🔹 Passivo de bloqueio (liberados com atraso)
  const buscarParaBloqueio = useCallback(async (pageNumber = 0) => {
    try {
      limparErro();
      if (!validarEmpresa()) return;

      setLoading(true);
      setModo("bloqueio");

      const resp = await api.get("/api/home/clientes-para-bloqueio", {
        params: { empresa, page: pageNumber, pageSize, atrasoMin: 20 }
      });

      if (!resp.data?.ok) {
        setErro(resp.data?.message || "Erro ao buscar passivo.");
        setTitulos([]);
        setHasMore(false);
        return;
      }

      const lista = resp.data.data;
      setTitulos(lista);
      setPage(pageNumber);
      setHasMore(lista.length === pageSize);
    } catch (e) {
      setErro(e.message || "Erro ao buscar passivo de bloqueio.");
      setTitulos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [empresa, pageSize]);

  // 🔹 Clientes para desbloqueio (AGORA AGRUPADOS no backend)
  const buscarPagosBloqueados = useCallback(async (pageNumber = 0) => {
    try {
      limparErro();
      if (!validarEmpresa()) return;

      setLoading(true);
      setModo("desbloqueio");

      const resp = await api.get("/api/desbloqueio/clientes", {
        params: { empresa, page: pageNumber, pageSize }
      });

      if (!resp.data?.ok) {
        setErro(resp.data?.message || "Erro ao buscar desbloqueio.");
        setTitulos([]);
        setHasMore(false);
        return;
      }

      const lista = resp.data.data;

      // Agora NÃO precisa filtrar nada aqui!
      setTitulos(lista);
      setPage(pageNumber);
      setHasMore(lista.length === pageSize);
    } catch (e) {
      setErro(e.message || "Erro ao buscar desbloqueio.");
      setTitulos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [empresa, pageSize]);

  // 🔹 Scroll infinito
  const carregarMais = useCallback(async () => {
    if (loading || !hasMore) return;
    if (!validarEmpresa()) return;

    const next = page + 1;

    try {
      setLoading(true);

      let resp;

      if (modo === "titulos") {
        resp = await api.get("/api/home/titulos", {
          params: { empresa, page: next, pageSize }
        });
      } else if (modo === "bloqueio") {
        resp = await api.get("/api/home/clientes-para-bloqueio", {
          params: { empresa, page: next, pageSize, atrasoMin: 20 }
        });
      } else if (modo === "desbloqueio") {
        resp = await api.get("/api/desbloqueio/clientes", {
          params: { empresa, page: next, pageSize }
        });
      }

      const lista = resp?.data?.data ?? [];

      if (!lista.length) {
        setHasMore(false);
        return;
      }

      setTitulos(prev => [...prev, ...lista]);
      setPage(next);
      setHasMore(lista.length === pageSize);
    } catch (e) {
      setErro(e.message || "Erro ao carregar mais.");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [empresa, modo, page, pageSize, loading, hasMore]);

  // 🔹 Bloqueio / desbloqueio (só muda situacao)
  async function toggleBloqueio(t) {
    if (!t?.codemp || !t?.codparc) return;

    const situacaoAtual = (t.situacao || "").toUpperCase();
    const novaSituacao = situacaoAtual === "BLOQUEADO" ? "LIBERADO" : "BLOQUEADO";

    try {
      setUpdating(true);
      setErro("");

      await api.post("/api/bloqueio", {
        codemp: t.codemp,
        codparc: t.codparc,
        novaSituacao
      });

      // Atualiza só localmente
      setTitulos(lista =>
        lista.map(item =>
          item.codparc === t.codparc ? { ...item, situacao: novaSituacao } : item
        )
      );

      // Se desbloqueou, remove da lista de desbloqueio
      if (modo === "desbloqueio" && novaSituacao === "LIBERADO") {
        setTitulos(lista => lista.filter(item => item.codparc !== t.codparc));
      }

    } catch (e) {
      setErro("Falha ao aplicar bloqueio/desbloqueio.");
    } finally {
      setUpdating(false);
    }
  }

  return {
    empresa,
    setEmpresa,
    titulos,
    erro,
    loading,
    updating,
    page,
    pageSize,
    modo,
    hasMore,
    carregarTitulos,
    buscarParaBloqueio,
    buscarPagosBloqueados,
    carregarMais,
    toggleBloqueio
  };
}
  