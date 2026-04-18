import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChartEmbedData } from "@/types/chart";
import { useIframeStore } from "@/lib/iframe-store";
import { useBuilderStore } from "@/lib/builder-store";

interface PromoteResponse {
  id: string;
  type: "json" | "iframe";
  data: ChartEmbedData | string;
}

export function usePromoteChart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setView, setVisible } = useIframeStore();
  const { setViewMode } = useBuilderStore();

  const promote = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`Failed to promote chart (${res.status})`);
      }

      const result = (await res.json()) as PromoteResponse;

      setView({
        type: result.type,
        payload: result.data,
      });
      setVisible(true);
      setViewMode("dashboard");
      router.push("/builder");

      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to promote chart");
      return false;
    }
  }, [router, setView, setVisible, setViewMode]);

  return {
    promote,
    loading,
    error,
  };
}