import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Coins, Palette } from "lucide-react";
import { useState } from "react";

const rewardTypes = [
  {
    key: "badges",
    icon: Award,
    label: "Badges",
    desc: "Débloquer des badges en accomplissant des défis et objectifs",
  },
  {
    key: "virtual_currency",
    icon: Coins,
    label: "Monnaie virtuelle",
    desc: "Gagner de la monnaie virtuelle pour vos accomplissements",
  },
  {
    key: "customization",
    icon: Palette,
    label: "Personnalisation de l'application",
    desc: "Débloquer des options de personnalisation pour votre interface",
  },
] as const;

export function RecompensesContent() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    badges: true,
    virtual_currency: true,
    customization: true,
  });

  const toggle = (key: string) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Récompenses</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez les types de récompenses que vous souhaitez activer.
        </p>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {rewardTypes.map((rt) => (
              <div key={rt.key} className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <rt.icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-base font-normal">{rt.label}</Label>
                    <p className="text-sm text-muted-foreground">{rt.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={enabled[rt.key]}
                  onCheckedChange={() => toggle(rt.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
