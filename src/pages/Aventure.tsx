import { TabbedPage } from "@/components/TabbedPage";
import { TrendingUp, Trophy, Sparkles } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";
import { ProgressionContent } from "@/components/ProgressionContent";

const tabs: TabItem[] = [
  { label: "Ma progression", icon: TrendingUp },
  { label: "Défis livresques", icon: Trophy },
  { label: "Bibliotik", icon: Sparkles },
];

const tabContent: Record<string, React.ReactNode> = {
  "Ma progression": <ProgressionContent />,
};

const Aventure = () => (
  <TabbedPage tabs={tabs} defaultTab={tabs[0].label} tabContent={tabContent} />
);

export default Aventure;
