
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Image, Settings } from 'lucide-react';
import { useAssistancePhotos } from "@/hooks/useAssistancePhotos";
import AssistancePhotoUploader from "./AssistancePhotoUploader";
import PhotoGallery from "../PhotoGallery";
import PhotoManagement from "../PhotoManagement";
import { PHOTO_CATEGORIES, type PhotoCategory } from "@/config/photoCategories";

interface PhotosSectionProps {
  assistanceId: number;
  isAdmin?: boolean;
}

const PHOTO_CATEGORY_CONFIG: { id: PhotoCategory; label: string; icon: React.ElementType }[] = [
  { id: "diagnostico", label: PHOTO_CATEGORIES.diagnostico, icon: Camera },
  { id: "progresso", label: PHOTO_CATEGORIES.progresso, icon: Image },
  { id: "resultado", label: PHOTO_CATEGORIES.resultado, icon: Image },
];

export default function PhotosSection({ assistanceId, isAdmin = false }: PhotosSectionProps) {
  const { data: photos = [], isLoading, refetch } = useAssistancePhotos(assistanceId);

  return (
    <Tabs defaultValue="gallery" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="gallery">Galeria</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
        {isAdmin && <TabsTrigger value="management">Gestão</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="gallery" className="mt-4">
        <PhotoGallery assistanceId={assistanceId} isAdmin={isAdmin} />
      </TabsContent>
      
      <TabsContent value="upload" className="mt-4">
        <div className="space-y-6">
          {PHOTO_CATEGORY_CONFIG.map(cat => {
            const Icon = cat.icon;
            const categoryPhotos = photos.filter(p => p.category === cat.id);
            
            return (
              <div key={cat.id} className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4" />
                  {cat.label}
                  {categoryPhotos.length > 0 && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {categoryPhotos.length} foto{categoryPhotos.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                
                <AssistancePhotoUploader
                  assistanceId={assistanceId}
                  category={cat.id}
                  onUploadCompleted={refetch}
                />
              </div>
            );
          })}
        </div>
      </TabsContent>
      
      {isAdmin && (
        <TabsContent value="management" className="mt-4">
          <PhotoManagement assistanceId={assistanceId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
