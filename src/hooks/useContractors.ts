// TEMPORARY: Simple stub for useContractors to fix build errors
import { useState, useEffect } from 'react';

export interface ContractorWithStats {
  id: string;
  name: string;
  email: string;
  active_requests_count: number;
  completed_requests_count: number;
  insurance_info?: Record<string, any>;
}

export function useContractors() {
  const [contractors, setContractors] = useState<ContractorWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Stub implementation - will be restored after schema migration is complete
    setContractors([]);
    setLoading(false);
  }, []);

  return {
    contractors,
    loading,
    error,
    fetchContractors: () => Promise.resolve(),
    addContractor: () => Promise.resolve(),
    updateContractor: () => Promise.resolve(),
    deleteContractor: () => Promise.resolve()
  };
}