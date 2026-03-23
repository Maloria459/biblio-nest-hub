import { TabbedPage } from "@/components/TabbedPage";
import { Trophy, Sparkles } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";

const tabs: TabItem[] = [
  { label: "Défis livresques", icon: Trophy },
  { label: "Bibliotik", icon: Sparkles },
];

const tabContent: Record<string, React.ReactNode> = {};

const Aventure = () => (
  <TabbedPage tabs={tabs} defaultTab={tabs[0].label} tabContent={tabContent} />
);

export default Aventure;
