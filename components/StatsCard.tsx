import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = "text-gold-400",
  subtitle,
}: StatsCardProps) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg bg-muted p-3 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
