import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceCommunication } from '@/types/database';

interface AccessMessagesProps {
  serviceRequestId: string;
  onUpdate: () => void;
}

export default function AccessMessages({ serviceRequestId, onUpdate }: AccessMessagesProps) {
  const [communications, setCommunications] = useState<ServiceCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    fetchCommunications();
  }, [serviceRequestId]);

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('service_communications')
        .select('*')
        .eq('service_request_id', serviceRequestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCommunications((data || []).map(item => ({
        ...item,
        metadata: item.metadata as Record<string, any> || {}
      })));
    } catch (error) {
      console.error('Error fetching communications:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !senderName.trim()) {
      toast.error('Por favor, preencha nome e mensagem');
      return;
    }

    try {
      setSending(true);
      
      const { error } = await supabase
        .from('service_communications')
        .insert({
          service_request_id: serviceRequestId,
          message: newMessage.trim(),
          author_name: senderName.trim(),
          author_role: 'contractor',
          message_type: 'comment',
          is_internal: false,
          is_visible_to_contractor: true,
          is_visible_to_tenant: true,
          metadata: {}
        });

      if (error) throw error;
      
      setNewMessage('');
      toast.success('Mensagem enviada');
      fetchCommunications();
      onUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="glass-card h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Comunicação
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Communications List */}
            <div className="max-h-80 overflow-y-auto space-y-3 p-3 bg-gradient-subtle rounded-lg border">
              {communications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">Inicie a conversa enviando uma mensagem</p>
                </div>
              ) : (
                communications.map((communication) => (
                  <div
                    key={communication.id}
                    className={`p-4 rounded-lg shadow-soft transition-all hover:shadow-medium ${
                      communication.author_role === 'contractor' 
                        ? 'bg-primary/10 border-l-4 border-primary ml-6' 
                        : 'bg-background border-l-4 border-muted mr-6'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-foreground">
                        {communication.author_name}
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          ({communication.author_role === 'contractor' ? 'Fornecedor' : 'Administrador'})
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(communication.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{communication.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Send Message Form */}
            <div className="space-y-4 p-4 bg-gradient-subtle border rounded-lg">
              <h4 className="font-medium text-foreground">Enviar Nova Mensagem</h4>
              <Input
                placeholder="Seu nome completo"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="bg-background border-2 focus:border-primary transition-colors"
              />
              <Textarea
                placeholder="Digite sua mensagem aqui..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                className="bg-background border-2 focus:border-primary transition-colors resize-none"
              />
              <Button 
                onClick={sendMessage}
                disabled={sending || !newMessage.trim() || !senderName.trim()}
                className="w-full h-12 premium-button text-base"
              >
                <Send className="h-5 w-5 mr-2" />
                {sending ? 'Enviando Mensagem...' : 'Enviar Mensagem'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}