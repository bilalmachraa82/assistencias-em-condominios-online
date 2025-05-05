
import React from 'react';
import { Building, Wrench, User, AlertTriangle, Calendar, Clock } from 'lucide-react';
import StatusBadge from '../badges/StatusBadge';
import TypeBadge from '../badges/TypeBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useValidStatuses from '@/hooks/useValidStatuses';

interface BasicInfoSectionProps {
  assistance: any;
  isEditing: boolean;
  status: string;
  setStatus: (value: string) => void;
  statuses: any[];
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  isSubmitting: boolean;
}

export default function BasicInfoSection({ 
  assistance, 
  isEditing, 
  status, 
  setStatus,
  statuses: _, // Ignore passed statuses, we'll use our hook instead
  formatDate,
  formatDateTime,
  isSubmitting
}: BasicInfoSectionProps) {
  // Use our new hook to get statuses from the database
  const { statuses: validStatuses, loading: loadingStatuses } = useValidStatuses();
  
  const handleStatusChange = (value: string) => {
    console.log('Status changed to:', value);
    setStatus(value);
  };

  console.log('Available status options from DB:', validStatuses);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Building className="h-4 w-4" /> Edifício
        </h3>
        <p className="mt-1 text-base">{assistance.buildings?.name}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Wrench className="h-4 w-4" /> Tipo de Intervenção
        </h3>
        <p className="mt-1 text-base">{assistance.intervention_types?.name}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" /> Fornecedor
        </h3>
        <p className="mt-1 text-base">{assistance.suppliers?.name}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" /> Status
        </h3>
        {isEditing ? (
          <Select 
            value={status} 
            onValueChange={handleStatusChange}
            disabled={isSubmitting || loadingStatuses}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              {loadingStatuses ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : (
                validStatuses.map((s) => (
                  <SelectItem key={s.status_value} value={s.status_value}>
                    {s.label_pt}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        ) : (
          <div className="mt-1">
            <StatusBadge status={assistance.status} />
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" /> Data Criação
        </h3>
        <p className="mt-1 text-base">{formatDate(assistance.created_at)}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" /> Agendamento
        </h3>
        <p className="mt-1 text-base">{assistance.scheduled_datetime ? formatDateTime(assistance.scheduled_datetime) : "Não agendado"}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" /> Urgência
        </h3>
        <div className="mt-1">
          <TypeBadge type={assistance.type} />
        </div>
      </div>
      
      {(assistance.status === 'Pendente Validação' || 
        assistance.validation_reminder_count > 0) && (
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" /> Lembretes de Validação
          </h3>
          <p className="mt-1 text-sm">
            Último lembrete: {assistance.validation_email_sent_at ? formatDateTime(assistance.validation_email_sent_at) : 'Nenhum'}
          </p>
          <p className="mt-1 text-sm">
            Total de lembretes: {assistance.validation_reminder_count}
          </p>
        </div>
      )}
    </div>
  );
}
