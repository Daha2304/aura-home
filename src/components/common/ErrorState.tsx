import { AlertTriangle } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";

interface Props {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export function ErrorState({
  title = "Etwas ist schief gelaufen",
  message,
  action,
}: Props) {
  return (
    <GlassPanel className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {message && (
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        )}
      </div>
      {action}
    </GlassPanel>
  );
}
