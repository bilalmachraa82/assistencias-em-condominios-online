
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from '@/utils/StatusUtils';
import useValidStatuses from '@/hooks/useValidStatuses';
import { ValidStatus } from '@/types/assistance';

interface StatusBadgeProps {
  status: string;
}

// Type guard to check if a status has a valid hex_color
function hasValidHexColor(status: ValidStatus | undefined): status is ValidStatus & { hex_color: string } {
  return !!status && typeof status.hex_color === 'string' && status.hex_color.length > 0;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const [badgeClass, setBadgeClass] = useState("");
  const [statusInfo, setStatusInfo] = useState<{ hexColor: string, label: string }>({ 
    hexColor: '', 
    label: status || '' 
  });
  const { statuses, loading } = useValidStatuses();
  
  useEffect(() => {
    if (!status) {
      setBadgeClass(getStatusBadgeClass(''));
      return;
    }
    
    // Initial default class
    setBadgeClass(getStatusBadgeClass(status));
    
    // Once statuses are loaded, find the matching status and update the badge
    if (!loading && statuses && Array.isArray(statuses) && statuses.length > 0) {
      const matchedStatus = statuses.find(s => s && s.status_value === status);
      
      if (matchedStatus) {
        const hexColor = hasValidHexColor(matchedStatus) ? matchedStatus.hex_color : undefined;
        setBadgeClass(getStatusBadgeClass(status, hexColor));
        setStatusInfo({
          hexColor: hexColor || '#888888',
          label: matchedStatus.label_pt || status
        });
      }
    }
  }, [status, statuses, loading]);
  
  if (!status) {
    return (
      <Badge 
        variant="outline" 
        className="bg-gray-500/20 text-gray-300 border-gray-500/30 px-2 py-1 text-xs font-medium"
      >
        Sem Status
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`${badgeClass} px-2 py-1 text-xs font-medium`}
    >
      {statusInfo.label}
    </Badge>
  );
}
