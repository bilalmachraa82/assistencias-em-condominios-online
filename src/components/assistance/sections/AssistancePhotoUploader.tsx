
import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Image } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type AssistancePhoto = Tables<"assistance_photos">;

interface AssistancePhotoUploaderProps {
  assistanceId: number;
  category: string;
  onUploadCompleted?: () => void;
}

export default function AssistancePhotoUploader({
  assistanceId,
  category,
  onUploadCompleted,
}: AssistancePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFiles = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const filePath = `assistances/${assistanceId}/${category}/${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 6)}.${ext}`;

        // 1. Fazer upload para o bucket
        const { data: storageData, error: uploadError } = await supabase.storage
          .from("assistance-photos")
          .upload(filePath, file, { upsert: false });

        if (uploadError) {
          toast.error(`Erro ao fazer upload: ${uploadError.message}`);
          continue;
        }

        // 2. Obter URL pública
        const { data: pubUrl } = supabase.storage.from("assistance-photos").getPublicUrl(filePath);

        // 3. Salvar referência na tabela assistance_photos
        const { error: dbError } = await supabase
          .from("assistance_photos")
          .insert([
            {
              assistance_id: assistanceId,
              category: category.toLowerCase(), // Garantir que a categoria está em minúsculas
              photo_url: pubUrl?.publicUrl || "",
              uploaded_by: "admin", // Adaptar se for fornecedor
            } as Omit<AssistancePhoto, "id" | "uploaded_at">,
          ]);

        if (dbError) {
          toast.error(`Erro ao guardar na base de dados: ${dbError.message}`);
          continue;
        }
      }

      toast.success("Upload(s) concluído(s) com sucesso!");
      if (onUploadCompleted) onUploadCompleted();
    } catch (error: any) {
      toast.error(`Erro desconhecido: ${error?.message || "Erro inesperado."}`);
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
        accept="image/*"
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
    </div>
  );
}
