"use client";

import { cn } from "@/lib/utils";
import { Code2, Eye, History } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TABS = [{
  value: "preview",
  label: "Preview",
  icon: Eye
}, {
  value: "code",
  label: "Code",
  icon: Code2
}, {
  value: "history",
  label: "History",
  icon: History
}];
export function EditorTabs({
  activeTab,
  onTabChange
}) {
  return /*#__PURE__*/_jsx("div", {
    className: "flex items-center gap-1 rounded-lg bg-secondary/50 p-1",
    children: TABS.map(tab => {
      const isActive = activeTab === tab.value;
      return /*#__PURE__*/_jsxs("button", {
        onClick: () => onTabChange(tab.value),
        className: cn("flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150", isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"),
        children: [/*#__PURE__*/_jsx(tab.icon, {
          className: "size-3.5"
        }), tab.label]
      }, tab.value);
    })
  });
}
