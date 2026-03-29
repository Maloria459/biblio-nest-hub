import { TabbedPage } from "@/components/TabbedPage";
import { Trophy, Gift, Sparkles } from "lucide-react";
import { RecompensesContent } from "@/components/RecompensesContent";
import type { TabItem } from "@/components/BottomTabBar";

const tabs: TabItem[] = [
  { label: "Défis livresques", icon: Trophy },
  { label: "Récompenses", icon: Gift },
  { label: "Bibliotik", icon: Sparkles },
];

const tabContent: Record<string, React.ReactNode> = {
  "Récompenses": <RecompensesContent />,
};

const Aventure = () => (
  <TabbedPage tabs={tabs} defaultTab={tabs[0].label} tabContent={tabContent} />
);

export default Aventure;
