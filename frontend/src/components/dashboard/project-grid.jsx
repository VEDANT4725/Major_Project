"use client";

import { Card } from "../ui/card";
import { Plus } from "lucide-react";
import { ProjectCard } from "./project-card";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ProjectGrid({
  projects,
  projectFiles,
  onNewProject,
  onRename,
  onDelete
}) {
  return /*#__PURE__*/_jsxs("div", {
    className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    children: [/*#__PURE__*/_jsxs(Card, {
      className: "flex h-full cursor-pointer items-center justify-center gap-2 border-dashed transition-all duration-150 hover:brightness-[1.08]",
      onClick: onNewProject,
      children: [/*#__PURE__*/_jsx(Plus, {
        className: "size-5 text-muted-foreground"
      }), /*#__PURE__*/_jsx("span", {
        className: "text-sm font-medium text-muted-foreground",
        children: "New Project"
      })]
    }), projects.map(project => /*#__PURE__*/_jsx(ProjectCard, {
      project: project,
      files: projectFiles[project.id],
      onRename: onRename,
      onDelete: onDelete
    }, project.id))]
  });
}
