import { TabbedPage } from "@/components/TabbedPage";
import { User, Target, BarChart3, Clock } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";
import { ReadingSessionsContent } from "@/components/ReadingSessionsContent";
import { ProfileContent } from "@/components/ProfileContent";
import { StatistiquesContent } from "@/components/StatistiquesContent";

const tabs: TabItem[] = [
  { label: "Profil", icon: User },
  { label: "Mes objectifs personnels", icon: Target },
  { label: "Mes statistiques", icon: BarChart3 },
  { label: "Mes sessions de lecture", icon: Clock },
];

const Profil = () => (
  <TabbedPage
    tabs={tabs}
    defaultTab={tabs[0].label}
    tabContent={{
      "Profil": <ProfileContent />,
      "Mes statistiques": <StatistiquesContent />,
      "Mes sessions de lecture": <ReadingSessionsContent />,
    }}
  />
);

export default Profil;
