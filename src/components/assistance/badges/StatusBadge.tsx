
import React from 'react';
import { getStatusBadgeClass } from '@/utils/StatusUtils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const badgeClass = getStatusBadgeClass(status);
  
  return (
    <Badge className={`${badgeClass} whitespace-nowrap font-medium`}>
      {status}
    </Badge>
  );
}
