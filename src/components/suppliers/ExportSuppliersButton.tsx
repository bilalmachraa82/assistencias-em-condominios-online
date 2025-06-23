
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  nif?: string;
  specialization?: string;
  is_active: boolean;
  created_at: string;
}

interface ExportSuppliersButtonProps {
  suppliers: Supplier[] | undefined;
  isLoading: boolean;
}

export default function ExportSuppliersButton({ suppliers, isLoading }: ExportSuppliersButtonProps) {
  const exportToCSV = () => {
    if (!suppliers || suppliers.length === 0) {
      toast.error('Não há fornecedores para exportar');
      return;
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Nome',
      'Email',
      'Telefone',
      'Morada',
      'NIF',
      'Especialização',
      'Estado',
      'Data de Criação'
    ];

    // Convert suppliers to CSV rows
    const csvRows = suppliers.map(supplier => [
      supplier.id,
      `"${supplier.name}"`,
      `"${supplier.email}"`,
      `"${supplier.phone || ''}"`,
      `"${supplier.address || ''}"`,
      `"${supplier.nif || ''}"`,
      `"${supplier.specialization || ''}"`,
      supplier.is_active ? 'Ativo' : 'Inativo',
      new Date(supplier.created_at).toLocaleDateString('pt-PT')
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fornecedores_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exportados ${suppliers.length} fornecedores para CSV`);
    } else {
      toast.error('Erro ao exportar arquivo CSV');
    }
  };

  return (
    <Button 
      onClick={exportToCSV}
      disabled={isLoading || !suppliers || suppliers.length === 0}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
