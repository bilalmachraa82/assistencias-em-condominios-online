
import React, { useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAssistanceMessages, useSendAssistanceMessage } from "@/hooks/useAssistanceMessages";

type AssistanceMessagesSectionProps = {
  assistanceId: number;
  currentUser: { role: "admin" | "supplier"; name: string };
};

export default function AssistanceMessagesSection({ assistanceId, currentUser }: AssistanceMessagesSectionProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: messages, isLoading, error } = useAssistanceMessages(assistanceId);
  const { mutate: sendMessage, isPending: isSending } = useSendAssistanceMessage();

  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(
      {
        assistance_id: assistanceId,
        sender_role: currentUser.role,
        sender_name: currentUser.name,
        message: message.trim(),
      },
      {
        onSuccess: () => {
          setMessage("");
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        },
        onError: (err: any) => {
          toast.error("Erro ao enviar mensagem: " + (err?.message || 'erro desconhecido'));
        }
      }
    );
  };

  return (
    <div className="rounded-lg p-4 bg-white/5 border border-white/10">
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2 text-cyan-200">
        <MessageCircle className="w-4 h-4" /> Conversa interna
      </h3>
      <div className="max-h-48 overflow-y-auto mb-3 bg-white/10 rounded p-2">
        {isLoading ? (
          <div className="text-xs text-gray-400">A carregar mensagens...</div>
        ) : error ? (
          <div className="text-xs text-red-400">Erro ao carregar mensagens.</div>
        ) : messages && messages.length > 0 ? (
          <ul className="space-y-2">
            {messages.map(msg => (
              <li
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender_role === currentUser.role ? "items-end" : "items-start"
                }`}
              >
                <div className={`px-3 py-1 rounded text-xs ${
                  msg.sender_role === "admin" ? "bg-indigo-600 text-white" : "bg-teal-600 text-white"
                }`}>
                  <div className="font-semibold">
                    {msg.sender_name}
                    <span className="ml-1 text-[0.7em] text-gray-200/60">({msg.sender_role})</span>
                  </div>
                  <div className="whitespace-pre-wrap mt-1">{msg.message}</div>
                </div>
                <span className="text-[0.65em] text-gray-400 mt-1">
                  {new Date(msg.created_at).toLocaleString("pt-PT")}
                </span>
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>
        ) : (
          <div className="text-xs text-gray-400 italic">Nenhuma mensagem ainda.</div>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="text-white"
          placeholder="Escreva uma mensagem..."
          onKeyDown={e => (e.key === "Enter" ? handleSend() : undefined)}
          disabled={isSending}
        />
        <Button onClick={handleSend} disabled={isSending || !message.trim()} className="bg-cyan-800 hover:bg-cyan-700 text-white">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
