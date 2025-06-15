
export interface HealthCheck {
  name: string;
  icon: React.ReactNode;
  status: 'checking' | 'healthy' | 'warning' | 'error';
  message: string;
  count?: number;
}

export type HealthCheckStatus = HealthCheck['status'];
