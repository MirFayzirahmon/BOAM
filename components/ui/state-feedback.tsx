"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateFeedbackProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function StateFeedback({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: StateFeedbackProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-8 text-center",
        className
      )}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button size="sm" variant="outline" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
