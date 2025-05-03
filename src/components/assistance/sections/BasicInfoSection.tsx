
import React from 'react';
import { Building, Wrench, User, AlertTriangle, Calendar, Clock } from 'lucide-react';
import StatusBadge from '../badges/StatusBadge';
import TypeBadge from '../badges/TypeBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BasicInfoSectionProps {
  assistance: any;
  isEditing: boolean;
  status: string;
  setStatus: (value: string) => void;
  statuses: string[];
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  isSubmitting: boolean;
}

export default function BasicInfoSection({ 
  assistance, 
  isEditing, 
  status, 
  setStatus,
  statuses,
  formatDate,
  formatDateTime,
  isSubmitting
}: BasicInfoSectionProps) {
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
            onValueChange={setStatus}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="mt-1">
            <StatusBadge status={assistance.status} />
          </p>
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
        <p className="mt-1 text-base">{formatDateTime(assistance.scheduled_datetime)}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" /> Urgência
        </h3>
        <p className="mt-1">
          <TypeBadge type={assistance.type} />
        </p>
      </div>
      
      {(assistance.status === 'Pendente Validação' || 
        assistance.validation_reminder_count > 0) && (
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" /> Lembretes de Validação
          </h3>
          <p className="mt-1 text-sm">
            Último lembrete: {formatDateTime(assistance.validation_email_sent_at || '')}
          </p>
          <p className="mt-1 text-sm">
            Total de lembretes: {assistance.validation_reminder_count}
          </p>
        </div>
      )}
    </div>
  );
}
