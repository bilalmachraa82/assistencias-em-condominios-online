
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';

interface AssistanceSupplierLinkProps {
  assistance: any;
}

export default function AssistanceSupplierLink({ assistance }: AssistanceSupplierLinkProps) {
  // Get appropriate link for current status - always use portal route
  const getSupplierLink = (assistance: any) => {
    const baseUrl = window.location.origin;
    
    // Prioritize longer tokens first (better validation compatibility)
    const tokens = [
      assistance.interaction_token,
      assistance.validation_token, 
      assistance.scheduling_token,
      assistance.acceptance_token
    ].filter(t => t && t.length >= 20); // Only tokens with minimum length
    
    const token = tokens[0]; // Take the first valid token
    
    if (!token) {
      console.error('❌ No valid token found for assistance', assistance.id, {
        acceptance_token: assistance.acceptance_token?.length || 0,
        scheduling_token: assistance.scheduling_token?.length || 0,
        validation_token: assistance.validation_token?.length || 0,
        interaction_token: assistance.interaction_token?.length || 0
      });
      return null;
    }
    
    console.log('🔗 Generating portal link with token:', token.substring(0, 10) + '...', `(${token.length} chars)`);
    return `${baseUrl}/supplier/portal/${token}`;
  };
  
  // Copy link to clipboard
  const copyLinkToClipboard = (link: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  const supplierLink = getSupplierLink(assistance);

  return (
    <>
      {supplierLink ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8"
                onClick={(e) => copyLinkToClipboard(supplierLink, e)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copiar link para fornecedor</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span>-</span>
      )}
    </>
  );
}
