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

  // 🔹 Carregar empresas do negócio selecionado
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

    } catch (e) {
      setErro("Erro ao carregar empresas do negócio.");
    }
  }, []);

  // 🔹 Quando trocar o NEGÓCIO
  const onChangeNegocio = async (value) => {
    setNegocio(value);
    await carregarEmpresasDoNegocio(value);
  };

  // ---------------------------------------------------------------------
  // 🔹 PASSIVO DE BLOQUEIO
  // ---------------------------------------------------------------------
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
        params: {
          empresa,
          negocio,
          atrasoMin: 20,
          page: 0,
          pageSize,
        },
      });

      const lista = resp.data?.data ?? [];
      setTitulos(lista);
      setHasMore(lista.length === pageSize);

    } catch (e) {
      setErro("Erro ao buscar passivo de bloqueio.");
    } finally {
      setLoading(false);
    }
  }, [empresa, negocio, pageSize]);

  // ---------------------------------------------------------------------
  // 🔹 DESBLOQUEIO
  // ---------------------------------------------------------------------
  const buscarPagosBloqueados = useCallback(async () => {
    try {
      limparErro();
      if (!empresa) {
        setErro("Selecione empresa.");
        return;
      }

      setLoading(true);
      setModo("desbloqueio");
      setPage(0);

      const resp = await api.get("/api/desbloqueio/clientes", {
        params: { empresa, page: 0, pageSize },
      });

      const lista = resp.data?.data ?? [];
      setTitulos(lista);
      setHasMore(lista.length === pageSize);

    } catch (e) {
      setErro("Erro ao buscar desbloqueio.");
    } finally {
      setLoading(false);
    }
  }, [empresa, pageSize]);

  // ---------------------------------------------------------------------
  // 🔹 SCROLL INFINITO
  // ---------------------------------------------------------------------
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
      } else {
        return;
      }

      const lista = resp?.data?.data ?? [];
      if (!lista.length) {
        setHasMore(false);
        return;
      }

      setTitulos((antigos) => [...antigos, ...lista]);
      setPage(next);
      setHasMore(lista.length === pageSize);

    } catch (e) {
      setErro("Erro ao carregar mais registros.");
    } finally {
      setLoading(false);
    }
  }, [empresa, negocio, modo, page, pageSize, loading, hasMore]);

  // ---------------------------------------------------------------------
  // 🔹 BLOQUEIO / DESBLOQUEIO
  // ---------------------------------------------------------------------
  async function toggleBloqueio(t) {
    if (!t?.codemp || !t?.codparc) return;

    const situAtual = (t.situacao || "").toUpperCase();
    const novaSituacao = situAtual === "BLOQUEADO" ? "LIBERADO" : "BLOQUEADO";

    try {
      setUpdating(true);

      await api.post("/api/bloqueio", {
        codemp: t.codemp,
        codparc: t.codparc,
        novaSituacao,
      });

      setTitulos((prev) =>
        prev.map((item) =>
          item.codparc === t.codparc ? { ...item, situacao: novaSituacao } : item
        )
      );

    } catch (e) {
      setErro("Erro ao aplicar bloqueio/desbloqueio.");
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
    toggleBloqueio,
  };
}
