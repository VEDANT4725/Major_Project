"use client";

import { cn } from "@/lib/utils";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import React from "react";
import { jsx as _jsx } from "react/jsx-runtime";
const DEVICES = [{
  mode: "desktop",
  icon: Monitor,
  label: "Desktop"
}, {
  mode: "tablet",
  icon: Tablet,
  label: "Tablet (768px)"
}, {
  mode: "phone",
  icon: Smartphone,
  label: "Phone (375px)"
}];
export function DeviceToggle({
  deviceMode,
  onDeviceModeChange
}) {
  return /*#__PURE__*/_jsx("div", {
    className: "flex items-center gap-0.5 rounded-lg bg-secondary/60 p-0.5",
    children: DEVICES.map(device => {
      const isActive = deviceMode === device.mode;
      return /*#__PURE__*/_jsx("button", {
        onClick: () => onDeviceModeChange(device.mode),
        title: device.label,
        "aria-label": `Preview as ${device.label}`,
        className: cn("flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-all duration-150", isActive ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"),
        children: /*#__PURE__*/_jsx(device.icon, {
          className: "size-3.5"
        })
      }, device.mode);
    })
  });
}
