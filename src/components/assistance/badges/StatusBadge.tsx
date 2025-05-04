
import React from 'react';
import { getStatusBadgeClass } from '@/utils/StatusUtils';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
}
