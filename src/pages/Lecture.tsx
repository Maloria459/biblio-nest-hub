import { TabbedPage } from "@/components/TabbedPage";
import { BookOpen, Layers, FolderOpen, Handshake, Clock } from "lucide-react";
import type { TabItem } from "@/components/BottomTabBar";
import { BibliothequeContent } from "@/components/BibliothequeContent";
import { PileALireContent } from "@/components/PileALireContent";
import { LoanRegistryContent } from "@/components/LoanRegistryContent";
import { ReadingSessionsContent } from "@/components/ReadingSessionsContent";

const tabs: TabItem[] = [
  { label: "Ma bibliothèque", icon: BookOpen },
  { label: "Ma pile à lire", icon: Layers },
  { label: "Mes collections", icon: FolderOpen },
  { label: "Mes sessions", icon: Clock },
  { label: "Registre des prêts", icon: Handshake },
];

const Lecture = () => (
  <TabbedPage
    tabs={tabs}
    defaultTab={tabs[0].label}
    tabContent={{
      "Ma bibliothèque": <BibliothequeContent />,
      "Ma pile à lire": <PileALireContent />,
      "Mes sessions": <ReadingSessionsContent />,
      "Registre des prêts": <LoanRegistryContent />,
    }}
  />
);

export default Lecture;
