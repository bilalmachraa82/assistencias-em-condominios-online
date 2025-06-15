
import { supabase } from "@/integrations/supabase/client";
import { HealthCheck } from '@/types/healthCheck';

export const runStorageCheck = async (setChecks: React.Dispatch<React.SetStateAction<HealthCheck[]>>) => {
  try {
    // 1. First, try to create the bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;
    
    const hasAssistancePhotos = buckets?.some(bucket => bucket.name === 'assistance-photos');
    
    // Create the bucket if it doesn't exist
    if (!hasAssistancePhotos) {
      const { error: createError } = await supabase.storage.createBucket('assistance-photos', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        setChecks(prev => prev.map(check => 
          check.name === 'Storage' 
            ? { 
                ...check, 
                status: 'error' as const, 
                message: `Erro ao criar bucket: ${createError.message}`
              }
            : check
        ));
        return;
      }
    }

    // 2. Recheck buckets after potential creation
    const { data: updatedBuckets, error: recheckError } = await supabase.storage.listBuckets();
    if (recheckError) throw recheckError;
    
    const finalBucketCheck = updatedBuckets?.some(bucket => bucket.name === 'assistance-photos');
    const totalBuckets = updatedBuckets?.length || 0;
    
    if (!finalBucketCheck) {
      setChecks(prev => prev.map(check => 
        check.name === 'Storage' 
          ? { 
              ...check, 
              status: 'error' as const, 
              message: 'Bucket "assistance-photos" não encontrado e não foi possível criar',
              count: totalBuckets
            }
          : check
      ));
      return;
    }

    // 3. Verify bucket configuration
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('assistance-photos');
    if (bucketError) throw bucketError;

    // 4. Test bucket access with a simple list operation
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
