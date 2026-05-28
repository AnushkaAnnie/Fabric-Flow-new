export const QUERY_CONFIG = {
  dashboard: {
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 2,
  },

  execution: {
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 2,
  },

  tables: {
    refetchInterval: false as const,
    staleTime: 30000,
    retry: 1,
  },
};
