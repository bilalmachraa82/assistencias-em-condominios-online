
import React from 'react';

interface PhotosSectionProps {
  photoPath?: string;
  completionPhotoUrl?: string;
}

export default function PhotosSection({ photoPath, completionPhotoUrl }: PhotosSectionProps) {
  if (!photoPath && !completionPhotoUrl) return null;
  
  return (
    <>
      {photoPath && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Foto Inicial</h3>
          <div className="mt-2 max-w-full overflow-hidden rounded-md border">
            <img 
              src={photoPath} 
              alt="Foto da assistência" 
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      )}
      
      {completionPhotoUrl && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Foto de Conclusão</h3>
          <div className="mt-2 max-w-full overflow-hidden rounded-md border">
            <img 
              src={completionPhotoUrl} 
              alt="Foto de conclusão" 
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
}
