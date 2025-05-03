
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, Calendar, X } from 'lucide-react';
import SupplierActionLayout from '@/components/supplier/SupplierActionLayout';

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || '';
  const navigate = useNavigate();
  
  const getConfirmationDetails = () => {
    switch(action) {
      case 'rejected':
        return {
          title: "Assistência Recusada",
          description: "Obrigado pela sua resposta. O cliente foi notificado sobre a sua recusa.",
          icon: <X className="h-16 w-16 text-red-500" />,
          message: "A sua recusa foi registrada no sistema. O cliente irá procurar outro fornecedor."
        };
      case 'scheduled':
        return {
          title: "Agendamento Confirmado",
          description: "O agendamento foi confirmado com sucesso.",
          icon: <Calendar className="h-16 w-16 text-blue-500" />,
          message: "A data e hora do agendamento foram registradas. O cliente foi notificado."
        };
      case 'rescheduled':
        return {
          title: "Reagendamento Confirmado",
          description: "O reagendamento foi solicitado com sucesso.",
          icon: <Calendar className="h-16 w-16 text-orange-500" />,
          message: "O cliente será notificado sobre a solicitação de reagendamento."
        };
      case 'completed':
        return {
          title: "Serviço Concluído",
          description: "Obrigado! O serviço foi marcado como concluído.",
          icon: <Check className="h-16 w-16 text-green-500" />,
          message: "A foto foi enviada e o cliente será notificado para validar o serviço."
        };
      default:
        return {
          title: "Ação Processada",
          description: "Sua solicitação foi processada com sucesso.",
          icon: <Check className="h-16 w-16 text-green-500" />,
          message: "O cliente foi notificado sobre esta atualização."
        };
    }
  };
  
  const details = getConfirmationDetails();
  
  return (
    <SupplierActionLayout 
      title={details.title}
      description={details.description}
    >
      <div className="py-6 flex flex-col items-center">
        <div className="bg-gray-50 p-6 rounded-full mb-6">
          {details.icon}
        </div>
        
        <p className="text-center text-gray-700 mb-8">
          {details.message}
        </p>
        
        <Button 
          onClick={() => window.close()}
          className="w-full sm:w-auto"
        >
          Fechar
        </Button>
      </div>
    </SupplierActionLayout>
  );
}
