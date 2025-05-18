
import React from 'react';

interface TypeBadgeProps {
  type: string;
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Normal':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Urgente':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Emergência':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${getTypeBadgeClass(type)}`}>
      {type}
    </span>
  );
}
