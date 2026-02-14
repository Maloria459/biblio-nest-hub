import { TabbedPage } from "@/components/TabbedPage";
import { Newspaper, ThumbsUp, CalendarDays, UsersRound } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";

const tabs: TabItem[] = [
  { label: "Fil d'actualité", icon: Newspaper },
  { label: "Recommandations", icon: ThumbsUp },
  { label: "Évènements littéraires", icon: CalendarDays },
  { label: "Club de lecteurs", icon: UsersRound },
];

const Communaute = () => (
  <TabbedPage tabs={tabs} defaultTab={tabs[0].label} />
);

export default Communaute;
