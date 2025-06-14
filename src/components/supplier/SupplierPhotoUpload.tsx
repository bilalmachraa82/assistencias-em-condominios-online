
import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Camera, X } from "lucide-react";
import { toast } from "sonner";

interface SupplierPhotoUploadProps {
  assistanceId: number;
  category: string;
  categoryLabel: string;
  onUploadCompleted?: () => void;
}

export default function SupplierPhotoUpload({
  assistanceId,
  category,
  categoryLabel,
  onUploadCompleted,
}: SupplierPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Create preview URLs
    const newPreviews: string[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviews.push(url);
      }
    });
    setPreviewImages(newPreviews);
  };

  const handleUpload = async () => {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) {
      toast.error('Por favor, selecione pelo menos uma foto');
      return;
    }

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        const ext = file.name.split('.').pop();
        const filePath = `assistances/${assistanceId}/${category}/${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 6)}.${ext}`;

        // Upload to storage
        const { data: storageData, error: uploadError } = await supabase.storage
          .from("assistance-photos")
          .upload(filePath, file, { upsert: false });

        if (uploadError) {
          toast.error(`Erro ao fazer upload: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: pubUrl } = supabase.storage
          .from("assistance-photos")
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from("assistance_photos")
          .insert([
            {
              assistance_id: assistanceId,
              category,
              photo_url: pubUrl?.publicUrl || "",
              uploaded_by: "supplier",
            },
          ]);

        if (dbError) {
          toast.error(`Erro ao guardar na base de dados: ${dbError.message}`);
          continue;
        }
      }

      toast.success("Fotos enviadas com sucesso!");
      setPreviewImages([]);
      if (inputRef.current) inputRef.current.value = "";
      if (onUploadCompleted) onUploadCompleted();
    } catch (error: any) {
      toast.error(`Erro: ${error?.message || "Erro inesperado"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreviews = () => {
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Camera className="h-4 w-4" />
        {categoryLabel}
      </h3>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Selecionar Fotos
        </Button>
      )}
    </div>
  );
}
