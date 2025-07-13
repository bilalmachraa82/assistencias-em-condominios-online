import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Photo {
  id: number;
  photo_url: string;
  category: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

interface AccessPhotosProps {
  assistanceId: number;
  onUpdate: () => void;
}

const PHOTO_CATEGORIES = [
  { value: 'problema', label: 'Problema Inicial' },
  { value: 'progresso', label: 'Durante a Intervenção' },
  { value: 'resultado', label: 'Resultado Final' },
  { value: 'outros', label: 'Outros' }
];

export default function AccessPhotos({ assistanceId, onUpdate }: AccessPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('progresso');
  const [uploaderName, setUploaderName] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, [assistanceId]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance_photos')
        .select('*')
        .eq('assistance_id', assistanceId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Erro ao carregar fotos');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!uploaderName.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    try {
      setUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${assistanceId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assistance-photos')
        .upload(`assistances/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assistance-photos')
        .getPublicUrl(`assistances/${fileName}`);

      // Save to database
      const { error: dbError } = await supabase
        .from('assistance_photos')
        .insert({
          assistance_id: assistanceId,
          photo_url: publicUrl,
          category: selectedCategory,
          uploaded_by: uploaderName.trim()
        });

      if (dbError) throw dbError;

      toast.success('Foto enviada com sucesso');
      fetchPhotos();
      onUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  };

  const getCategoryLabel = (category: string) => {
    return PHOTO_CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Form */}
            <div className="space-y-3 p-3 border rounded-lg">
              <Input
                placeholder="Seu nome"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
              />
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading || !uploaderName.trim()}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button 
                    variant="outline" 
                    className="w-full cursor-pointer"
                    disabled={uploading || !uploaderName.trim()}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? 'Enviando...' : 'Selecionar Foto'}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Photos Grid */}
            <div>
              {photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma foto enviada ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={photo.photo_url}
                          alt={getCategoryLabel(photo.category)}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(photo.photo_url, '_blank')}
                        />
                      </div>
                      <div className="text-xs">
                        <p className="font-medium">{getCategoryLabel(photo.category)}</p>
                        {photo.uploaded_by && (
                          <p className="text-muted-foreground">por {photo.uploaded_by}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}