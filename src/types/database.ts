// NOVOS TIPOS BASEADOS NA NOVA ESTRUTURA DE BASE DE DADOS
// Seguindo melhores práticas da indústria

export type ServicePriority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency';

export type ServiceStatus = 
  | 'submitted'     // Submetido
  | 'assigned'      // Atribuído  
  | 'scheduled'     // Agendado
  | 'in_progress'   // Em progresso
  | 'completed'     // Concluído
  | 'cancelled';    // Cancelado

// Organização (Multi-tenant ready)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Categorias de Serviços (Padronizado)
export interface ServiceCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color_code: string;
  urgency_level: number; // 1-5
  estimated_duration_hours?: number;
  requires_photo: boolean;
  requires_access_permission: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Edifícios (Melhorado)
export interface Building {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country: string;
  tax_number?: string;
  cadastral_reference?: string;
  coordinates?: string; // PostGIS POINT
  total_units?: number;
  building_type?: string;
  construction_year?: number;
  insurance_info: Record<string, any>;
  emergency_contacts: any[];
  access_instructions?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Contratadores/Fornecedores (Melhorado)
export interface Contractor {
  id: string;
  organization_id: string;
  name: string;
  company_name?: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  tax_number?: string;
  license_number?: string;
  insurance_info: Record<string, any>;
  certifications: string[];
  specializations: string[]; // UUIDs das categorias
  rating: number; // 0.00-5.00
  total_jobs_completed: number;
  response_time_hours?: number;
  hourly_rate?: number;
  emergency_available: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Solicitações de Serviço (Core Business)
export interface ServiceRequest {
  id: string;
  organization_id: string;
  building_id: string;
  category_id: string;
  contractor_id?: string;
  
  // Identificação
  request_number: string; // SRV-2025-0001
  title: string;
  description: string;
  location_details?: string;
  
  // Classificação
  priority: ServicePriority;
  status: ServiceStatus;
  urgency_score: number; // 1-10
  
  // Agendamento
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration_hours?: number;
  
  // Tracking
  submitted_by?: string;
  submitted_contact?: string;
  access_token: string; // Token único para acesso
  
  // Datas importantes
  created_at: string;
  updated_at: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  
  // Metadados
  metadata: Record<string, any>;
}

// Comunicações (Event Sourcing)
export interface ServiceCommunication {
  id: string;
  service_request_id: string;
  
  // Conteúdo
  message: string;
  message_type: string; // comment, status_change, assignment, etc
  
  // Autor
  author_name: string;
  author_role: string; // admin, contractor, tenant, system
  author_contact?: string;
  
  // Visibilidade
  is_internal: boolean;
  is_visible_to_contractor: boolean;
  is_visible_to_tenant: boolean;
  
  // Timestamps
  created_at: string;
  
  // Metadados
  metadata: Record<string, any>;
}

// Anexos/Fotos
export interface ServiceAttachment {
  id: string;
  service_request_id: string;
  
  // Arquivo
  file_name: string;
  file_path: string; // Storage path
  file_size?: number;
  file_type: string;
  mime_type?: string;
  
  // Categorização
  attachment_type: string; // photo, document, receipt, etc
  category?: string; // before, during, after, invoice, etc
  description?: string;
  
  // Autor
  uploaded_by: string;
  uploaded_role: string;
  
  // Timestamps
  created_at: string;
  
  // Metadados
  metadata: Record<string, any>;
}

// Auditoria Completa (Event Sourcing)
export interface AuditEvent {
  id: string;
  
  // Contexto
  organization_id?: string;
  service_request_id?: string;
  
  // Evento
  event_type: string; // create, update, delete, status_change, assignment, etc
  entity_type: string; // service_request, communication, attachment, etc
  entity_id?: string;
  
  // Ator
  actor_id?: string; // UUID do user ou 'system'
  actor_name: string;
  actor_role: string;
  actor_ip?: string;
  
  // Dados
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changes?: Record<string, any>; // Computed diff
  
  // Timestamp
  created_at: string;
  
  // Metadados
  metadata: Record<string, any>;
}

// User Roles (Compatibilidade)
export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// Tipos compostos para visualizações
export interface ServiceRequestWithRelations extends ServiceRequest {
  building?: Building;
  contractor?: Contractor;
  category?: ServiceCategory;
  communications?: ServiceCommunication[];
  attachments?: ServiceAttachment[];
}

export interface ContractorWithStats extends Contractor {
  active_requests_count?: number;
  completed_requests_count?: number;
  average_completion_time?: number;
  last_activity?: string;
}

export interface BuildingWithStats extends Building {
  active_requests_count?: number;
  total_requests_count?: number;
  last_service_date?: string;
}

// Tipos para dashboards e relatórios
export interface DashboardStats {
  total_requests: number;
  pending_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  overdue_requests: number;
  average_response_time: number;
  top_categories: Array<{
    category: string;
    count: number;
  }>;
  top_contractors: Array<{
    contractor: string;
    completed_count: number;
    rating: number;
  }>;
}

// Filtros avançados
export interface ServiceRequestFilters {
  status?: ServiceStatus[];
  priority?: ServicePriority[];
  building_ids?: string[];
  contractor_ids?: string[];
  category_ids?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  urgency_min?: number;
  urgency_max?: number;
}

// Estados para formulários
export interface CreateServiceRequestData {
  building_id: string;
  category_id: string;
  title: string;
  description: string;
  location_details?: string;
  priority: ServicePriority;
  urgency_score: number;
  submitted_by?: string;
  submitted_contact?: string;
  metadata?: Record<string, any>;
}

export interface UpdateServiceRequestData {
  contractor_id?: string;
  status?: ServiceStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration_hours?: number;
  metadata?: Record<string, any>;
}

// Constantes para mapear estados
export const SERVICE_STATUS_LABELS: Record<ServiceStatus, { pt: string; en: string; color: string }> = {
  submitted: { pt: 'Submetido', en: 'Submitted', color: '#f59e0b' },
  assigned: { pt: 'Atribuído', en: 'Assigned', color: '#3b82f6' },
  scheduled: { pt: 'Agendado', en: 'Scheduled', color: '#6366f1' },
  in_progress: { pt: 'Em Progresso', en: 'In Progress', color: '#06b6d4' },
  completed: { pt: 'Concluído', en: 'Completed', color: '#10b981' },
  cancelled: { pt: 'Cancelado', en: 'Cancelled', color: '#6b7280' }
};

export const SERVICE_PRIORITY_LABELS: Record<ServicePriority, { pt: string; en: string; color: string }> = {
  low: { pt: 'Baixa', en: 'Low', color: '#6b7280' },
  normal: { pt: 'Normal', en: 'Normal', color: '#3b82f6' },
  high: { pt: 'Alta', en: 'High', color: '#eab308' },
  urgent: { pt: 'Urgente', en: 'Urgent', color: '#f97316' },
  emergency: { pt: 'Emergência', en: 'Emergency', color: '#ef4444' }
};

// Utility types
export type ServiceRequestStatus = keyof typeof SERVICE_STATUS_LABELS;
export type ServiceRequestPriority = keyof typeof SERVICE_PRIORITY_LABELS;