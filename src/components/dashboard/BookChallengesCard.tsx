import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trophy } from "lucide-react";

interface BookChallenge {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
}

// Placeholder: will be replaced with real data from "Ma quête littéraire → Défis livresques"
const activeChallenges: BookChallenge[] = [];

export function BookChallengesCard() {
  return (
    <Card className="rounded-lg border border-border bg-card p-4 flex flex-col min-h-[220px] max-h-[320px]">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <Trophy className="h-4 w-4" />
        <span>Défis livresques en cours</span>
      </div>

      {activeChallenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-1">
          <p className="text-sm text-muted-foreground text-center">Aucun défi livresque en cours</p>
          <p className="text-xs text-muted-foreground text-center">
            Découvrez vos défis dans Ma quête littéraire → Défis livresques
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {activeChallenges.map((challenge, i) => (
              <div key={challenge.id}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center gap-3">
                  <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight flex-1 min-w-0">
                    {challenge.name}
                  </p>
                  <div className="w-28 shrink-0 space-y-0.5">
                    <Progress
                      value={challenge.targetValue > 0 ? (challenge.currentValue / challenge.targetValue) * 100 : 0}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {challenge.currentValue}/{challenge.targetValue}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
