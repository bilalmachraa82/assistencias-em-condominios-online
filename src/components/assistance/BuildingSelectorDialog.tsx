
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BuildingSelectorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  buildings: any[] | undefined;
  isBuildingsLoading: boolean;
  selectedBuilding: { id: number; name: string } | null;
  onBuildingChange: (building: any) => void;
  onContinue: () => void;
}

export default function BuildingSelectorDialog({
  isOpen,
  onOpenChange,
  buildings,
  isBuildingsLoading,
  selectedBuilding,
  onBuildingChange,
  onContinue
}: BuildingSelectorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Selecione um Edifício</DialogTitle>
          <DialogDescription>
            Escolha o edifício para o qual deseja solicitar assistência.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select 
            onValueChange={(value) => {
              const building = buildings?.find(b => b.id === Number(value));
              if (building) {
                onBuildingChange({ id: building.id, name: building.name });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um edifício" />
            </SelectTrigger>
            <SelectContent>
              {isBuildingsLoading ? (
                <div className="p-4 text-center">Carregando edifícios...</div>
              ) : buildings?.length === 0 ? (
                <div className="p-4 text-center">Nenhum edifício encontrado</div>
              ) : (
                buildings?.map((building) => (
                  <SelectItem 
                    key={building.id} 
                    value={String(building.id)}
                  >
                    {building.name} - {building.address}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            disabled={!selectedBuilding}
            onClick={onContinue}
          >
            Próximo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
