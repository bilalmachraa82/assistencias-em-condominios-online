
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { generateSupplierUrl } from '@/utils/HashUtils';

interface AssistanceSupplierLinkProps {
  assistance: any;
}

export default function AssistanceSupplierLink({ assistance }: AssistanceSupplierLinkProps) {
  // Get appropriate link for current status - use new simplified system
  const getSupplierLink = (assistance: any) => {
    try {
      // Use new hash-based system - much more reliable
      const newUrl = generateSupplierUrl(assistance.id, 'portal');
      console.log('🔗 Generating new-style portal link for assistance:', assistance.id);
      return newUrl;
    } catch (error) {
      console.error('❌ Error generating supplier link for assistance', assistance.id, error);
      return null;
    }
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
