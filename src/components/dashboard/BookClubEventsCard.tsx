import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, MapPin } from "lucide-react";

interface BookClubEvent {
  id: string;
  event_name: string;
  location: string | null;
  event_date: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function BookClubEventsCard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<BookClubEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("book_club_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data as BookClubEvent[]);
      });
  }, [user?.id]);

  return (
    <Card className="rounded-lg border border-border bg-card p-4 flex flex-col min-h-[200px] max-h-[300px]">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <Users className="h-4 w-4" />
        <span>Prochain(s) événement(s) du Club</span>
      </div>

      {events.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {events.map((evt, i) => (
              <div key={evt.id}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center gap-3">
                  <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight flex-1 min-w-0">
                    {evt.event_name}
                  </p>
                  {evt.location ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <MapPin className="h-3 w-3" /> {evt.location}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">En ligne</span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {formatDate(evt.event_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">Aucun événement de club à venir</p>
        </div>
      )}
    </Card>
  );
}
