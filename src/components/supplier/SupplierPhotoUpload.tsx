
import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Camera, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { type PhotoCategory, PHOTO_CATEGORIES, VALID_PHOTO_CATEGORIES } from "@/config/photoCategories";

interface SupplierPhotoUploadProps {
  assistanceId: number;
  category: PhotoCategory;
  onUploadCompleted?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILES = 10; // Limit number of files per upload

export default function SupplierPhotoUpload({
  assistanceId,
  category,
  onUploadCompleted,
}: SupplierPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Ficheiro "${file.name}" é muito grande. Máximo: 5MB`;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Tipo de ficheiro não permitido: ${file.type}`;
    }
    
    return null;
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (files.length > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} ficheiros por upload`);
      return;
    }

    // Validate all files
    const validationErrors: string[] = [];
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newPreviews.push(url);
        }
      }
    });

    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setPreviewImages(newPreviews);
    }
  };

  const handleUpload = async () => {
    if (!VALID_PHOTO_CATEGORIES.includes(category)) {
      toast.error(`Categoria de foto inválida: ${category}`);
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Por favor, selecione pelo menos uma foto');
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const file of selectedFiles) {
        try {
          const sanitizedFileName = sanitizeFileName(file.name);
          const ext = sanitizedFileName.split('.').pop() || 'jpg';
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substr(2, 6);
          const filePath = `assistances/${assistanceId}/${category}/${timestamp}_${randomId}.${ext}`;

          // Upload to storage
          const { data: storageData, error: uploadError } = await supabase.storage
            .from("assistance-photos")
            .upload(filePath, file, { 
              upsert: false,
              contentType: file.type
            });

          if (uploadError) {
            console.error(`Upload error for ${file.name}:`, uploadError);
            errorCount++;
            continue;
          }

          // Get public URL
          const { data: pubUrl } = supabase.storage
            .from("assistance-photos")
            .getPublicUrl(filePath);

          // Save to database
          const { error: dbError } = await supabase
            .from("service_attachments")
            .insert([
              {
                service_request_id: assistanceId.toString(),
                category,
                file_path: pubUrl?.publicUrl || "",
                file_name: sanitizedFileName,
                file_type: file.type,
                attachment_type: "photo",
                uploaded_by: "supplier",
                uploaded_role: "supplier",
              },
            ]);

          if (dbError) {
            console.error(`DB error for ${file.name}:`, dbError);
            errorCount++;
            continue;
          }

          successCount++;
        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} foto(s) enviada(s) com sucesso!`);
        clearPreviews();
        if (onUploadCompleted) onUploadCompleted();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} foto(s) falharam no envio`);
      }
    } catch (error: any) {
      console.error('Upload process error:', error);
      toast.error(`Erro: ${error?.message || "Erro inesperado"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreviews = () => {
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
    setSelectedFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Camera className="h-4 w-4" />
        {PHOTO_CATEGORIES[category]}
      </h3>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
        capture="environment"
      />

      {previewImages.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {previewImages.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? "Enviando..." : "Enviar Fotos"}
            </Button>
            
            <Button
              variant="outline"
              onClick={clearPreviews}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Selecionar Fotos
          </Button>
          
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Máximo {MAX_FILES} ficheiros • 5MB cada • JPG, PNG, WebP, GIF
          </div>
        </div>
      )}
    </div>
  );
}
