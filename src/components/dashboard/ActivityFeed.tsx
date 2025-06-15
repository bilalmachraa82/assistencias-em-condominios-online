
import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ActivityFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["activity-log-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("id, description, actor, timestamp")
        .order("timestamp", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000, // atualiza feed a cada 15s
  });

  return (
    <Card className="glass-card">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Atividade Recente</h2>
        {isLoading && (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="animate-spin w-5 h-5 mr-2" />
            <span>Carregando...</span>
          </div>
        )}
        {error && (
          <div className="text-red-500">Erro ao carregar atividades</div>
        )}
        {!isLoading && !error && (
          <ul className="space-y-4 text-base">
            {data && data.length > 0 ? (
              data.map((item) => (
                <li
                  key={item.id}
                  className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center"
                >
                  <span>
                    <span className="text-[#9b87f5] font-medium">{item.actor}</span>:{" "}
                    {item.description}
                  </span>
                  <span className="text-[#cbd5e1] text-sm" title={item.timestamp}>
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </li>
              ))
            ) : (
              <li className="p-3 text-center text-muted-foreground">Nenhuma atividade recente encontrada.</li>
            )}
          </ul>
        )}
      </div>
    </Card>
  );
}
