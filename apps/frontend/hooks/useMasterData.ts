"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export function useMasterData(entity: string) {
  const queryClient = useQueryClient();
  const queryKey = [entity];

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(`/${entity}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newData: Record<string, unknown>) => api.post(`/${entity}`, newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${entity.slice(0, -1)} created`);
    },
    onError: () => toast.error(`Failed to create ${entity.slice(0, -1)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch(`/${entity}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${entity.slice(0, -1)} updated`);
    },
    onError: () => toast.error(`Failed to update ${entity.slice(0, -1)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/${entity}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${entity.slice(0, -1)} deleted`);
    },
    onError: () => toast.error(`Failed to delete ${entity.slice(0, -1)}`),
  });

  return { data, isLoading, createMutation, updateMutation, deleteMutation };
}
