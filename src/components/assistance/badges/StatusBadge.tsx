
import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusBadgeClass = (statusValue: string) => {
    switch (statusValue) {
      case 'Pendente Resposta Inicial':
      case 'Pendente Aceitação':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'Recusada Fornecedor':
        return 'bg-red-500/20 text-red-300';
      case 'Pendente Agendamento':
      case 'Agendado':
        return 'bg-blue-500/20 text-blue-300';
      case 'Em Progresso':
      case 'Pendente Validação':
        return 'bg-purple-500/20 text-purple-300';
      case 'Concluído':
        return 'bg-green-500/20 text-green-300';
      case 'Reagendamento Solicitado':
        return 'bg-orange-500/20 text-orange-300';
      case 'Validação Expirada':
        return 'bg-gray-500/20 text-gray-300';
      case 'Cancelado':
      case 'Cancelada Admin':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
}
