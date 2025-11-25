// src/hooks/useFinanceiroApi.js
import api from "../services/api.js";

export async function fetchTitulos({ empresa, page, pageSize }) {
  const resp = await api.get("/api/home/titulos", {
    params: { empresa, page, pageSize },
  });
  return resp.data?.data ?? [];
}

export async function fetchClientesParaBloqueio({ empresa, page, pageSize }) {
  const resp = await api.get("/api/home/clientes-para-bloqueio", {
    params: { empresa, page, pageSize, atrasoMin: 20 },
  });
  return resp.data?.data ?? [];
}

export async function fetchPagosBloqueados({ empresa, page, pageSize }) {
  const resp = await api.get("/api/desbloqueio/clientes", {
    params: { empresa, page, pageSize },
  });
  return resp.data?.data ?? [];
}

export async function patchBloqueioCliente({ empresa, codparc, bloquear }) {
  return api.patch(`/api/home/clientes/${codparc}/bloqueio`, {
    empresa,
    bloquear,
  });
}
