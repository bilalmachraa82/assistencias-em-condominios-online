
import React from 'react';
import { MessageSquare } from 'lucide-react';

interface DescriptionSectionProps {
  description: string;
}

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
        <MessageSquare className="h-4 w-4" /> Descrição
      </h3>
      <p className="mt-1 text-base whitespace-pre-wrap">{description}</p>
    </div>
  );
}
