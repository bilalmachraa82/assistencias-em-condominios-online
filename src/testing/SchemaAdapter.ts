/**
 * Schema Adapter - Maps old schema references to new ones
 * Provides automatic mapping between legacy and current database schema
 */

export class SchemaAdapter {
  // Table name mappings
  static readonly TABLE_MAPPINGS = {
    assistances: 'service_requests',
    suppliers: 'contractors', 
    intervention_types: 'service_categories',
    assistance_messages: 'service_communications',
    assistance_photos: 'service_attachments'
  } as const;

  // Status mappings (Portuguese to English)
  static readonly STATUS_MAPPINGS = {
    'Pendente Resposta Inicial': 'submitted',
    'Aceite': 'assigned',
    'Agendado': 'scheduled',
    'Em Progresso': 'in_progress',
    'Concluído': 'completed',
    'Cancelado': 'cancelled'
  } as const;

  // Reverse status mappings (English to Portuguese)
  static readonly REVERSE_STATUS_MAPPINGS = {
    submitted: 'Pendente Resposta Inicial',
    assigned: 'Aceite',
    scheduled: 'Agendado',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  } as const;

  /**
   * Maps old table name to new table name
   */
  static mapTableName(oldTable: string): string {
    return this.TABLE_MAPPINGS[oldTable as keyof typeof this.TABLE_MAPPINGS] || oldTable;
  }

  /**
   * Maps Portuguese status to English
   */
  static mapStatus(status: string): string {
    return this.STATUS_MAPPINGS[status as keyof typeof this.STATUS_MAPPINGS] || status;
  }

  /**
   * Maps English status to Portuguese
   */
  static mapStatusReverse(status: string): string {
    return this.REVERSE_STATUS_MAPPINGS[status as keyof typeof this.REVERSE_STATUS_MAPPINGS] || status;
  }

  /**
   * Maps old field names to new field names
   */
  static mapFields(data: Record<string, any>): Record<string, any> {
    const mapped = { ...data };

    // Map supplier_id to contractor_id
    if ('supplier_id' in mapped) {
      mapped.contractor_id = mapped.supplier_id;
      delete mapped.supplier_id;
    }

    // Map intervention_type_id to category_id
    if ('intervention_type_id' in mapped) {
      mapped.category_id = mapped.intervention_type_id;
      delete mapped.intervention_type_id;
    }

    // Map assistance_id to service_request_id
    if ('assistance_id' in mapped) {
      mapped.service_request_id = mapped.assistance_id;
      delete mapped.assistance_id;
    }

    // Map status if it exists
    if ('status' in mapped && typeof mapped.status === 'string') {
      mapped.status = this.mapStatus(mapped.status);
    }

    return mapped;
  }

  /**
   * Converts number ID to UUID string (for compatibility)
   */
  static convertId(id: number | string): string {
    if (typeof id === 'number') {
      // Generate a deterministic UUID from number for testing
      return `00000000-0000-4000-8000-${id.toString().padStart(12, '0')}`;
    }
    return id;
  }
}