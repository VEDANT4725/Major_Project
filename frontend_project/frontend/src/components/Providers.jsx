"use client";

import { ThemeProvider } from "./Theme-Provider";
import { AuthProvider } from "@/components/auth";
import { jsx as _jsx } from "react/jsx-runtime";
export function Providers({
  children
}) {
  return /*#__PURE__*/_jsx(ThemeProvider, {
    defaultTheme: "dark",
    children: /*#__PURE__*/_jsx(AuthProvider, {
      children: children
    })
  });
}
