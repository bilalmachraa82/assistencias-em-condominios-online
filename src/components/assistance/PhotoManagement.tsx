
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { HardDrive, Trash2, Download, Info } from 'lucide-react';
import { useAssistancePhotos } from "@/hooks/useAssistancePhotos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhotoManagementProps {
  assistanceId: number;
}

export default function PhotoManagement({ assistanceId }: PhotoManagementProps) {
  const { data: photos = [], isLoading, refetch } = useAssistancePhotos(assistanceId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    totalSize: number;
    photoCount: number;
  } | null>(null);

  // Calculate storage usage
  React.useEffect(() => {
    if (photos.length > 0) {
      // Estimate file sizes (this is approximate since we don't have actual file sizes)
      const estimatedTotalSize = photos.length * 0.5; // Assume 500KB per photo on average
      setStorageInfo({
        totalSize: estimatedTotalSize,
        photoCount: photos.length
      });
    }
  }, [photos]);

  const handleDeleteAllPhotos = async () => {
    if (!confirm('Tem certeza que quer eliminar TODAS as fotos desta assistência? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      let deletedCount = 0;
      let errorCount = 0;

      for (const photo of photos) {
        try {
          // Extract file path from URL
          const urlParts = photo.photo_url.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'assistance-photos');
          
          if (bucketIndex !== -1) {
            const filePath = urlParts.slice(bucketIndex + 1).join('/');
            
            // Delete from storage
            await supabase.storage
              .from('assistance-photos')
              .remove([filePath]);
          }
          
          // Delete from database
          await supabase
            .from('assistance_photos')
            .delete()
            .eq('id', photo.id);
            
          deletedCount++;
        } catch (error) {
          console.error('Error deleting photo:', photo.id, error);
          errorCount++;
        }
      }

      if (deletedCount > 0) {
        toast.success(`${deletedCount} fotos eliminadas com sucesso`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} fotos não puderam ser eliminadas`);
      }
      
      refetch();
    } catch (error: any) {
      toast.error(`Erro ao eliminar fotos: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAll = async () => {
    toast.info('A preparar download de todas as fotos...');
    
    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        // Small delay between downloads to avoid overwhelming the browser
        setTimeout(async () => {
          try {
            const response = await fetch(photo.photo_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `assistencia-${assistanceId}-${photo.category}-${i + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Error downloading photo:', photo.id, error);
          }
        }, i * 500); // 500ms delay between each download
      }
      
      toast.success('Downloads iniciados - verifique a pasta de downloads');
    } catch (error: any) {
      toast.error(`Erro ao fazer download: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Gestão de Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">A carregar informações...</div>
        </CardContent>
      </Card>
    );
  }

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Gestão de Storage
        </CardTitle>
        <CardDescription>
          Gerir e optimizar o armazenamento de fotos desta assistência
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {storageInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-sm font-medium">Total de Fotos</div>
                  <div className="text-lg">{storageInfo.photoCount}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Espaço Estimado</div>
                  <div className="text-lg">{formatFileSize(storageInfo.totalSize)}</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="space-y-3">
          <h3 className="font-medium">Ações em Lote</h3>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              disabled={photos.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Todas ({photos.length})
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDeleteAllPhotos}
              disabled={photos.length === 0 || isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'A eliminar...' : `Eliminar Todas (${photos.length})`}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-medium">Distribuição por Categoria</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(
              photos.reduce((acc, photo) => {
                acc[photo.category] = (acc[photo.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-2 border rounded">
                <span className="capitalize">{category}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {photos.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Não existem fotos para gerir nesta assistência.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
