import { FolderOpen } from "lucide-react";
import { Button } from "../ui/button";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({
  onCreateProject
}) {
  return /*#__PURE__*/_jsxs("div", {
    className: "flex flex-1 flex-col items-center justify-center px-6 py-20",
    children: [/*#__PURE__*/_jsx("div", {
      className: "flex size-16 items-center justify-center rounded-2xl bg-muted",
      children: /*#__PURE__*/_jsx(FolderOpen, {
        className: "size-8 text-muted-foreground"
      })
    }), /*#__PURE__*/_jsx("h2", {
      className: "mt-6 text-xl font-semibold",
      children: "Your Next Big Project Starts Here"
    }), /*#__PURE__*/_jsx("p", {
      className: "mt-2 max-w-sm text-center text-sm text-muted-foreground",
      children: "Turn your ideas into powerful, production-ready web apps in minutes. Describe what you want, and let WebCraft build it for you."
    }), /*#__PURE__*/_jsx(Button, {
      className: "mt-6",
      onClick: onCreateProject,
      children: "Launch Your First Project"
    })]
  });
}
