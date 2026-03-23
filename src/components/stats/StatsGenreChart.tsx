import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface GenreData {
  name: string;
  value: number;
}

interface Props {
  data: GenreData[];
}

const COLORS = [
  "hsl(var(--foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--foreground) / 0.7)",
  "hsl(var(--muted-foreground) / 0.6)",
  "hsl(var(--foreground) / 0.4)",
  "hsl(var(--muted-foreground) / 0.4)",
  "hsl(var(--foreground) / 0.25)",
  "hsl(var(--muted-foreground) / 0.25)",
];

export function StatsGenreChart({ data }: Props) {
  const config = Object.fromEntries(data.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Répartition par genre</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ChartContainer config={config} className="h-[200px] w-[200px] aspect-square">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-2 justify-center">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-medium text-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
