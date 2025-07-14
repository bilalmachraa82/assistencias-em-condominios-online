import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceCategory } from '@/types/database';

export const useServiceCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('urgency_level', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching service categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    try {
      // Obter organização padrão
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('service_categories')
        .insert({
          ...categoryData,
          organization_id: orgData.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      console.error('Error creating service category:', err);
      return { success: false, error: err };
    }
  };

  const updateCategory = async (id: string, updateData: Partial<ServiceCategory>) => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(category => 
          category.id === id ? data : category
        )
      );
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating service category:', err);
      return { success: false, error: err };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(category => category.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting service category:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};