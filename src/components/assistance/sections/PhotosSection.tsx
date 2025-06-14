
import React from 'react';
import { Camera, Image } from 'lucide-react';
import { useAssistancePhotos } from "@/hooks/useAssistancePhotos";
import AssistancePhotoUploader from "./AssistancePhotoUploader";

interface PhotosSectionProps {
  assistanceId: number;
}

const PHOTO_CATEGORIES = [
  { id: "diagnostico", label: "Diagnóstico", icon: Camera },
  { id: "progresso", label: "Durante a Intervenção", icon: Image },
  { id: "resultado", label: "Resultado Final", icon: Image },
];

export default function PhotosSection({ assistanceId }: PhotosSectionProps) {
  const { data: photos = [], isLoading, refetch } = useAssistancePhotos(assistanceId);

  // Agrupar por categoria
  const categoryPhotos: Record<string, typeof photos> = {};
  for (const cat of PHOTO_CATEGORIES) categoryPhotos[cat.id] = [];
  for (const p of photos) {
    if (categoryPhotos[p.category]) categoryPhotos[p.category].push(p);
  }

  return (
    <div className="space-y-6">
      {PHOTO_CATEGORIES.map(cat => {
        const Icon = cat.icon;
        return (
          <div key={cat.id}>
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {cat.label}
            </h3>
            <div className="flex flex-wrap gap-3 mt-2">
              {categoryPhotos[cat.id] && categoryPhotos[cat.id].length > 0 ? (
                categoryPhotos[cat.id].map(photo => (
                  <a
                    key={photo.id}
                    href={photo.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border rounded overflow-hidden shadow-sm hover:scale-105 transition-transform"
                  >
                    <img
                      src={photo.photo_url}
                      alt={`Foto ${cat.label}`}
                      className="max-h-32 w-auto object-cover"
                      loading="lazy"
                    />
                  </a>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">Nenhuma foto nesta categoria.</span>
              )}
            </div>
            <div className="mt-3">
              <AssistancePhotoUploader
                assistanceId={assistanceId}
                category={cat.id}
                onUploadCompleted={refetch}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
