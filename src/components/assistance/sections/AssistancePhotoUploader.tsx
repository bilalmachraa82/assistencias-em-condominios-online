
import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Image, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { type PhotoCategory, VALID_PHOTO_CATEGORIES } from "@/config/photoCategories";

type ServiceAttachment = Tables<"service_attachments">;

interface AssistancePhotoUploaderProps {
  assistanceId: number;
  category: PhotoCategory;
  onUploadCompleted?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function AssistancePhotoUploader({
  assistanceId,
  category,
  onUploadCompleted,
}: AssistancePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Ficheiro "${file.name}" é muito grande. Máximo permitido: 5MB`;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Tipo de ficheiro "${file.type}" não permitido. Use: JPG, PNG, WebP ou GIF`;
    }
    
    return null;
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  };

  const handleSelectFiles = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!VALID_PHOTO_CATEGORIES.includes(category)) {
      toast.error(`Categoria de foto inválida: ${category}`);
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files before starting upload
    const validationErrors: string[] = [];
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) validationErrors.push(error);
    });

    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const file of Array.from(files)) {
        const sanitizedFileName = sanitizeFileName(file.name);
        const ext = sanitizedFileName.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 6);
        const filePath = `assistances/${assistanceId}/${category}/${timestamp}_${randomId}.${ext}`;

        try {
          // 1. Fazer upload para o bucket
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

          // 2. Obter URL pública
          const { data: pubUrl } = supabase.storage.from("assistance-photos").getPublicUrl(filePath);

          // 3. Salvar referência na tabela service_attachments
          const { error: dbError } = await supabase
            .from("service_attachments")
            .insert([
              {
                service_request_id: assistanceId.toString(),
                category: category,
                file_path: pubUrl?.publicUrl || "",
                file_name: sanitizedFileName,
                file_type: file.type,
                attachment_type: "photo",
                uploaded_by: "admin", // Adaptar se for fornecedor
                uploaded_role: "admin",
              } as Omit<ServiceAttachment, "id" | "created_at">,
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
        toast.success(`${successCount} foto(s) carregada(s) com sucesso!`);
        if (onUploadCompleted) onUploadCompleted();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} foto(s) falharam no upload`);
      }
    } catch (error: any) {
      console.error('Upload process error:', error);
      toast.error(`Erro durante o upload: ${error?.message || "Erro inesperado."}`);
    } finally {
      setIsUploading(false);
      // Limpar input
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        ref={inputRef}
        onChange={handleUpload}
        aria-label="Selecionar fotos"
      />
      <Button
        variant="outline"
        type="button"
        onClick={handleSelectFiles}
        disabled={isUploading}
        className="flex gap-1 items-center text-cyan-600 bg-white"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Adicionar fotos da categoria: <span className="capitalize">{category}</span>
      </Button>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Máximo 5MB por ficheiro • Formatos: JPG, PNG, WebP, GIF
      </div>
    </div>
  );
}
