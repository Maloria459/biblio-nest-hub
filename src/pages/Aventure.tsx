import { TabbedPage } from "@/components/TabbedPage";
import { TrendingUp, Trophy, Sparkles } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";

const tabs: TabItem[] = [
  { label: "Ma progression", icon: TrendingUp },
  { label: "Défis livresques", icon: Trophy },
  { label: "Bibliotik", icon: Sparkles },
];

const Aventure = () => (
  <TabbedPage tabs={tabs} defaultTab={tabs[0].label} />
);

export default Aventure;
