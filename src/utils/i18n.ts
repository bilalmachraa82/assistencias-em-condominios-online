// Simple internationalization utility

type TranslationKey = string;
type Language = 'pt-BR' | 'en-US';

const translations: Record<Language, Record<TranslationKey, string>> = {
  'pt-BR': {
    // Status translations
    'status.pendingInitialResponse': 'Pendente Resposta Inicial',
    'status.pendingAcceptance': 'Pendente Aceitação',
    'status.rejected': 'Recusada',
    'status.pendingScheduling': 'Pendente Agendamento',
    'status.scheduled': 'Agendado',
    'status.inProgress': 'Em Andamento',
    'status.pendingValidation': 'Pendente Validação',
    'status.completed': 'Concluído',
    'status.rescheduleRequested': 'Reagendamento Solicitado',
    'status.canceled': 'Cancelado',
    
    // General UI translations
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.noResults': 'Nenhum resultado encontrado',
    
    // Assistance related translations
    'assistance.new': 'Nova Assistência',
    'assistance.list': 'Listagem de Assistências',
    'assistance.details': 'Detalhes da Assistência',
    'assistance.description': 'Descrição',
    'assistance.status': 'Status',
    'assistance.building': 'Edifício',
    'assistance.supplier': 'Fornecedor',
    'assistance.type': 'Tipo',
    'assistance.createdAt': 'Data de Criação',
    'assistance.scheduledDate': 'Data Agendada',
    
    // Error messages
    'error.invalidToken': 'Token inválido ou expirado',
    'error.serverError': 'Erro de servidor. Tente novamente mais tarde.',
    'error.validationError': 'Erro de validação. Verifique os dados informados.',
    'error.connectionError': 'Erro de conexão. Verifique sua internet.',
  },
  'en-US': {
    // Status translations
    'status.pendingInitialResponse': 'Pending Initial Response',
    'status.pendingAcceptance': 'Pending Acceptance',
    'status.rejected': 'Rejected',
    'status.pendingScheduling': 'Pending Scheduling',
    'status.scheduled': 'Scheduled',
    'status.inProgress': 'In Progress',
    'status.pendingValidation': 'Pending Validation',
    'status.completed': 'Completed',
    'status.rescheduleRequested': 'Reschedule Requested',
    'status.canceled': 'Canceled',
    
    // General UI translations
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.noResults': 'No results found',
    
    // Assistance related translations
    'assistance.new': 'New Assistance',
    'assistance.list': 'Assistance List',
    'assistance.details': 'Assistance Details',
    'assistance.description': 'Description',
    'assistance.status': 'Status',
    'assistance.building': 'Building',
    'assistance.supplier': 'Supplier',
    'assistance.type': 'Type',
    'assistance.createdAt': 'Created At',
    'assistance.scheduledDate': 'Scheduled Date',
    
    // Error messages
    'error.invalidToken': 'Invalid or expired token',
    'error.serverError': 'Server error. Please try again later.',
    'error.validationError': 'Validation error. Please check your data.',
    'error.connectionError': 'Connection error. Please check your internet connection.',
  }
};

// Get current language from browser or localStorage
const getCurrentLanguage = (): Language => {
  // Try to get from localStorage first
  const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
  if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en-US')) {
    return savedLanguage;
  }
  
  // Otherwise use browser language
  const browserLanguage = navigator.language;
  return browserLanguage.startsWith('pt') ? 'pt-BR' : 'en-US';
};

// Set language preference
export const setLanguage = (language: Language): void => {
  localStorage.setItem('preferredLanguage', language);
};

// Get translation for a key
export const t = (key: TranslationKey, fallback?: string): string => {
  const language = getCurrentLanguage();
  return translations[language]?.[key] || fallback || key;
};

// Get all available languages
export const getAvailableLanguages = (): Language[] => {
  return ['pt-BR', 'en-US'];
};

// Export current language for components to use
export const getCurrentLanguageCode = (): Language => {
  return getCurrentLanguage();
};
