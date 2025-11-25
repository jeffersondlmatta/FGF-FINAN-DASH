// src/components/PaginationBar.jsx

export function PaginationBar({
  page,
  pageSize,
  currentCount,
  loading,
  onPrev,
  onNext,
  onExport, // <-- novo
  showExport, // <-- novo
}) {
  if (currentCount === 0) return null;

  return (
    <div className="pagination-bar" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <button
        onClick={onPrev}
        disabled={page === 0 || loading}
        className="btn btn-secondary"
      >
        Página anterior
      </button>

      <button
        onClick={onNext}
        disabled={loading || currentCount < pageSize}
        className="btn btn-secondary"
      >
        Próxima página
      </button>

      {showExport && (
        <button
          onClick={onExport}
          disabled={loading}
          className="btn btn-outline"
        >
          Exportar Excel
        </button>
      )}

      <span className="pagination-info" style={{ marginLeft: "10px" }}>
        Página {page + 1} ({currentCount} registros nesta página)
      </span>
    </div>
  );
}
