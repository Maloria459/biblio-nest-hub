import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export function PrivacySettings() {
  const { preferences, isLoading, updatePreferences } = useUserPreferences();

  if (isLoading || !preferences) return null;

  const items = [
    { key: "profile_public" as const, label: "Profil public", desc: "Permettre aux autres utilisateurs de voir votre profil" },
    { key: "show_stats" as const, label: "Afficher les statistiques", desc: "Rendre vos statistiques de lecture visibles sur votre profil" },
    { key: "show_library" as const, label: "Afficher la bibliothèque", desc: "Rendre votre bibliothèque visible sur votre profil" },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Confidentialité</h3>
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
