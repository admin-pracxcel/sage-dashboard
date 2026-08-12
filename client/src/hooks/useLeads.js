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
      // Bypass TanStack's staleTime — always hit the server with ?fresh=1
      // and push the result straight into the cache so observers re-render.
      const data = await fetchLeads({ fresh: true });
      queryClient.setQueryData(['leads'], data);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { ...query, refresh, isRefreshing };
}
