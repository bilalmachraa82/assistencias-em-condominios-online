
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const getTypeTooltip = (type: string) => {
    switch (type) {
      case 'Normal':
        return 'Assistência padrão - tempo de resposta em até 48h';
      case 'Urgente':
        return 'Assistência urgente - tempo de resposta em até 24h';
      case 'Emergência':
        return 'Emergência - tempo de resposta imediata';
      default:
        return 'Tipo de assistência não especificado';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`px-2 py-1 rounded-full text-xs border cursor-help ${getTypeBadgeClass(type)}`}>
            {type}
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-[#192133] border-[#2A3349] text-white">
          <p>{getTypeTooltip(type)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
