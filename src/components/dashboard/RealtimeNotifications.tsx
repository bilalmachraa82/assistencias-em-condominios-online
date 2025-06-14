
import React from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRealtimeAssistances } from "@/hooks/useRealtimeAssistances";
import { supabase } from "@/integrations/supabase/client";

export default function RealtimeNotifications() {
  const [isConnected, setIsConnected] = React.useState(true);
  const [notifications, setNotifications] = React.useState<Array<{
    id: string;
    message: string;
    timestamp: Date;
    type: 'info' | 'success' | 'warning';
  }>>([]);

  // Enable realtime updates
  useRealtimeAssistances();

  React.useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('connection-status');
    
    channel
      .on('system', {}, (payload) => {
        if (payload.extension === 'presence') {
          setIsConnected(payload.status === 'joined');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <Bell className="h-4 w-4 ml-1" />
          {notifications.length > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Notificações em Tempo Real</h4>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          
          {notifications.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-2 border rounded text-sm"
                >
                  <p>{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.timestamp.toLocaleTimeString('pt-PT')}
                  </p>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearNotifications}
                className="w-full"
              >
                Limpar Todas
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma notificação recente
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
