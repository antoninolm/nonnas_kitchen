import { useEffect, useState } from "react";
import { apiUrl } from "../utils/api";

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(apiUrl(url), { signal: controller.signal })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [url, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  return { data, loading, error, refetch };
}
