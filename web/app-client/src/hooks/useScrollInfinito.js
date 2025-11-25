// src/hooks/useScrollInfinito.js
import { useEffect, useState } from "react";

export function useScrollInfinito({ loading, hasMore, onLoadMore }) {
  const [showToTop, setShowToTop] = useState(false);

  useEffect(() => {
    const handler = () => {
      const top = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      setShowToTop(top > 300);

      if (loading || !hasMore) return;
      if (top + windowHeight >= fullHeight - 200) {
        onLoadMore();
      }
    };

    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, [loading, hasMore, onLoadMore]);

  return { showToTop };
}
