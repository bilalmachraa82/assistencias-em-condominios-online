
import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Trash } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AssistanceTableActionsProps {
  assistance: any;
  onViewAssistance: (assistance: any) => void;
  onDeleteAssistance?: (assistance: any) => void;
}

export default function AssistanceTableActions({ 
  assistance, 
  onViewAssistance, 
  onDeleteAssistance 
}: AssistanceTableActionsProps) {
  // Handle view button click - separate from row click
  const handleViewButtonClick = (assistance: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent row click event
    onViewAssistance(assistance);
  };

  // Handle delete confirmation with enhanced error handling
  const handleDeleteConfirm = async (assistance: any) => {
    try {
      console.log(`🗑️ Attempting to delete assistance #${assistance.id}`);
      if (onDeleteAssistance) {
        await onDeleteAssistance(assistance);
      }
      console.log(`✅ Successfully deleted assistance #${assistance.id}`);
    } catch (error) {
      console.error(`❌ Failed to delete assistance #${assistance.id}:`, error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => handleViewButtonClick(assistance, e)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver detalhes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {onDeleteAssistance && (
        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir assistência</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <AlertDialogContent className="bg-gray-800 text-white border border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Tem certeza que deseja excluir a assistência #{assistance.id}?
                <br />
                <strong>Esta ação não pode ser desfeita.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleDeleteConfirm(assistance)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Excluir Definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
