import { TabbedPage } from "@/components/TabbedPage";

const tabs = ["Profil", "Mes objectifs personnels", "Mes statistiques", "Mes sessions de lecture"];

const Profil = () => (
  <TabbedPage title="Mon profil" tabs={tabs} defaultTab={tabs[0]} />
);

export default Profil;
