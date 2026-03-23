import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences } = useUserPreferences();

  if (isLoading || !preferences) return null;

  const items = [
    { key: "notify_reading_reminders" as const, label: "Rappels de lecture", desc: "Recevoir des rappels pour maintenir votre rythme de lecture" },
    { key: "notify_objectives" as const, label: "Objectifs atteints", desc: "Être notifié lorsque vous atteignez un objectif personnel" },
    { key: "notify_community" as const, label: "Événements communautaires", desc: "Notifications pour les événements du club de lecture" },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Notifications</h3>
        <p className="text-sm text-muted-foreground mb-6">Ces paramètres seront utilisés lorsque les notifications seront disponibles.</p>
        <div className="space-y-5">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-normal">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={preferences[item.key]}
                onCheckedChange={(val) => updatePreferences({ [item.key]: val })}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
