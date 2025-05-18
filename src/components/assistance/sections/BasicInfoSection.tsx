
import React from 'react';
import { Building, Wrench, User, AlertTriangle, Calendar, Clock } from 'lucide-react';
import StatusBadge from '../badges/StatusBadge';
import TypeBadge from '../badges/TypeBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ValidStatus } from '@/types/assistance';

interface BasicInfoSectionProps {
  assistance: any;
  isEditing: boolean;
  status: string;
  setStatus: (value: string) => void;
  statuses: ValidStatus[];
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  isSubmitting: boolean;
  badgeColor?: string;
}

export default function BasicInfoSection({ 
  assistance, 
  isEditing, 
  status, 
  setStatus,
  statuses,
  formatDate,
  formatDateTime,
  isSubmitting,
  badgeColor
}: BasicInfoSectionProps) {
  const handleStatusChange = (value: string) => {
    console.log('Status changed to:', value);
    setStatus(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
          <Building className="h-4 w-4" /> Edifício
        </h3>
        <p className="mt-1 text-base">{assistance.buildings?.name}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
          <Wrench className="h-4 w-4" /> Tipo de Intervenção
        </h3>
        <p className="mt-1 text-base">{assistance.intervention_types?.name}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
          <User className="h-4 w-4" /> Fornecedor
        </h3>
        <p className="mt-1 text-base">{assistance.suppliers?.name}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
          <AlertTriangle className="h-4 w-4" /> Status
        </h3>
        {isEditing ? (
          <Select 
            value={status} 
            onValueChange={handleStatusChange}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full mt-1 bg-[#141b2c] border-white/10 text-white">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent className="select-content">
              {statuses && statuses.map((s) => (
                <SelectItem key={s.status_value} value={s.status_value || ''} className="text-white hover:bg-white/10">
                  {s.label_pt || s.status_value || ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="mt-1">
            <StatusBadge status={assistance.status} />
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4" /> Data Criação
        </h3>
        <p className="mt-1 text-base">{formatDate(assistance.created_at)}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4" /> Agendamento
        </h3>
        <p className="mt-1 text-base">{assistance.scheduled_datetime ? formatDateTime(assistance.scheduled_datetime) : "Não agendado"}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
          <AlertTriangle className="h-4 w-4" /> Urgência
        </h3>
        <div className="mt-1">
          <TypeBadge type={assistance.type} />
        </div>
      </div>
      
      {(assistance.status === 'Pendente Validação' || 
        assistance.validation_reminder_count > 0) && (
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 text-gray-300">
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
