
import { useState, useEffect } from 'react';
import { fetchValidStatuses, ValidStatus } from '@/utils/StatusUtils';

export default function useValidStatuses() {
  const [statuses, setStatuses] = useState<ValidStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        setLoading(true);
        const data = await fetchValidStatuses();
        setStatuses(data);
      } catch (err) {
        console.error('Error loading valid statuses:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
  }, []);

  return { statuses, loading, error };
}
