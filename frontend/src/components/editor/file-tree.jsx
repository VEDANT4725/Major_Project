"use client";

import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode2, FileJson, FileType2, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function buildFileTree(files) {
  const root = [];
  const pathMap = new Map();

  // Get all paths and sort them
  const allPaths = Object.keys(files).sort();
  for (const path of allPaths) {
    const parts = path.split("/");
    let currentPath = "";
    let parentNode = null;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;
      if (!pathMap.has(currentPath)) {
        const node = {
          name: part,
          path: currentPath,
          type: isLast ? "file" : "folder",
          children: isLast ? undefined : []
        };
        pathMap.set(currentPath, node);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          root.push(node);
        }
      }
      parentNode = pathMap.get(currentPath);
    }
  }
  return root;
}
function getFileIcon(path) {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) {
    return /*#__PURE__*/_jsx(FileCode2, {
      className: "size-4 text-blue-400"
    });
  }
  if (path.endsWith(".jsx") || path.endsWith(".js")) {
    return /*#__PURE__*/_jsx(FileCode2, {
      className: "size-4 text-yellow-400"
    });
  }
  if (path.endsWith(".css")) {
    return /*#__PURE__*/_jsx(FileType2, {
      className: "size-4 text-sky-400"
    });
  }
  if (path.endsWith(".json")) {
    return /*#__PURE__*/_jsx(FileJson, {
      className: "size-4 text-green-400"
    });
  }
  if (path.endsWith(".html")) {
    return /*#__PURE__*/_jsx(FileType2, {
      className: "size-4 text-orange-400"
    });
  }
  return /*#__PURE__*/_jsx(File, {
    className: "size-4 text-muted-foreground"
  });
}
function TreeItem({
  node,
  level,
  activeFile,
  onSelect,
  expandedFolders,
  onToggleFolder
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFile === node.path;
  if (node.type === "folder") {
    return /*#__PURE__*/_jsxs("div", {
      children: [/*#__PURE__*/_jsxs("button", {
        onClick: () => onToggleFolder(node.path),
        className: cn("flex items-center gap-1.5 w-full text-left py-1 px-1.5 text-sm rounded-sm transition-colors hover:bg-muted", "text-muted-foreground hover:text-foreground"),
        style: {
          paddingLeft: `${level * 12 + 4}px`
        },
        children: [isExpanded ? /*#__PURE__*/_jsx(ChevronDown, {
          className: "size-3.5 shrink-0"
        }) : /*#__PURE__*/_jsx(ChevronRight, {
          className: "size-3.5 shrink-0"
        }), isExpanded ? /*#__PURE__*/_jsx(FolderOpen, {
          className: "size-4 text-blue-400 shrink-0"
        }) : /*#__PURE__*/_jsx(Folder, {
          className: "size-4 text-blue-400 shrink-0"
        }), /*#__PURE__*/_jsx("span", {
          className: "truncate",
          children: node.name
        })]
      }), isExpanded && node.children && /*#__PURE__*/_jsx("div", {
        children: node.children.map(child => /*#__PURE__*/_jsx(TreeItem, {
          node: child,
          level: level + 1,
          activeFile: activeFile,
          onSelect: onSelect,
          expandedFolders: expandedFolders,
          onToggleFolder: onToggleFolder
        }, child.path))
      })]
    });
  }
  return /*#__PURE__*/_jsxs("button", {
    onClick: () => onSelect(node.path),
    className: cn("flex items-center gap-1.5 w-full text-left py-1 px-1.5 text-sm rounded-sm transition-colors", isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"),
    style: {
      paddingLeft: `${level * 12 + 20}px`
    },
    children: [getFileIcon(node.path), /*#__PURE__*/_jsx("span", {
      className: "truncate",
      children: node.name
    })]
  });
}
export function FileTree({
  files,
  activeFile,
  onActiveFileChange
}) {
  const tree = useMemo(() => buildFileTree(files), [files]);

  // Auto-expand folders containing the active file
  const [expandedFolders, setExpandedFolders] = useState(() => {
    const initial = new Set();
    const parts = activeFile.split("/");
    let path = "";
    for (let i = 0; i < parts.length - 1; i++) {
      path = path ? `${path}/${parts[i]}` : parts[i];
      initial.add(path);
    }
    return initial;
  });
  const handleToggleFolder = path => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  return /*#__PURE__*/_jsxs("div", {
    className: "w-64 border-r border-border bg-card flex flex-col h-full",
    children: [/*#__PURE__*/_jsx("div", {
      className: "p-2 px-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider",
      children: "Explorer"
    }), /*#__PURE__*/_jsx(ScrollArea, {
      className: "flex-1",
      children: /*#__PURE__*/_jsx("div", {
        className: "p-1",
        children: tree.map(node => /*#__PURE__*/_jsx(TreeItem, {
          node: node,
          level: 0,
          activeFile: activeFile,
          onSelect: onActiveFileChange,
          expandedFolders: expandedFolders,
          onToggleFolder: handleToggleFolder
        }, node.path))
      })
    })]
  });
}
