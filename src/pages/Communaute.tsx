import { TabbedPage } from "@/components/TabbedPage";

const tabs = ["Fil d'actualité", "Recommandations", "Évènements littéraires", "Club de lecteurs"];

const Communaute = () => (
  <TabbedPage title="Communauté" tabs={tabs} defaultTab={tabs[0]} />
);

export default Communaute;
