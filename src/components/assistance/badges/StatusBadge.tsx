
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import useValidStatuses from '@/hooks/useValidStatuses';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { statuses, loading } = useValidStatuses();
  const [statusInfo, setStatusInfo] = useState<{
    hexColor: string;
    label: string;
  } | null>(null);
  
  useEffect(() => {
    if (!loading && statuses.length > 0) {
      const matchedStatus = statuses.find(s => s.status_value === status);
      
      if (matchedStatus) {
        setStatusInfo({
          hexColor: matchedStatus.hex_color,
          label: matchedStatus.label_pt || status
        });
      }
    }
  }, [status, statuses, loading]);
  
  // Generate styling from hex color
  const getBadgeStyles = () => {
    if (!statusInfo?.hexColor) return {};
    
    return {
      backgroundColor: `${statusInfo.hexColor}20`, // 20 = 12% opacity
      color: statusInfo.hexColor,
      borderColor: `${statusInfo.hexColor}30` // 30 = 19% opacity
    };
  };
  
  return (
    <Badge 
      variant="outline" 
      className="whitespace-nowrap font-medium"
      style={statusInfo ? getBadgeStyles() : undefined}
    >
      {statusInfo?.label || status}
    </Badge>
  );
}
