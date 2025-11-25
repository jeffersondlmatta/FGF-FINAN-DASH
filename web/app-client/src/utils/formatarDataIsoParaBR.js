// src/utils/formatarDataIsoParaBR.js
export function formatarDataIsoParaBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const ano = d.getUTCFullYear();

  return `${dia}-${mes}-${ano}`;
}
