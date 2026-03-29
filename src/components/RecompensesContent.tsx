import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Coins, Palette } from "lucide-react";

const rewardTabs = [
  {
    key: "badges",
    icon: Award,
    label: "Badges",
    desc: "Débloquez des badges en accomplissant des défis et objectifs. Chaque badge représente une étape franchie dans votre parcours de lecteur.",
  },
  {
    key: "virtual_currency",
    icon: Coins,
    label: "Monnaie virtuelle",
    desc: "Gagnez de la monnaie virtuelle pour vos accomplissements. Utilisez-la pour débloquer du contenu exclusif et des fonctionnalités bonus.",
  },
  {
    key: "customization",
    icon: Palette,
    label: "Personnalisation",
    desc: "Débloquez des options de personnalisation pour votre interface : thèmes, icônes et bien plus encore.",
  },
] as const;

export function RecompensesContent() {
  const [activeTab, setActiveTab] = useState<string>(rewardTabs[0].key);
  const current = rewardTabs.find((t) => t.key === activeTab)!;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Segmented toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {rewardTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-colors ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content for active tab */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <current.icon className="h-6 w-6 mt-0.5 shrink-0 text-primary" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">{current.label}</h3>
                <p className="text-sm text-muted-foreground">{current.desc}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucune récompense pour le moment</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complétez des défis pour débloquer vos premières récompenses
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
