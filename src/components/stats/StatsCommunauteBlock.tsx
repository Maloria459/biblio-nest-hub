import { Calendar, Users, MessageSquare } from "lucide-react";

interface Props {
  literaryEventsCount: number;
  clubEventsCount: number;
  publicationsCount: number;
}

function StatItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export function StatsCommunauteBlock(props: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">🤝 Communauté</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatItem icon={Calendar} label="Événements littéraires" value={String(props.literaryEventsCount)} />
        <StatItem icon={Users} label="Événements du club" value={String(props.clubEventsCount)} />
        <StatItem icon={MessageSquare} label="Publications" value={String(props.publicationsCount)} />
      </div>
    </div>
  );
}
