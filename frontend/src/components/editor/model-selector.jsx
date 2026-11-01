import React from "react";
import { Check, ChevronDown, Lock, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  MODELS,
  PROVIDER_LABELS,
  PROVIDER_ORDER,
  getModelById,
  getQualityLabel,
  getSpeedLabel
} from "@/lib/models";

export function ModelSelector({
  selectedModelId,
  onModelChange,
  userPlan,
  disabled = false
}) {
  const selectedModel = getModelById(selectedModelId) || MODELS[0];
  const isPro = String(userPlan || "").toLowerCase() === "pro";

  const handleSelect = model => {
    const locked = model.tier === "premium" && !isPro;
    if (locked) {
      toast.error("This model requires a Pro plan.", {
        description: "Upgrade in Settings to unlock premium models."
      });
      return;
    }
    if (model.id !== selectedModelId) {
      onModelChange?.(model.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 gap-1.5 rounded-full border border-border/60 bg-card px-2.5 text-[11px] font-medium"
        >
          <Sparkles className="size-3 text-primary" />
          <span className="max-w-[140px] truncate">{selectedModel.name}</span>
          {selectedModel.tier === "premium" && (
            <Badge variant="secondary" className="h-4 px-1 text-[9px] uppercase">
              Pro
            </Badge>
          )}
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[420px] w-72 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between text-xs">
          <span>AI model</span>
          <span className="font-normal text-muted-foreground">
            {isPro ? "Pro plan" : "Free plan"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROVIDER_ORDER.map(provider => {
          const providerModels = MODELS.filter(model => model.provider === provider);
          if (providerModels.length === 0) return null;
          return (
            <React.Fragment key={provider}>
              <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {PROVIDER_LABELS[provider] || provider}
              </div>
              {providerModels.map(model => {
                const isSelected = model.id === selectedModelId;
                const locked = model.tier === "premium" && !isPro;
                return (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => handleSelect(model)}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 py-2",
                      locked && "opacity-70"
                    )}
                  >
                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                      {isSelected ? (
                        <Check className="size-3.5 text-primary" />
                      ) : locked ? (
                        <Lock className="size-3 text-muted-foreground" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-medium">{model.name}</span>
                        {model.tier === "premium" && (
                          <Badge variant="secondary" className="h-4 px-1 text-[9px] uppercase">
                            Pro
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                        {model.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground/80">
                        <span className="flex items-center gap-0.5">
                          <Zap className="size-2.5" />
                          {getSpeedLabel(model.speed) || "Fast"}
                        </span>
                        <span>{getQualityLabel(model.quality) || "Good"} quality</span>
                        <span>{model.creditCost} credit{model.creditCost === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
