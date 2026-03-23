import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sun } from "lucide-react";

export function AppearanceSettings() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Thème</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dark ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
            <Label className="text-base font-normal">{dark ? "Mode sombre" : "Mode clair"}</Label>
          </div>
          <Switch checked={dark} onCheckedChange={setDark} />
        </div>
      </CardContent>
    </Card>
  );
}
