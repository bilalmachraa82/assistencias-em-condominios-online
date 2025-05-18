
import React from 'react';
import { MessageSquare, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DescriptionSectionProps {
  description: string;
}

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  return (
    <div className="glass-card p-4 relative">
      <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
        <MessageSquare className="h-4 w-4" /> Descrição 
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                <Info className="h-4 w-4 text-gray-400" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-[#192133] border-[#2A3349] text-white">
              <p>Descrição detalhada do problema</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <p className="mt-1 text-base whitespace-pre-wrap">{description}</p>
    </div>
  );
}
