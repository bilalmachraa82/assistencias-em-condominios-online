
import { supabase } from "@/integrations/supabase/client";
import { HealthCheck } from '@/types/healthCheck';

export const runStorageCheck = async (setChecks: React.Dispatch<React.SetStateAction<HealthCheck[]>>) => {
  try {
    // 1. Verificar se conseguimos listar buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;
    
    const hasAssistancePhotos = buckets?.some(bucket => bucket.name === 'assistance-photos');
    const totalBuckets = buckets?.length || 0;
    
    if (!hasAssistancePhotos) {
      setChecks(prev => prev.map(check => 
        check.name === 'Storage' 
          ? { 
              ...check, 
              status: 'error' as const, 
              message: 'Bucket "assistance-photos" não encontrado',
              count: totalBuckets
            }
          : check
      ));
      return;
    }

    // 2. Verificar se conseguimos obter informações do bucket
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('assistance-photos');
    if (bucketError) throw bucketError;

    // 3. Tentar fazer uma operação simples no bucket (listar ficheiros)
    const { data: files, error: filesError } = await supabase.storage
      .from('assistance-photos')
      .list('', { limit: 1 });
      
    if (filesError) {
      console.warn('Warning listing files:', filesError);
    }
    
    const isPublic = bucket?.public ? 'público' : 'privado';
    
    setChecks(prev => prev.map(check => 
      check.name === 'Storage' 
        ? { 
            ...check, 
            status: 'healthy' as const, 
            message: `Bucket "assistance-photos" OK (${isPublic}). Total: ${totalBuckets} bucket(s).`,
            count: totalBuckets
          }
        : check
    ));
  } catch (error: any) {
    setChecks(prev => prev.map(check => 
      check.name === 'Storage' 
        ? { ...check, status: 'error' as const, message: `Erro ao verificar storage: ${error.message}` }
        : check
    ));
  }
};
