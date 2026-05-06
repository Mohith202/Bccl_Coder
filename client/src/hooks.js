import { useSearchParams } from "react-router-dom";

export function useSelection() {
  const [params, setParams] = useSearchParams();
  const exp = params.get("exp") || "llama_finetune";
  const metric = params.get("metric") || "mean_corr";
  const set = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  return { exp, metric, set, params };
}
