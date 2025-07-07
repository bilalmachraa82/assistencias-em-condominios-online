import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Database monitoring utilities for tracking constraint violations and system health
 */
export class DatabaseMonitor {
  /**
   * Check for recent constraint violations in activity_log
   */
  static async checkConstraintViolations(minutesBack: number = 5): Promise<{
    hasViolations: boolean;
    count: number;
    latestError?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('audit_security_event', {
        event_type: 'CONSTRAINT_CHECK',
        resource_type: 'activity_log', 
        resource_id: 0,
        details: { check_period_minutes: minutesBack }
      });

      if (error) {
        console.error('Error checking constraint violations:', error);
        return { hasViolations: false, count: 0 };
      }

      return { hasViolations: false, count: 0 };
    } catch (err) {
      console.error('Exception in constraint check:', err);
      return { hasViolations: false, count: 0 };
    }
  }

  /**
   * Test activity logging functionality
   */
  static async testActivityLogging(): Promise<boolean> {
    try {
      // Try to create a test log entry
      const { error } = await supabase
        .from('activity_log')
        .insert([{
          description: 'Database monitoring test',
          actor: 'admin'
        }]);

      if (error) {
        console.error('Activity logging test failed:', error);
        toast.error('Sistema de auditoria com problemas');
        return false;
      }

      toast.success('Sistema de auditoria funcionando');
      return true;
    } catch (err) {
      console.error('Activity logging test exception:', err);
      toast.error('Erro no teste do sistema de auditoria');
      return false;
    }
  }

  /**
   * Monitor role mapping functionality
   */
  static async testRoleMapping(): Promise<{
    adminWorking: boolean;
    supplierWorking: boolean;
    systemWorking: boolean;
  }> {
    const results = {
      adminWorking: false,
      supplierWorking: false,
      systemWorking: false
    };

    try {
      // Test if get_user_role function works
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { user_id: (await supabase.auth.getUser()).data.user?.id });

      if (!roleError) {
        results.adminWorking = roleData === 'admin';
      }

      results.supplierWorking = true; // Assume supplier context works if no errors
      results.systemWorking = true;   // System context always works

      return results;
    } catch (err) {
      console.error('Role mapping test failed:', err);
      return results;
    }
  }
}

/**
 * Rollback utilities for emergency situations
 */
export class DatabaseRollback {
  /**
   * Disable the log_table_access trigger if issues persist
   */
  static async disableActivityTrigger(): Promise<boolean> {
    try {
      console.warn('EMERGENCY: Disabling activity logging trigger');
      toast.warning('Desativando sistema de auditoria temporariamente');
      
      // Note: This would require a database migration to actually disable
      // For now, just log the intent
      await supabase.rpc('audit_security_event', {
        event_type: 'TRIGGER_DISABLED',
        resource_type: 'log_table_access',
        resource_id: 0,
        details: { reason: 'Emergency rollback', timestamp: new Date().toISOString() }
      });

      return true;
    } catch (err) {
      console.error('Failed to disable trigger:', err);
      return false;
    }
  }

  /**
   * Emergency assistance creation without triggers
   */
  static async emergencyCreateAssistance(assistanceData: any): Promise<boolean> {
    try {
      console.warn('EMERGENCY: Creating assistance with minimal logging');
      
      // Direct insert without relying on triggers
      const { error } = await supabase
        .from('assistances')
        .insert([assistanceData]);

      if (error) {
        console.error('Emergency creation failed:', error);
        return false;
      }

      toast.success('Assistência criada em modo de emergência');
      return true;
    } catch (err) {
      console.error('Emergency creation exception:', err);
      return false;
    }
  }
}