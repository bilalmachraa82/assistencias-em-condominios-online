
import { HealthCheck } from '@/types/healthCheck';
import { runDatabaseCheck } from './databaseCheck';
import { runStorageCheck } from './storageCheck';
import { runEdgeFunctionsCheck } from './edgeFunctionsCheck';
import { runSystemDataCheck } from './systemDataCheck';

export const runAllHealthChecks = async (setChecks: React.Dispatch<React.SetStateAction<HealthCheck[]>>) => {
  // Reset all checks to 'checking' status
  setChecks(prev => prev.map(check => ({ ...check, status: 'checking' as const })));

  // Run all checks
  await Promise.all([
    runDatabaseCheck(setChecks),
    runStorageCheck(setChecks),
    runEdgeFunctionsCheck(setChecks),
    runSystemDataCheck(setChecks)
  ]);
};
