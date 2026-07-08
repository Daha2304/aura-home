import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Download, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { downloadBackupFile, exportBackup } from "@/services/storage/backup";

export const Route = createFileRoute("/_app/settings/backup")({
  component: BackupSettings,
});

function BackupSettings() {
  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader
        title="Backup & Restore"
        subtitle="Konfiguration sichern und wiederherstellen"
      />
      <GlassPanel className="space-y-3">
        <div>
          <div className="text-sm font-semibold">Export</div>
          <div className="mb-3 text-xs text-muted-foreground">
            Lade eine JSON-Datei mit deinen Einstellungen herunter.
          </div>
          <GlassButton
            variant="primary"
            size="md"
            onClick={() => downloadBackupFile(exportBackup())}
          >
            <Download className="h-4 w-4" /> Backup exportieren
          </GlassButton>
        </div>
        <div className="pt-3 border-t border-white/10">
          <div className="text-sm font-semibold">Import</div>
          <div className="mb-3 text-xs text-muted-foreground">
            Wähle eine zuvor exportierte Datei. (Wird mit Live-Server aktiviert.)
          </div>
          <GlassButton variant="ghost" size="md" disabled>
            <Upload className="h-4 w-4" /> Backup importieren
          </GlassButton>
        </div>
      </GlassPanel>
    </>
  );
}
