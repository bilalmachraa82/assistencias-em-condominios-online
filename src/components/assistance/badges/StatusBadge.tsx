
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from '@/utils/StatusUtils';
import useValidStatuses from '@/hooks/useValidStatuses';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const [badgeClass, setBadgeClass] = useState("");
  const [statusInfo, setStatusInfo] = useState({ hexColor: '', label: status });
  const { statuses, loading } = useValidStatuses();
  
  useEffect(() => {
    // Initial default class
    setBadgeClass(getStatusBadgeClass(status));
    
    // Once statuses are loaded, find the matching status and update the badge
    if (!loading && statuses.length > 0) {
      const matchedStatus = statuses.find(s => s.status_value === status);
      
      if (matchedStatus) {
        setBadgeClass(getStatusBadgeClass(status, matchedStatus.hex_color));
        setStatusInfo({
          hexColor: matchedStatus.hex_color || '#888888',
          label: matchedStatus.label_pt || status
        });
      }
    }
  }, [status, statuses, loading]);
  
  return (
    <Badge 
      variant="outline" 
      className={`${badgeClass} px-2 py-1 text-xs font-medium`}
    >
      {statusInfo.label}
    </Badge>
  );
}
