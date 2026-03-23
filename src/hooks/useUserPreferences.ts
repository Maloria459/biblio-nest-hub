import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  notify_reading_reminders: boolean;
  notify_objectives: boolean;
  notify_community: boolean;
  profile_public: boolean;
  show_stats: boolean;
  show_library: boolean;
}

const DEFAULTS: Omit<UserPreferences, "id" | "user_id"> = {
  theme: "light",
  notify_reading_reminders: true,
  notify_objectives: true,
  notify_community: true,
  profile_public: true,
  show_stats: true,
  show_library: true,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["user_preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: inserted, error: insertErr } = await supabase
          .from("user_preferences")
          .insert({ user_id: user!.id, ...DEFAULTS })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return inserted as UserPreferences;
      }

      return data as UserPreferences;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserPreferences, "id" | "user_id">>) => {
      const { error } = await supabase
        .from("user_preferences")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_preferences", user?.id] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les préférences.", variant: "destructive" });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: updateMutation.mutate,
  };
}
