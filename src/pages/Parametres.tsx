import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Palette, Bell, Shield, Database } from "lucide-react";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { DataSettings } from "@/components/settings/DataSettings";
import { ScrollArea } from "@/components/ui/scroll-area";

const sections = [
  { key: "account", label: "Mon compte", icon: User },
  { key: "appearance", label: "Apparence", icon: Palette },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Confidentialité", icon: Shield },
  { key: "data", label: "Données", icon: Database },
] as const;

type SectionKey = (typeof sections)[number]["key"];

const Parametres = () => {
  const [active, setActive] = useState<SectionKey>("account");

  const renderContent = () => {
    switch (active) {
      case "account": return <AccountSettings />;
      case "appearance": return <AppearanceSettings />;
      case "notifications": return <NotificationSettings />;
      case "privacy": return <PrivacySettings />;
      case "data": return <DataSettings />;
    }
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar nav */}
      <nav className="w-56 shrink-0 border-r border-border py-6 pr-4 pl-6 hidden md:block">
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.key}>
              <button
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active === s.key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile tabs */}
      <div className="md:hidden flex gap-1 bg-muted rounded-lg p-1 mx-4 mt-4 mb-2 shrink-0 overflow-x-auto absolute top-0 left-0 right-0 z-10">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors whitespace-nowrap",
              active === s.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl py-6 px-6 md:px-10 md:pt-6 pt-14">
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Parametres;
