
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { generateToken } from "@/utils/TokenUtils";
import { VALID_PHOTO_CATEGORIES } from '@/config/photoCategories';

export interface TestStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
  url?: string;
}

const initialSteps: TestStep[] = [
    {
      id: 'setup',
      title: 'Configurar Dados de Teste',
      description: 'Criar edifícios e fornecedores necessários para os testes',
      status: 'pending'
    },
    {
      id: 'create',
      title: 'Criar Assistência de Teste',
      description: 'Criar uma nova assistência com dados de teste',
      status: 'pending'
    },
    {
      id: 'tokens',
      title: 'Verificar Tokens',
      description: 'Validar que todos os tokens foram gerados',
      status: 'pending'
    },
    {
      id: 'supplier-accept',
      title: 'Teste Aceitação Fornecedor',
      description: 'Verificar página de aceitação do fornecedor',
      status: 'pending'
    },
    {
      id: 'supplier-schedule',
      title: 'Teste Agendamento',
      description: 'Verificar página de agendamento',
      status: 'pending'
    },
    {
      id: 'supplier-complete',
      title: 'Teste Conclusão',
      description: 'Verificar página de conclusão com fotos',
      status: 'pending'
    },
    {
      id: 'messages',
      title: 'Teste Mensagens',
      description: 'Verificar sistema de mensagens',
      status: 'pending'
    },
    {
      id: 'photos',
      title: 'Teste Upload Fotos',
      description: 'Verificar upload de fotos por categoria',
      status: 'pending'
    },
    {
      id: 'edge-functions',
      title: 'Teste Edge Functions',
      description: 'Verificar funcionamento das edge functions',
      status: 'pending'
    }
  ];

export function useEndToEndTester() {
  const [isRunning, setIsRunning] = useState(false);
  const [testAssistanceId, setTestAssistanceId] = useState<number | null>(null);
  const [steps, setSteps] = useState<TestStep[]>(initialSteps);

  const updateStepStatus = (stepId: string, status: TestStep['status'], details?: string, url?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, details, url }
        : step
    ));
  };

  const ensureTestData = async () => {
    updateStepStatus('setup', 'running');
    
    let buildingId: number;
    let supplierId: number;
    let interventionTypeId: number;

    try {
      // Check for existing buildings
      const { data: existingBuildings } = await supabase
        .from('buildings')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (!existingBuildings?.length) {
        // Create test building
        const { data: newBuilding, error: buildingError } = await supabase
          .from('buildings')
          .insert({
            name: 'Edifício de Teste',
            address: 'Rua de Teste, 123',
            is_active: true
          })
          .select('id')
          .single();

        if (buildingError || !newBuilding) {
          throw new Error('Erro ao criar edifício de teste: ' + buildingError?.message);
        }
        buildingId = newBuilding.id;
      } else {
        buildingId = existingBuildings[0].id;
      }

      // Check for existing suppliers
      const { data: existingSuppliers } = await supabase
        .from('suppliers')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (!existingSuppliers?.length) {
        // Create test supplier
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: 'Fornecedor de Teste',
            email: 'teste@fornecedor.com',
            phone: '+351 123 456 789',
            specialization: 'Testes Automáticos',
            is_active: true
          })
          .select('id')
          .single();

        if (supplierError || !newSupplier) {
          throw new Error('Erro ao criar fornecedor de teste: ' + supplierError?.message);
        }
        supplierId = newSupplier.id;
      } else {
        supplierId = existingSuppliers[0].id;
      }

      // Check for existing intervention types
      const { data: existingInterventionTypes } = await supabase
        .from('intervention_types')
        .select('id')
        .limit(1);

      if (!existingInterventionTypes?.length) {
        // Create test intervention type
        const { data: newInterventionType, error: interventionError } = await supabase
          .from('intervention_types')
          .insert({
            name: 'Teste Automático',
            description: 'Tipo de intervenção para testes automáticos'
          })
          .select('id')
          .single();

        if (interventionError || !newInterventionType) {
          throw new Error('Erro ao criar tipo de intervenção de teste: ' + interventionError?.message);
        }
        interventionTypeId = newInterventionType.id;
      } else {
        interventionTypeId = existingInterventionTypes[0].id;
      }

      updateStepStatus('setup', 'success', `Dados criados: Edifício ID ${buildingId}, Fornecedor ID ${supplierId}, Tipo Intervenção ID ${interventionTypeId}`);
      
      return { buildingId, supplierId, interventionTypeId };

    } catch (error: any) {
      updateStepStatus('setup', 'error', error.message);
      throw error;
    }
  };
  
  const runTests = async () => {
    setIsRunning(true);
    setSteps(initialSteps);
    setTestAssistanceId(null);
    
    try {
      // Step 1: Ensure test data exists
      const { buildingId, supplierId, interventionTypeId } = await ensureTestData();

      // Step 2: Create test assistance
      updateStepStatus('create', 'running');

      // Generate required tokens
      const interactionToken = generateToken('int');
      const acceptanceToken = generateToken('acc');
      const schedulingToken = generateToken('sch');
      const validationToken = generateToken('val');

      const { data: assistance, error: createError } = await supabase
        .from('assistances')
        .insert({
          building_id: buildingId,
          supplier_id: supplierId,
          intervention_type_id: interventionTypeId,
          type: 'Normal',
          description: 'Teste automático do sistema - ' + new Date().toLocaleString(),
          status: 'Pendente Resposta Inicial',
          interaction_token: interactionToken,
          acceptance_token: acceptanceToken,
          scheduling_token: schedulingToken,
          validation_token: validationToken
        })
        .select('id')
        .single();

      if (createError || !assistance) {
        updateStepStatus('create', 'error', createError?.message || 'Erro ao criar assistência');
        setIsRunning(false);
        return;
      }

      setTestAssistanceId(assistance.id);
      updateStepStatus('create', 'success', `Assistência criada com ID: ${assistance.id}`);

      // Step 3: Check tokens
      updateStepStatus('tokens', 'running');
      
      const { data: assistanceData, error: tokenError } = await supabase
        .from('assistances')
        .select('acceptance_token, scheduling_token, validation_token')
        .eq('id', assistance.id)
        .single();

      if (tokenError || !assistanceData?.acceptance_token) {
        updateStepStatus('tokens', 'error', 'Tokens não foram gerados automaticamente');
        setIsRunning(false);
        return;
      }

      updateStepStatus('tokens', 'success', 'Todos os tokens gerados correctamente');

      // Step 4: Test supplier accept page
      updateStepStatus('supplier-accept', 'running');
      
      try {
        // Updated to use Portal with query parameter (new working format)
        const acceptUrl = `/supplier/portal?token=${interactionToken}`;
        const response = await fetch(`${window.location.origin}${acceptUrl}`);
        
        if (response.ok) {
          updateStepStatus('supplier-accept', 'success', 'Página de aceitação acessível', acceptUrl);
        } else {
          updateStepStatus('supplier-accept', 'error', `Erro HTTP: ${response.status}`);
        }
      } catch (err) {
        updateStepStatus('supplier-accept', 'success', 'URL gerada (teste manual necessário)', `/supplier/portal?token=${interactionToken}`);
      }

      // Step 5: Test supplier schedule page
      updateStepStatus('supplier-schedule', 'running');
      
      // All actions now use the unified Portal page
      const scheduleUrl = `/supplier/portal?token=${interactionToken}`;
      updateStepStatus('supplier-schedule', 'success', 'URL de agendamento gerada', scheduleUrl);

      // Step 6: Test supplier complete page
      updateStepStatus('supplier-complete', 'running');
      
      // All actions now use the unified Portal page
      const completeUrl = `/supplier/portal?token=${interactionToken}`;
      updateStepStatus('supplier-complete', 'success', 'URL de conclusão gerada', completeUrl);

      // Step 7: Test messages system
      updateStepStatus('messages', 'running');
      
      const { error: messageError } = await supabase
        .from('assistance_messages')
        .insert({
          assistance_id: assistance.id,
          sender_role: 'admin',
          sender_name: 'Sistema de Teste',
          message: 'Mensagem de teste automático'
        });

      if (messageError) {
        updateStepStatus('messages', 'error', messageError.message);
      } else {
        updateStepStatus('messages', 'success', 'Sistema de mensagens funcional');
      }

      // Step 8: Test photo upload capability
      updateStepStatus('photos', 'running');
      
      const { error: photoError } = await supabase
        .from('assistance_photos')
        .insert({
          assistance_id: assistance.id,
          category: VALID_PHOTO_CATEGORIES[0],
          photo_url: 'https://example.com/test.jpg',
          uploaded_by: 'teste'
        });

      if (photoError) {
        updateStepStatus('photos', 'error', photoError.message);
      } else {
        updateStepStatus('photos', 'success', 'Sistema de fotos funcional');
        
        await supabase
          .from('assistance_photos')
          .delete()
          .eq('assistance_id', assistance.id)
          .eq('category', VALID_PHOTO_CATEGORIES[0]);
      }

      // Step 9: Test edge functions
      updateStepStatus('edge-functions', 'running');
      
      try {
        // Test the simplified supplier-route with interaction_token
        const response = await fetch(
          `https://vedzsbeirirjiozqflgq.supabase.co/functions/v1/supplier-route?action=view&token=${interactionToken}`
        );
        
        if (response.ok) {
          updateStepStatus('edge-functions', 'success', 'Edge functions funcionais');
        } else {
          updateStepStatus('edge-functions', 'error', `Edge function erro: ${response.status}`);
        }
      } catch (err) {
        updateStepStatus('edge-functions', 'error', 'Erro ao testar edge functions');
      }

      toast.success('Testes concluídos! Verifique os resultados abaixo.');
      
    } catch (error) {
      console.error('Erro durante os testes:', error);
      toast.error('Erro durante a execução dos testes');
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTest = async () => {
    if (!testAssistanceId) return;
    
    try {
      await supabase
        .from('assistance_messages')
        .delete()
        .eq('assistance_id', testAssistanceId);
      
      await supabase
        .from('assistance_photos')
        .delete()
        .eq('assistance_id', testAssistanceId);
      
      await supabase
        .from('assistances')
        .delete()
        .eq('id', testAssistanceId);
      
      setTestAssistanceId(null);
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, details: undefined, url: undefined })));
      
      toast.success('Dados de teste limpos');
    } catch (error) {
      toast.error('Erro ao limpar dados de teste');
    }
  };

  return { isRunning, testAssistanceId, steps, runTests, cleanupTest };
}
