"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ArrowLeft, Settings, Pencil, Trash2, HelpCircle, Palette, Check, Monitor, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "../Theme-Provider";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const THEME_OPTIONS = [{
  value: "light",
  label: "Light",
  icon: Sun
}, {
  value: "dark",
  label: "Dark",
  icon: Moon
}, {
  value: "system",
  label: "System",
  icon: Monitor
}];
export function ProjectMenu({
  projectName,
  projectId,
  creditsRemaining,
  creditsTotal = 50,
  userPlan,
  onRename,
  onDelete
}) {
  const navigate = useNavigate();
  const {
    theme,
    setTheme
  } = useTheme();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(projectName || "");
  const renameInputRef = useRef(null);
  const isUnlimited = creditsRemaining === -1;
  const isPro = String(userPlan || "").toLowerCase() === "pro";
  const displayRemaining = isUnlimited ? creditsTotal : creditsRemaining ?? 0;
  const progressPercent = isUnlimited ? 100 : creditsTotal > 0 ? displayRemaining / creditsTotal * 100 : 0;
  useEffect(() => {
    setRenameValue(projectName);
  }, [projectName]);
  useEffect(() => {
    if (!isRenameOpen) return;
    const timer = setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 50);
    return () => clearTimeout(timer);
  }, [isRenameOpen]);
  function handleRenameConfirm() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== projectName) {
      onRename(trimmed);
    }
    setIsRenameOpen(false);
  }
  function handleRenameKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameConfirm();
    }
    if (e.key === "Escape") {
      setIsRenameOpen(false);
    }
  }
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsxs(DropdownMenu, {
      children: [/*#__PURE__*/_jsx(DropdownMenuTrigger, {
        asChild: true,
        children: /*#__PURE__*/_jsxs("button", {
          className: "flex cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-accent/50 sm:px-1.5",
          children: [/*#__PURE__*/_jsx("span", {
            className: "max-w-[80px] truncate text-sm font-medium sm:max-w-[180px] sm:text-base",
            children: projectName
          }), /*#__PURE__*/_jsx(ChevronDown, {
            className: "size-3 text-muted-foreground sm:size-3.5"
          })]
        })
      }), /*#__PURE__*/_jsxs(DropdownMenuContent, {
        align: "start",
        className: "w-64",
        children: [/*#__PURE__*/_jsxs(DropdownMenuItem, {
          onClick: () => navigate("/dashboard"),
          children: [/*#__PURE__*/_jsx(ArrowLeft, {
            className: "mr-2 size-4"
          }), "Go to Dashboard"]
        }), /*#__PURE__*/_jsx(DropdownMenuSeparator, {}), /*#__PURE__*/_jsxs("div", {
          className: "flex items-center gap-3 px-2 py-2",
          children: [/*#__PURE__*/_jsx("div", {
            className: "size-8 rounded-full bg-secondary"
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex flex-col",
            children: [/*#__PURE__*/_jsx("span", {
              className: "text-sm font-medium",
              children: "User"
            }), /*#__PURE__*/_jsx(Badge, {
              variant: "secondary",
              className: "mt-0.5 w-fit text-[10px] px-1.5 py-0",
              children: isPro ? "Pro plan" : "Free plan"
            })]
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "px-2 pb-2",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex items-center justify-between text-xs text-muted-foreground mb-1",
            children: [/*#__PURE__*/_jsx("span", {
              children: "Credits"
            }), /*#__PURE__*/_jsx("span", {
              children: isUnlimited ? "Unlimited" : `${creditsRemaining ?? 0} / ${creditsTotal}`
            })]
          }), !isUnlimited && /*#__PURE__*/_jsx("div", {
            className: "h-1.5 w-full rounded-full bg-secondary",
            children: /*#__PURE__*/_jsx("div", {
              className: "h-1.5 rounded-full bg-primary transition-all duration-300",
              style: {
                width: `${Math.min(100, progressPercent)}%`
              }
            })
          })]
        }), /*#__PURE__*/_jsx(DropdownMenuSeparator, {}), /*#__PURE__*/_jsxs(DropdownMenuItem, {
          onClick: () => navigate("/settings"),
          children: [/*#__PURE__*/_jsx(Settings, {
            className: "mr-2 size-4"
          }), "Settings"]
        }), /*#__PURE__*/_jsxs(DropdownMenuItem, {
          onClick: () => setIsRenameOpen(true),
          children: [/*#__PURE__*/_jsx(Pencil, {
            className: "mr-2 size-4"
          }), "Rename project"]
        }), /*#__PURE__*/_jsxs(DropdownMenuSub, {
          children: [/*#__PURE__*/_jsxs(DropdownMenuSubTrigger, {
            children: [/*#__PURE__*/_jsx(Palette, {
              className: "mr-2 size-4"
            }), "Appearance"]
          }), /*#__PURE__*/_jsx(DropdownMenuSubContent, {
            children: THEME_OPTIONS.map(option => /*#__PURE__*/_jsxs(DropdownMenuItem, {
              onClick: () => setTheme(option.value),
              children: [/*#__PURE__*/_jsx(option.icon, {
                className: "mr-2 size-4"
              }), option.label, theme === option.value && /*#__PURE__*/_jsx(Check, {
                className: "ml-auto size-3.5 text-primary"
              })]
            }, option.value))
          })]
        }), /*#__PURE__*/_jsx(DropdownMenuSeparator, {}), /*#__PURE__*/_jsxs(DropdownMenuItem, {
          onClick: () => setIsDeleteOpen(true),
          className: "text-destructive",
          children: [/*#__PURE__*/_jsx(Trash2, {
            className: "mr-2 size-4"
          }), "Delete project"]
        }), /*#__PURE__*/_jsx(DropdownMenuSeparator, {}), /*#__PURE__*/_jsxs(DropdownMenuItem, {
          onClick: () => navigate("/settings"),
          children: [/*#__PURE__*/_jsx(HelpCircle, {
            className: "mr-2 size-4"
          }), "Help"]
        })]
      })]
    }), /*#__PURE__*/_jsx(Dialog, {
      open: isRenameOpen,
      onOpenChange: setIsRenameOpen,
      children: /*#__PURE__*/_jsxs(DialogContent, {
        children: [/*#__PURE__*/_jsxs(DialogHeader, {
          children: [/*#__PURE__*/_jsx(DialogTitle, {
            children: "Rename project"
          }), /*#__PURE__*/_jsx(DialogDescription, {
            children: "Enter a new name for your project."
          })]
        }), /*#__PURE__*/_jsx(Input, {
          ref: renameInputRef,
          value: renameValue,
          onChange: e => setRenameValue(e.target.value),
          onKeyDown: handleRenameKeyDown,
          placeholder: "Project name",
          maxLength: 100
        }), /*#__PURE__*/_jsxs(DialogFooter, {
          children: [/*#__PURE__*/_jsx(Button, {
            variant: "outline",
            size: "sm",
            onClick: () => setIsRenameOpen(false),
            children: "Cancel"
          }), /*#__PURE__*/_jsx(Button, {
            size: "sm",
            onClick: handleRenameConfirm,
            disabled: !renameValue?.trim() || renameValue?.trim() === projectName,
            children: "Rename"
          })]
        })]
      })
    }), /*#__PURE__*/_jsx(AlertDialog, {
      open: isDeleteOpen,
      onOpenChange: setIsDeleteOpen,
      children: /*#__PURE__*/_jsxs(AlertDialogContent, {
        children: [/*#__PURE__*/_jsxs(AlertDialogHeader, {
          children: [/*#__PURE__*/_jsx(AlertDialogTitle, {
            children: "Delete project?"
          }), /*#__PURE__*/_jsxs(AlertDialogDescription, {
            children: ["This will permanently delete ", /*#__PURE__*/_jsx("strong", {
              children: projectName
            }), " and all its data."]
          })]
        }), /*#__PURE__*/_jsxs(AlertDialogFooter, {
          children: [/*#__PURE__*/_jsx(AlertDialogCancel, {
            children: "Cancel"
          }), /*#__PURE__*/_jsx(AlertDialogAction, {
            onClick: onDelete,
            children: "Delete"
          })]
        })]
      })
    })]
  });
}
