import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Download, Trash2, Eye, ExternalLink } from 'lucide-react';
import { useAssistancePhotos } from "@/hooks/useAssistancePhotos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PHOTO_CATEGORIES } from '@/config/photoCategories';

interface PhotoGalleryProps {
  assistanceId: number;
  isAdmin?: boolean;
}

const CATEGORY_COLORS = {
  diagnostico: "bg-blue-100 text-blue-800",
  progresso: "bg-yellow-100 text-yellow-800",
  resultado: "bg-green-100 text-green-800",
};

export default function PhotoGallery({ assistanceId, isAdmin = false }: PhotoGalleryProps) {
  const { data: photos = [], isLoading, refetch } = useAssistancePhotos(assistanceId);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<number | null>(null);

  const handleDeletePhoto = async (photoId: number, photoUrl: string) => {
    if (!isAdmin) return;
    
    setDeletingPhoto(photoId);
    
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'assistance-photos');
      if (bucketIndex === -1) throw new Error('Invalid photo URL');
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('assistance-photos')
        .remove([filePath]);
        
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('assistance_photos')
        .delete()
        .eq('id', photoId);
        
      if (dbError) throw dbError;
      
      toast.success('Foto eliminada com sucesso');
      refetch();
    } catch (error: any) {
      toast.error(`Erro ao eliminar foto: ${error.message}`);
    } finally {
      setDeletingPhoto(null);
    }
  };

  const handleDownload = async (photoUrl: string, category: string) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assistencia-${assistanceId}-${category}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao fazer download da foto');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galeria de Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">A carregar fotos...</div>
        </CardContent>
      </Card>
    );
  }

  // Group photos by category
  const photosByCategory = photos.reduce((acc, photo) => {
    if (!acc[photo.category]) acc[photo.category] = [];
    acc[photo.category].push(photo);
    return acc;
  }, {} as Record<string, typeof photos>);

  const totalPhotos = photos.length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galeria de Fotos
          </CardTitle>
          <CardDescription>
            {totalPhotos} foto{totalPhotos !== 1 ? 's' : ''} em {Object.keys(photosByCategory).length} categoria{Object.keys(photosByCategory).length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(photosByCategory).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma foto encontrada para esta assistência</p>
            </div>
          ) : (
            Object.entries(photosByCategory).map(([category, categoryPhotos]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{PHOTO_CATEGORIES[category as keyof typeof PHOTO_CATEGORIES] || category}</h3>
                  <Badge className={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "bg-gray-100 text-gray-800"}>
                    {categoryPhotos.length} foto{categoryPhotos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {categoryPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photo.photo_url}
                          alt={`Foto ${category}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setSelectedPhoto(photo.photo_url)}
                          loading="lazy"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 bg-white bg-opacity-90 hover:bg-opacity-100"
                            onClick={() => setSelectedPhoto(photo.photo_url)}
                          >
                            <Eye className="h-4 w-4 text-gray-700" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 bg-white bg-opacity-90 hover:bg-opacity-100"
                            onClick={() => handleDownload(photo.photo_url, category)}
                          >
                            <Download className="h-4 w-4 text-gray-700" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 bg-white bg-opacity-90 hover:bg-opacity-100"
                            onClick={() => window.open(photo.photo_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 text-gray-700" />
                          </Button>
                          
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 bg-white bg-opacity-90 hover:bg-opacity-100"
                              onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                              disabled={deletingPhoto === photo.id}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-1 text-xs text-gray-500 text-center">
                        <div>Por: {photo.uploaded_by}</div>
                        <div>{new Date(photo.uploaded_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualizador de Foto</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex justify-center">
              <img
                src={selectedPhoto}
                alt="Foto ampliada"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
