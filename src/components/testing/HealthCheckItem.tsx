
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { HealthCheck } from '@/types/healthCheck';
import { getStatusColor, getStatusVariant, getStatusLabel } from '@/utils/healthCheckUtils';

interface HealthCheckItemProps {
  check: HealthCheck;
}

export const HealthCheckItem: React.FC<HealthCheckItemProps> = ({ check }) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        {check.icon}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{check.name}</span>
            <Badge variant={getStatusVariant(check.status)}>
              {getStatusLabel(check.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{check.message}</p>
        </div>
      </div>
      <div className={`h-3 w-3 rounded-full ${getStatusColor(check.status)}`} />
    </div>
  );
};
