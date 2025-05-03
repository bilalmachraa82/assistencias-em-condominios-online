
import React from 'react';

interface TypeBadgeProps {
  type: string;
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Normal':
        return 'bg-green-500/20 text-green-300';
      case 'Urgente':
        return 'bg-orange-500/20 text-orange-300';
      case 'Emergência':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeClass(type)}`}>
      {type}
    </span>
  );
}
