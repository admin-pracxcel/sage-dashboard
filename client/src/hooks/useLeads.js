import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchLeads } from '../lib/api';

export function useLeads() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchLeads(),
  });

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.fetchQuery({
        queryKey: ['leads'],
        queryFn: () => fetchLeads({ fresh: true }),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return { ...query, refresh, isRefreshing };
}
