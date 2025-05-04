
import React from 'react';
import { Camera, Image } from 'lucide-react';

interface PhotosSectionProps {
  photoPath?: string;
  completionPhotoUrl?: string;
}

export default function PhotosSection({ photoPath, completionPhotoUrl }: PhotosSectionProps) {
  if (!photoPath && !completionPhotoUrl) return null;
  
  return (
    <div className="space-y-6">
      {photoPath && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Foto Inicial
          </h3>
          <div className="mt-2 max-w-full overflow-hidden rounded-md border">
            <img 
              src={photoPath} 
              alt="Foto da assistência" 
              className="h-auto w-full object-cover max-h-80"
            />
          </div>
        </div>
      )}
      
      {completionPhotoUrl && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Image className="h-4 w-4" />
            Foto de Conclusão
          </h3>
          <div className="mt-2 max-w-full overflow-hidden rounded-md border">
            <img 
              src={completionPhotoUrl} 
              alt="Foto de conclusão" 
              className="h-auto w-full object-cover max-h-80"
            />
          </div>
        </div>
      )}
    </div>
  );
}
