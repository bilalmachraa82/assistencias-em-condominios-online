
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building, Users, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';

interface FollowUpStatsProps {
  assistances: any[];
  buildings: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
  selectedBuilding?: string | null;
  selectedSupplier?: string | null;
}

export default function FollowUpStats({
  assistances,
  buildings,
  suppliers,
  selectedBuilding,
  selectedSupplier
}: FollowUpStatsProps) {
  // Calculate stats
  const totalAssistances = assistances.length;
  const openAssistances = assistances.filter(a => 
    !['Concluído', 'Cancelado'].includes(a.status)
  ).length;
  const completedAssistances = assistances.filter(a => a.status === 'Concluído').length;
  const urgentAssistances = assistances.filter(a => a.type === 'Urgente' || a.type === 'Emergência').length;
  
  const completionRate = totalAssistances > 0 ? (completedAssistances / totalAssistances) * 100 : 0;

  // Stats by building (if not filtered by building)
  const buildingStats = !selectedBuilding ? buildings?.map(building => {
    const buildingAssistances = assistances.filter(a => a.building_id === building.id);
    const openCount = buildingAssistances.filter(a => !['Concluído', 'Cancelado'].includes(a.status)).length;
    const totalCount = buildingAssistances.length;
    
    return {
      ...building,
      totalAssistances: totalCount,
      openAssistances: openCount,
      completionRate: totalCount > 0 ? ((totalCount - openCount) / totalCount) * 100 : 0
    };
  }).filter(b => b.totalAssistances > 0).sort((a, b) => b.openAssistances - a.openAssistances) : [];

  // Stats by supplier (if not filtered by supplier)
  const supplierStats = !selectedSupplier ? suppliers?.map(supplier => {
    const supplierAssistances = assistances.filter(a => a.supplier_id === supplier.id);
    const openCount = supplierAssistances.filter(a => !['Concluído', 'Cancelado'].includes(a.status)).length;
    const totalCount = supplierAssistances.length;
    
    return {
      ...supplier,
      totalAssistances: totalCount,
      openAssistances: openCount,
      completionRate: totalCount > 0 ? ((totalCount - openCount) / totalCount) * 100 : 0
    };
  }).filter(s => s.totalAssistances > 0).sort((a, b) => b.openAssistances - a.openAssistances) : [];

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold">{totalAssistances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Em Aberto</p>
                <p className="text-2xl font-bold text-orange-400">{openAssistances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Concluídas</p>
                <p className="text-2xl font-bold text-green-400">{completedAssistances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Urgentes</p>
                <p className="text-2xl font-bold text-red-400">{urgentAssistances}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Building Stats */}
      {buildingStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Resumo por Edifício
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buildingStats.slice(0, 5).map((building) => (
                <div key={building.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{building.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant={building.openAssistances > 0 ? "destructive" : "default"}>
                          {building.openAssistances} em aberto
                        </Badge>
                        <Badge variant="outline">
                          {building.totalAssistances} total
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={building.completionRate} className="flex-1" />
                      <span className="text-sm text-gray-400">
                        {building.completionRate.toFixed(0)}% concluídas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Stats */}
      {supplierStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumo por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierStats.slice(0, 5).map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{supplier.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant={supplier.openAssistances > 0 ? "destructive" : "default"}>
                          {supplier.openAssistances} em aberto
                        </Badge>
                        <Badge variant="outline">
                          {supplier.totalAssistances} total
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={supplier.completionRate} className="flex-1" />
                      <span className="text-sm text-gray-400">
                        {supplier.completionRate.toFixed(0)}% concluídas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
