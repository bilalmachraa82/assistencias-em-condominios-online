
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeleteAssistanceResult, validateDeleteAssistanceResult } from "@/types/assistance";
import { toast } from "sonner";

/**
 * Hook único para remoção robusta de assistências com logs profundos e feedback.
 */
export function useDeleteAssistance(onDeleted?: (id: number) => void) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAssistance = async (assistance: any) => {
    setIsDeleting(true);
    console.log("🔍 [delete] Iniciando remoção via useDeleteAssistance para:", assistance.id);

    try {
      const { data: resultRaw, error: rpcError } = await supabase
        .rpc("delete_assistance_safely", { p_assistance_id: assistance.id });

      if (rpcError) {
        console.error("❌ [delete] delete_assistance_safely: erro na chamada RPC:", rpcError);
        toast.error(rpcError.message || "Erro ao executar a função de eliminação.");
        setIsDeleting(false);
        return false;
      }

      let deleteResult: DeleteAssistanceResult;
      try {
        deleteResult = validateDeleteAssistanceResult(resultRaw);
      } catch (err) {
        console.error("❌ [delete] Falha ao interpretar a resposta da eliminação:", err, resultRaw);
        toast.error("Erro inesperado ao validar resposta Supabase.");
        setIsDeleting(false);
        return false;
      }

      if (!deleteResult.success) {
        console.error("❌ [delete] Função de eliminação retornou falha:", deleteResult.error);
        toast.error(deleteResult.error || "Erro ao eliminar assistência.");
        setIsDeleting(false);
        return false;
      }

      // Confirmar remoção consultando a base de dados
      const { data: confirm, error: confirmError } = await supabase
        .from("assistances")
        .select("id")
        .eq("id", assistance.id)
        .maybeSingle();

      if (confirmError) {
        console.warn("⚠️ [delete] Warning: Erro ao verificar se assistência existe:", confirmError);
        toast.warning("Eliminado, mas não possível confirmar. Reveja logs.");
      } else if (confirm) {
        console.error("💥 [delete] CRÍTICO: Assistência ainda existe após eliminação!");
        toast.error("Erro crÍtico: assistência ainda está presente na base de dados!");
        setIsDeleting(false);
        return false;
      }

      // Sucesso absoluto
      console.log("✅ [delete] Assistência removida com sucesso:", assistance.id);
      toast.success(`Assistência #${assistance.id} eliminada!`);
      if (onDeleted) onDeleted(assistance.id);
      setIsDeleting(false);
      return true;

    } catch (error) {
      console.error("💣 [delete] Exceção na eliminação:", error, assistance);
      toast.error("Erro inesperado ao eliminar assistência.");
      setIsDeleting(false);
      return false;
    }
  };

  return { deleteAssistance, isDeleting };
}
