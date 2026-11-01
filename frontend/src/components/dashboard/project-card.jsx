"use client";

import { ProjectPreview } from "./project-preview";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const VIRTUAL_WIDTH = 1024;
const THUMBNAIL_HEIGHT = 160;
function getRelativeTime(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffInSeconds = Math.floor((now - then) / 1000);
  const units = [["year", 60 * 60 * 24 * 365], ["month", 60 * 60 * 24 * 30], ["week", 60 * 60 * 24 * 7], ["day", 60 * 60 * 24], ["hour", 60 * 60], ["minute", 60]];
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto"
  });
  for (const [unit, secondsInUnit] of units) {
    if (diffInSeconds >= secondsInUnit) {
      const value = Math.floor(diffInSeconds / secondsInUnit);
      return formatter.format(-value, unit);
    }
  }
  return "just now";
}
function getInitials(name) {
  return name.split(" ").slice(0, 2).map(part => part[0].toUpperCase()).join("");
}
export function ProjectCard({
  project,
  files,
  onRename,
  onDelete
}) {
  const navigate = useNavigate();
  const initials = getInitials(project.name);
  const thumbnailRef = useRef(null);
  const [scale, setScale] = useState(0);
  const hasFiles = files && Object.keys(files).length > 0;
  const [previewReady, setPreviewReady] = useState(false);
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        setScale(containerWidth / VIRTUAL_WIDTH);
      }
    });
    observer.observe(thumbnailRef.current);
    return () => observer.disconnect();
  }, []);
  return /*#__PURE__*/_jsx("div", {
    onClick: () => navigate(`/project/${project.id}`),
    children: /*#__PURE__*/_jsxs(Card, {
      className: "group cursor-pointer gap-0 overflow-hidden p-0 transition-all duration-150 hover:border-white/20 hover:brightness-[1.05]",
      children: [/*#__PURE__*/_jsx("div", {
        ref: thumbnailRef,
        className: cn("relative overflow-hidden", hasFiles ? "bg-[#1a1a1a]" : "bg-gradient-to-br from-[#6d9cff]/20 via-[#c084fc]/20 to-[#f87171]/20"),
        style: {
          height: THUMBNAIL_HEIGHT
        },
        children: hasFiles && scale > 0 ? /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx("div", {
            className: "absolute inset-0 origin-top-left",
            style: {
              transform: `scale(${scale})`
            },
            children: /*#__PURE__*/_jsx(ProjectPreview, {
              files: files,
              onLoad: () => setPreviewReady(true)
            })
          }), /*#__PURE__*/_jsx("div", {
            className: "absolute inset-0 z-20"
          }), /*#__PURE__*/_jsx("div", {
            className: cn("absolute inset-0 z-10 transition-opacity duration-500", previewReady ? "pointer-events-none opacity-0" : "opacity-100"),
            children: /*#__PURE__*/_jsxs("div", {
              className: "h-full w-full animate-pulse bg-[#1a1a1a] p-3",
              children: [/*#__PURE__*/_jsx("div", {
                className: "h-2.5 w-full rounded bg-white/5"
              }), /*#__PURE__*/_jsx("div", {
                className: "mt-3 h-12 w-3/4 rounded bg-white/5"
              }), /*#__PURE__*/_jsxs("div", {
                className: "mt-3 space-y-2",
                children: [/*#__PURE__*/_jsx("div", {
                  className: "h-2 w-full rounded bg-white/[0.03]"
                }), /*#__PURE__*/_jsx("div", {
                  className: "h-2 w-5/6 rounded bg-white/[0.03]"
                }), /*#__PURE__*/_jsx("div", {
                  className: "h-2 w-4/6 rounded bg-white/[0.03]"
                })]
              })]
            })
          })]
        }) : files === undefined ? /*#__PURE__*/_jsx(Skeleton, {
          className: "absolute inset-0 rounded-none"
        }) : /*#__PURE__*/_jsx("div", {
          className: "flex h-full items-center justify-center",
          children: /*#__PURE__*/_jsx("span", {
            className: "text-2xl font-bold text-muted-foreground/60",
            children: initials
          })
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex items-center justify-between px-4 py-3",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "min-w-0 flex-1",
          children: [/*#__PURE__*/_jsx("p", {
            className: "truncate text-sm font-medium",
            children: project.name
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground",
            children: getRelativeTime(project.updatedAt)
          })]
        }), /*#__PURE__*/_jsxs(DropdownMenu, {
          children: [/*#__PURE__*/_jsx(DropdownMenuTrigger, {
            asChild: true,
            children: /*#__PURE__*/_jsx(Button, {
              variant: "ghost",
              size: "icon-xs",
              className: "opacity-0 group-hover:opacity-100",
              onClick: event => event.stopPropagation(),
              children: /*#__PURE__*/_jsx(MoreHorizontal, {
                className: "size-4"
              })
            })
          }), /*#__PURE__*/_jsxs(DropdownMenuContent, {
            align: "end",
            onClick: event => event.stopPropagation(),
            children: [/*#__PURE__*/_jsxs(DropdownMenuItem, {
              onClick: () => onRename(project.id),
              children: [/*#__PURE__*/_jsx(Pencil, {
                className: "mr-2 size-4"
              }), "Rename"]
            }), /*#__PURE__*/_jsxs(DropdownMenuItem, {
              variant: "destructive",
              onClick: () => onDelete(project.id),
              children: [/*#__PURE__*/_jsx(Trash2, {
                className: "mr-2 size-4"
              }), "Delete"]
            })]
          })]
        })]
      })]
    })
  });
}
