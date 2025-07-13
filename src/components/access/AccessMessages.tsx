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

interface Message {
  id: number;
  message: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
}

interface AccessMessagesProps {
  assistanceId: number;
  onUpdate: () => void;
}

export default function AccessMessages({ assistanceId, onUpdate }: AccessMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [assistanceId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance_messages')
        .select('*')
        .eq('assistance_id', assistanceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
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
        .from('assistance_messages')
        .insert({
          assistance_id: assistanceId,
          message: newMessage.trim(),
          sender_name: senderName.trim(),
          sender_role: 'supplier'
        });

      if (error) throw error;
      
      setNewMessage('');
      toast.success('Mensagem enviada');
      fetchMessages();
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
            {/* Messages List */}
            <div className="max-h-80 overflow-y-auto space-y-3 p-3 bg-gradient-subtle rounded-lg border">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">Inicie a conversa enviando uma mensagem</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg shadow-soft transition-all hover:shadow-medium ${
                      message.sender_role === 'supplier' 
                        ? 'bg-primary/10 border-l-4 border-primary ml-6' 
                        : 'bg-background border-l-4 border-muted mr-6'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-foreground">
                        {message.sender_name}
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          ({message.sender_role === 'supplier' ? 'Fornecedor' : 'Administrador'})
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{message.message}</p>
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