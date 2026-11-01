import React from "react";
import { ArrowLeft, Eye, History, Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

export function VersionHistory({
  versions = [],
  currentVersion = 0,
  viewingVersion = null,
  isLoading = false,
  onViewVersion,
  onBackToCurrent,
  onRestoreVersion
}) {
  const orderedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="size-4 text-primary" />
            Version history
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            View, compare, and restore saved versions of this project.
          </p>
        </div>
        {viewingVersion !== null && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onBackToCurrent}>
            <ArrowLeft className="size-3.5" />
            Back to current
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading versions...
            </div>
          ) : orderedVersions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No version history yet.
            </div>
          ) : (
            orderedVersions.map(version => {
              const isCurrent = version.versionNumber === currentVersion;
              const isViewing = version.versionNumber === viewingVersion;
              return (
                <div
                  key={version.versionNumber}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    isViewing
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60 bg-card/40 hover:border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          v{version.versionNumber}
                        </span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase">
                          {String(version.type || "unknown").toLowerCase()}
                        </Badge>
                        {isCurrent && (
                          <Badge className="px-1.5 py-0 text-[10px] uppercase">current</Badge>
                        )}
                        {version.restoredFrom != null && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            from v{version.restoredFrom}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs text-foreground/90">
                        {version.prompt || "No prompt recorded"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {version.fileCount ?? 0} files
                        {version.model ? ` · ${version.model}` : ""}
                        {" · "}
                        {formatDate(version.createdAt)}
                      </p>
                      {Array.isArray(version.changedFiles) && version.changedFiles.length > 0 && (
                        <p className="mt-1 truncate text-[10px] text-muted-foreground/70">
                          Changed: {version.changedFiles.slice(0, 4).join(", ")}
                          {version.changedFiles.length > 4 ? ` +${version.changedFiles.length - 4} more` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant={isViewing ? "secondary" : "outline"}
                          className="gap-1 text-xs"
                          onClick={() => onViewVersion?.(version.versionNumber)}
                        >
                          <Eye className="size-3.5" />
                          {isViewing ? "Viewing" : "View"}
                        </Button>
                      )}
                      {isViewing && (
                        <Button
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={onRestoreVersion}
                        >
                          <RotateCcw className="size-3.5" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
