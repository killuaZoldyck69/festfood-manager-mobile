import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PaginatedMeta, PaginatedResponse } from "../types";
import { apiClient } from "../utils/apiClient";

export function useApiFetch<T>(
  endpoint: string,
  params: Record<string, string>,
): {
  data: T[];
  meta: PaginatedMeta;
  isLoading: boolean;
  error: string | null;
  fetch: (page: number) => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const paramsRef = useRef(params);
  const paramsString = JSON.stringify(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [paramsString]);

  const executeFetch = useCallback(
    async (page: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(page));

        Object.entries(paramsRef.current).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });

        const response = await apiClient(
          `${endpoint}?${queryParams.toString()}`,
        );

        if (!response.ok) {
          throw new Error("An error occurred while fetching data.");
        }

        const result = (await response.json()) as PaginatedResponse<T>;
        setData(result.data);
        setMeta(result.meta);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint],
  );

  useFocusEffect(
    useCallback(() => {
      executeFetch(1);
    }, [executeFetch]),
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      executeFetch(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [paramsString, executeFetch]);

  return { data, meta, isLoading, error, fetch: executeFetch };
}
