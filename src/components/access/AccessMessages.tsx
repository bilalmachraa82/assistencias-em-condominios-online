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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Mensagens
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
            <div className="max-h-64 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhuma mensagem ainda
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.sender_role === 'supplier' 
                        ? 'bg-primary/10 ml-4' 
                        : 'bg-muted mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Send Message Form */}
            <div className="space-y-3 pt-3 border-t">
              <Input
                placeholder="Seu nome"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={sendMessage}
                disabled={sending || !newMessage.trim() || !senderName.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}