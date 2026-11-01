"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { jsx as _jsx } from "react/jsx-runtime";
function Progress({
  className,
  value,
  ...props
}) {
  return /*#__PURE__*/_jsx(ProgressPrimitive.Root, {
    "data-slot": "progress",
    className: cn("relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted", className),
    ...props,
    children: /*#__PURE__*/_jsx(ProgressPrimitive.Indicator, {
      "data-slot": "progress-indicator",
      className: "size-full flex-1 bg-primary transition-all",
      style: {
        transform: `translateX(-${100 - (value || 0)}%)`
      }
    })
  });
}
export { Progress };
