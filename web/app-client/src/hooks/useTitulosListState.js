// src/hooks/useTitulosListState.js
export function useTitulosListState() {
  const [empresa, setEmpresa] = useState("");
  const [titulos, setTitulos] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 100;
  const [modo, setModo] = useState("titulos");
  const [hasMore, setHasMore] = useState(false);

  return {
    empresa,
    setEmpresa,
    titulos,
    setTitulos,
    erro,
    setErro,
    loading,
    setLoading,
    updating,
    setUpdating,
    page,
    setPage,
    pageSize,
    modo,
    setModo,
    hasMore,
    setHasMore,
  };
}
