
import React, { useState } from 'react';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStatusBadgeClass } from '@/utils/StatusUtils';
import { formatDateTime } from '@/utils/DateTimeUtils';
import { Skeleton } from "@/components/ui/skeleton";

interface AssistanceCalendarViewProps {
  assistances: any[];
  onViewAssistance: (assistance: any) => void;
  isLoading: boolean;
}

export function AssistanceCalendarView({ assistances, onViewAssistance, isLoading }: AssistanceCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Filter assistances for the selected date
  const selectedDateAssistances = assistances.filter(assistance => {
    if (!selectedDate || !assistance.scheduled_datetime) return false;
    return isSameDay(new Date(assistance.scheduled_datetime), selectedDate);
  });
  
  // Get dates that have assistances scheduled
  const assistanceDates = React.useMemo(() => {
    return assistances
      .filter(a => a.scheduled_datetime)
      .map(a => new Date(a.scheduled_datetime));
  }, [assistances]);

  const isDateWithAssistance = (date: Date) => {
    return assistanceDates.some(d => isSameDay(d, date));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardContent className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Calendário de Assistências</h3>
            <p className="text-sm text-muted-foreground">Selecione uma data para ver as assistências agendadas.</p>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                hasAssistance: (date) => isDateWithAssistance(date),
                today: (date) => isToday(date),
              }}
              modifiersStyles={{
                hasAssistance: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'white', fontWeight: 'bold' },
                today: { border: '2px solid rgba(59, 130, 246, 0.5)' }
              }}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          )}
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardContent className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              {selectedDate ? (
                <>
                  Assistências para {format(selectedDate, "d 'de' MMMM',' yyyy", { locale: ptBR })}
                  <Badge className="ml-2 bg-blue-500/30 text-blue-300">
                    {selectedDateAssistances.length} agendadas
                  </Badge>
                </>
              ) : (
                "Selecione uma data no calendário"
              )}
            </h3>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateAssistances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Não há assistências agendadas para esta data.</p>
                </div>
              ) : (
                selectedDateAssistances.map(assistance => (
                  <div 
                    key={assistance.id} 
                    className="p-4 bg-[#1e293b]/30 rounded-lg border border-white/5 cursor-pointer hover:bg-[#1e293b]/50 transition-colors"
                    onClick={() => onViewAssistance(assistance)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          Assistência #{assistance.id}
                          <Badge className={`ml-2 ${getStatusBadgeClass(assistance.status)}`}>
                            {assistance.status}
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {assistance.buildings?.name || 'Edifício não especificado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fornecedor: {assistance.suppliers?.name || 'Não atribuído'}
                        </p>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {assistance.scheduled_datetime ? (
                                format(new Date(assistance.scheduled_datetime), 'HH:mm')
                              ) : (
                                'Hora não definida'
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Agendado para: {formatDateTime(assistance.scheduled_datetime)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {assistance.description && (
                      <p className="text-sm mt-2 line-clamp-2">{assistance.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
