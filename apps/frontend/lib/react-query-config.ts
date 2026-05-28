export const QUERY_CONFIG = {
  dashboard: {
    staleTime: 10000,
    gcTime: 300000,
    refetchInterval: 15000,
    retry: 2,
    refetchOnWindowFocus: false,
  },

  execution: {
    staleTime: 5000,
    gcTime: 300000,
    refetchInterval: 10000,
    retry: 2,
    refetchOnWindowFocus: false,
  },

  tables: {
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
};
