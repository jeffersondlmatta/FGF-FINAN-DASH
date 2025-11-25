
export function exportClientesParaExcel(titulos) {
  if (!Array.isArray(titulos) || titulos.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // Cabeçalhos do arquivo
  const headers = [
    "Nome Empresa",
    "Código Empresa",
    "Nome Parceiro",
    "Código Parceiro",
    "Situação",
    "Status",
    "Dias Atraso",
    "NUFIN",
    "Valor Desdobra",
    "Data Vencimento (ISO)",
  ];

  // Linhas
  const rows = titulos.map((t) => [
    t.nome_empresa ?? t.codemp ?? "",
    t.codemp ?? "",
    t.nome_parceiro ?? t.codparc ?? "",
    t.codparc ?? "",
    t.situacao ?? "",
    t.status ?? "",
    t.dias_atraso ?? "",
    t.nufin ?? "",
    t.valor_desdobra ?? "",
    t.dt_vencimento ?? "",
  ]);

  // Monta CSV com ; para ficar amigável ao Excel BR
  const csvLines = [
    headers.join(";"),
    ...rows.map((row) =>
      row
        .map((field) => {
          if (field == null) return "";
          const s = String(field).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(";")
    ),
  ];

  const csvContent = csvLines.join("\r\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");

  link.href = url;
  link.download = `clientes_para_bloqueio_${stamp}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
