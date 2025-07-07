
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAssistanceMessages, useSendAssistanceMessage } from "@/hooks/useAssistanceMessages";

interface SupplierMessagesProps {
  assistanceId: number;
  supplierName: string;
}

export default function SupplierMessages({ assistanceId, supplierName }: SupplierMessagesProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState("");

  const { data: messages, isLoading, error } = useAssistanceMessages(assistanceId);
  const { mutate: sendMessage, isPending: isSending } = useSendAssistanceMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    // Enhanced input sanitization
    const sanitizedMessage = message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 1000);
    
    if (!sanitizedMessage) return;
    
    sendMessage(
      {
        assistance_id: assistanceId,
        sender_role: "supplier",
        sender_name: supplierName,
        message: sanitizedMessage,
      },
      {
        onSuccess: () => {
          setMessage("");
        },
        onError: (err: any) => {
          toast.error("Erro ao enviar mensagem: " + (err?.message || 'erro desconhecido'));
        }
      }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
        <MessageCircle className="w-4 h-4" />
        Mensagens com o Administrador
      </h3>
      
      <div className="max-h-48 overflow-y-auto mb-3 bg-gray-50 rounded p-3 min-h-[100px]">
        {isLoading ? (
          <div className="text-xs text-gray-400">A carregar mensagens...</div>
        ) : error ? (
          <div className="text-xs text-red-500">Erro ao carregar mensagens.</div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender_role === "supplier" ? "items-end" : "items-start"
                }`}
              >
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                  msg.sender_role === "admin" 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-green-100 text-green-800"
                }`}>
                  <div className="font-semibold mb-1">
                    {msg.sender_name}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                </div>
                <span className="text-[0.65em] text-gray-400 mt-1">
                  {new Date(msg.created_at).toLocaleString("pt-PT")}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic text-center py-4">
            Nenhuma mensagem ainda. Envie uma mensagem para começar a conversa.
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 1000))} // Limit input length
          placeholder="Escreva uma mensagem..."
          onKeyDown={e => (e.key === "Enter" ? handleSend() : undefined)}
          disabled={isSending}
          className="text-sm"
          maxLength={1000}
        />
        <Button 
          onClick={handleSend} 
          disabled={isSending || !message.trim()}
          size="sm"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
