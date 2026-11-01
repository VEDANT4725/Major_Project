"use client";

import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import React, { useCallback, useEffect, useState } from "react";
import { EditorHeader } from "./editor-header";
import { PanelErrorBoundary } from "./panel-error-boundary";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/** Minimum and maximum width for the chat panel in percentage */
const MIN_CHAT_PERCENT = 20;
const MAX_CHAT_PERCENT = 50;
const DEFAULT_CHAT_PERCENT = 30;

/** Absolute pixel minimum for the chat panel */
const MIN_CHAT_PX = 320;
export const EditorLayout = ({
  projectId,
  projectName,
  files,
  messages,
  isStreaming,
  onSendMessage,
  previewPanel,
  codeEditorPanel,
  historyPanel,
  viewingVersion,
  onBackToCurrent,
  onRestoreViewing,
  creditsRemaining,
  creditsTotal,
  isCreditsExhausted,
  selectedModelId,
  onModelChange,
  userPlan,
  onRename,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState("preview");
  const [mobilePanel, setMobilePanel] = useState("content");
  const [deviceMode, setDeviceMode] = useState("desktop");
  const [isDragging, setIsDragging] = useState(false);
  const [chatWidthPercent, setChatWidthPercent] = useState(DEFAULT_CHAT_PERCENT);
  const containerRef = React.useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        if (containerWidth <= 0) return;
        const minPercent = MIN_CHAT_PX / containerWidth * 100;
        setChatWidthPercent(prev => prev < minPercent ? Math.min(minPercent, MAX_CHAT_PERCENT) : prev);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  const handlePointerDown = useCallback(event => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, []);
  const handlePointerUp = useCallback(event => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
  }, []);
  const handlePointerMove = useCallback(event => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPercent = (event.clientX - containerRect.left) / containerRect.width * 100;

    // Compute the pixel-based minimum as a percentage of the container
    const minPercentFromPx = MIN_CHAT_PX / containerRect.width * 100;

    // Clamp: respect both the percentage min and the pixel min
    const effectiveMin = Math.max(MIN_CHAT_PERCENT, minPercentFromPx);
    const clamped = Math.min(MAX_CHAT_PERCENT, Math.max(effectiveMin, newPercent));
    setChatWidthPercent(clamped);
  }, [isDragging]);
  return /*#__PURE__*/_jsxs("div", {
    className: "flex h-full w-full flex-col overflow-hidden",
    children: [/*#__PURE__*/_jsx(EditorHeader, {
      projectName: projectName,
      files: files,
      activeTab: activeTab,
      onTabChange: setActiveTab,
      mobilePanel: mobilePanel,
      onMobilePanelChange: setMobilePanel,
      projectId: projectId,
      userPlan: userPlan,
      creditsRemaining: creditsRemaining,
      creditsTotal: creditsTotal,
      onRename: onRename,
      onDelete: onDelete,
      deviceMode: deviceMode,
      onDeviceModeChange: setDeviceMode
    }), /*#__PURE__*/_jsxs("div", {
      className: cn("hidden md:flex flex-1 overflow-hidden", isDragging && "select-none"),
      ref: containerRef,
      children: [/*#__PURE__*/_jsx("div", {
        className: "shrink-0 overflow-hidden",
        style: {
          width: `${chatWidthPercent}%`,
          minWidth: MIN_CHAT_PX
        },
        children: /*#__PURE__*/_jsx(ChatPanel, {
          messages: messages,
          isStreaming: isStreaming,
          onSendMessage: onSendMessage,
          creditsRemaining: creditsRemaining,
          isCreditsExhausted: isCreditsExhausted,
          selectedModelId: selectedModelId,
          onModelChange: onModelChange,
          userPlan: userPlan,
          files: files
        })
      }), /*#__PURE__*/_jsx("div", {
        className: cn("panel-resize-handle shrink-0", isDragging && "panel-resize-handle--active"),
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerMove: handlePointerMove
      }), /*#__PURE__*/_jsxs("main", {
        className: "flex-1 overflow-hidden relative bg-muted/20 flex flex-col",
        children: [isDragging && /*#__PURE__*/_jsx("div", {
          className: "absolute inset-0 z-50 bg-transparent cursor-col-resize"
        }), activeTab === "preview" && /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx("div", {
            className: "flex h-10 shrink-0 items-center border-b border-border px-4 bg-muted/30",
            children: /*#__PURE__*/_jsx("span", {
              className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
              children: "Preview Panel"
            })
          }), /*#__PURE__*/_jsx("div", {
            className: "flex-1 overflow-hidden relative",
            children: /*#__PURE__*/_jsx("div", {
              className: cn("h-full transition-all duration-200", deviceMode !== "desktop" ? "flex items-start justify-center overflow-auto bg-muted/30 p-6" : ""),
              children: /*#__PURE__*/_jsx("div", {
                className: cn("h-full max-w-full transition-all duration-200", deviceMode !== "desktop" ? "shrink-0 overflow-hidden rounded-lg border border-border shadow-lg" : "w-full"),
                style: deviceMode !== "desktop" ? {
                  width: deviceMode === "tablet" ? 768 : 375
                } : undefined,
                children: /*#__PURE__*/_jsx(PanelErrorBoundary, {
                  name: "Preview",
                  children: previewPanel
                })
              })
            })
          })]
        }), activeTab === "code" && /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx("div", {
            className: "flex h-10 shrink-0 items-center border-b border-border px-4 bg-muted/30",
            children: /*#__PURE__*/_jsx("span", {
              className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
              children: "Code Editor"
            })
          }), /*#__PURE__*/_jsx("div", {
            className: "flex-1 overflow-hidden",
            children: /*#__PURE__*/_jsx(PanelErrorBoundary, {
              name: "Code Editor",
              children: codeEditorPanel
            })
          })]
        }), activeTab === "history" && /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx("div", {
            className: "flex h-10 shrink-0 items-center border-b border-border px-4 bg-muted/30",
            children: /*#__PURE__*/_jsx("span", {
              className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
              children: "Version History"
            })
          }), /*#__PURE__*/_jsx("div", {
            className: "flex-1 overflow-hidden",
            children: /*#__PURE__*/_jsx(PanelErrorBoundary, {
              name: "History",
              children: historyPanel || /*#__PURE__*/_jsx("div", {
                className: "flex h-full flex-col items-center justify-center gap-2 text-muted-foreground",
                children: /*#__PURE__*/_jsx("p", {
                  className: "text-sm italic",
                  children: "No version history yet."
                })
              })
            })
          })]
        })]
      })]
    })]
  });
};
