// src/hooks/useTitulosFinanceiro.js
import { useState, useCallback } from "react";
import api from "../services/api.js";

export function useTitulosFinanceiro() {
  const [empresa, setEmpresa] = useState("");
  const [titulos, setTitulos] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 100;
  const [modo, setModo] = useState("titulos"); // "titulos" | "bloqueio" | "desbloqueio"
  const [hasMore, setHasMore] = useState(false); // se ainda há mais páginas para carregar

  const limparErro = () => setErro(null);

  const validarEmpresa = () => {
    if (!empresa) {
      setErro("Informe o código da empresa (CODEMP).");
      setTitulos([]);
      return false;
    }
    return true;
  };

  // 🔹 Carregar títulos EM ABERTO da empresa (primeira página)
  const carregarTitulos = useCallback(
    async (pageNumber = 0) => {
      try {
        limparErro();
        if (!validarEmpresa()) return;

        setLoading(true);
        setModo("titulos");

        const resp = await api.get("/api/home/titulos", {
          params: {
            page: pageNumber,
            pageSize,
            empresa,
          },
        });

        const lista = Array.isArray(resp.data?.data) ? resp.data.data : [];

        setTitulos(lista);
        setPage(pageNumber);
        setHasMore(lista.length === pageSize); // se veio página cheia, provavelmente tem mais
      } catch (e) {
        console.error(e);
        setErro(e.message || "Erro ao carregar títulos.");
        setTitulos([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [empresa, pageSize]
  );

  // 🔹 Buscar clientes para bloqueio (primeira página)
  const buscarParaBloqueio = useCallback(
    async (pageArg = 0) => {
      try {
        limparErro();
        if (!validarEmpresa()) return;

        setLoading(true);
        setModo("bloqueio");

        const resp = await api.get("/api/home/clientes-para-bloqueio", {
          params: {
            empresa,
            page: pageArg,
            pageSize,
            atrasoMin: 20, // dias de atraso mínimos
          },
        });

        if (!resp.data?.ok) {
          setErro(resp.data?.message || "Erro ao buscar clientes para bloqueio.");
          setTitulos([]);
          setHasMore(false);
          return;
        }

        const lista = Array.isArray(resp.data?.data) ? resp.data.data : [];

        setTitulos(lista);
        setPage(pageArg);
        setHasMore(lista.length === pageSize);
      } catch (e) {
        console.error(e);
        setErro(e.message || "Erro ao buscar clientes para bloqueio.");
        setTitulos([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [empresa, pageSize]
  );

  // 🔹 Buscar clientes PAGOS & BLOQUEADOS (primeira página)
  const buscarPagosBloqueados = useCallback(
    async (pageArg = 0) => {
      try {
        limparErro();
        if (!validarEmpresa()) return;

        setLoading(true);
        setModo("desbloqueio");

        const resp = await api.get("/api/desbloqueio/clientes", {
          params: {
            empresa,
            page: pageArg,
            pageSize,
          },
        });

        if (!resp.data?.ok) {
          setErro(
            resp.data?.message || "Erro ao buscar clientes pagos & bloqueados."
          );
          setTitulos([]);
          setHasMore(false);
          return;
        }

        const lista = Array.isArray(resp.data?.data) ? resp.data.data : [];

        setTitulos(lista);
        setPage(pageArg);
        setHasMore(lista.length === pageSize);
      } catch (e) {
        console.error(e);
        setErro(e.message || "Erro ao buscar clientes pagos & bloqueados.");
        setTitulos([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [empresa, pageSize]
  );

  // 🔹 Scroll infinito: carregar próxima página e APENDAR na lista
  const carregarMais = useCallback(async () => {
    if (loading) return;
    if (!hasMore) return;
    if (!titulos.length) return;
    if (!validarEmpresa()) return;

    const nextPage = page + 1;

    try {
      setLoading(true);

      let lista = [];

      if (modo === "titulos") {
        const resp = await api.get("/api/home/titulos", {
          params: {
            page: nextPage,
            pageSize,
            empresa,
          },
        });

        lista = Array.isArray(resp.data?.data) ? resp.data.data : [];
      } else if (modo === "bloqueio") {
        const resp = await api.get("/api/home/clientes-para-bloqueio", {
          params: {
            empresa,
            page: nextPage,
            pageSize,
            atrasoMin: 20,
          },
        });

        if (!resp.data?.ok) {
          setErro(resp.data?.message || "Erro ao buscar clientes para bloqueio.");
          setHasMore(false);
          return;
        }

        lista = Array.isArray(resp.data?.data) ? resp.data.data : [];
      } else if (modo === "desbloqueio") {
        const resp = await api.get("/api/desbloqueio/clientes", {
          params: {
            empresa,
            page: nextPage,
            pageSize,
          },
        });

        if (!resp.data?.ok) {
          setErro(
            resp.data?.message || "Erro ao buscar clientes pagos & bloqueados."
          );
          setHasMore(false);
          return;
        }

        lista = Array.isArray(resp.data?.data) ? resp.data.data : [];
      }

      if (!lista.length) {
        setHasMore(false);
        return;
      }

      setTitulos((prev) => [...prev, ...lista]);
      setPage(nextPage);
      setHasMore(lista.length === pageSize);
    } catch (e) {
      console.error(e);
      setErro(e.message || "Erro ao carregar mais registros.");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [empresa, page, pageSize, modo, hasMore, titulos.length, loading]);

  // 🔹 Bloquear / desbloquear cliente
  const toggleBloqueio = async (titulo) => {
    try {
      limparErro();

      const codemp = titulo.codemp;
      const codparc = titulo.codparc;

      if (!codemp || !codparc) {
        setErro("Registro sem codemp/codparc. Verifique o ETL.");
        return;
      }

      const chave = `${codemp}-${codparc}`;
      setUpdating(chave);

      const bloquear = titulo.situacao !== "BLOQUEADO";

      await api.patch(`/api/home/clientes/${codparc}/bloqueio`, {
        empresa,
        bloquear,
      });

      // Recarrega a lista inteira a partir da primeira página do modo atual
      if (modo === "titulos") {
        await carregarTitulos(0);
      } else if (modo === "bloqueio") {
        await buscarParaBloqueio(0);
      } else if (modo === "desbloqueio") {
        await buscarPagosBloqueados(0);
      }
    } catch (e) {
      console.error(e);
      setErro(e.message || "Erro ao atualizar bloqueio.");
    } finally {
      setUpdating(null);
    }
  };

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
    toggleBloqueio,
  };
}
