"use client";

import { getModelById } from "@/lib/models";
import { Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function formatModelName(modelId) {
  const modelInfo = getModelById(modelId);
  if (modelInfo) return modelInfo.name;
  if (modelId.includes("claude")) return "Claude";
  if (modelId.includes("gemini")) return "Gemini";
  if (modelId.includes("gpt-4o-mini")) return "GPT-4o Mini";
  if (modelId.includes("gpt-4o")) return "GPT-4o";
  if (modelId.includes("deepseek")) return "DeepSeek";
  return modelId;
}
export const AUTO_HEAL_PREFIX = "The app has a build/runtime error";
export function extractAttemptNumber(content) {
  const match = content.match(/\(attempt (\d+)\/\d+\)/);
  return match ? parseInt(match[1], 10) : 1;
}
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}
function parseTasks(content) {
  const taskRegex = /<task status="([^"]+)">([\s\S]*?)<\/task>/g;
  const tasks = [];
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push({
      status: match[1],
      description: match[2].trim()
    });
  }
  return tasks;
}

/**
 * Extracts explanation text from AI response by removing XML tags
 */
function extractExplanationText(content) {
  // Remove files blocks
  let cleaned = content.replace(/<files>[\s\S]*?<\/files>/g, "");
  // Remove task blocks
  cleaned = cleaned.replace(/<task[^>]*>[\s\S]*?<\/task>/g, "");
  // Remove other XML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");
  // Trim whitespace
  return cleaned.trim();
}
export function MessageBubble({
  message,
  isStreaming,
  isAutoHealInProgress
}) {
  const isUser = message.role === "user";
  const isAutoHeal = isUser && message.content.startsWith(AUTO_HEAL_PREFIX);
  const tasks = parseTasks(message.content);
  const explanationText = extractExplanationText(message.content);
  if (isAutoHeal) {
    return /*#__PURE__*/_jsx("div", {
      className: "flex w-full justify-center my-2",
      children: /*#__PURE__*/_jsxs(Badge, {
        variant: "destructive",
        className: "animate-pulse",
        children: [/*#__PURE__*/_jsx(AlertCircle, {
          className: "size-3 mr-1"
        }), "AI detected an error... Attempting auto-heal (Attempt ", extractAttemptNumber(message.content), ")"]
      })
    });
  }
  if (isUser) {
    return /*#__PURE__*/_jsx("div", {
      className: "flex w-full justify-end mb-4",
      children: /*#__PURE__*/_jsx("div", {
        className: "bg-primary text-primary-foreground max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm",
        children: message.content
      })
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "flex w-full justify-start mb-4 flex-col gap-2",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex items-center gap-2",
      children: [/*#__PURE__*/_jsx("div", {
        className: "size-8 rounded-full bg-secondary flex items-center justify-center border border-border",
        children: /*#__PURE__*/_jsx("span", {
          className: "text-xs font-semibold",
          children: "AI"
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex flex-col",
        children: [/*#__PURE__*/_jsx("span", {
          className: "text-xs font-medium text-foreground",
          children: message.model ? formatModelName(message.model) : "AI Assistant"
        }), /*#__PURE__*/_jsx("span", {
          className: "text-[10px] text-muted-foreground",
          children: formatTime(message.timestamp)
        })]
      })]
    }), /*#__PURE__*/_jsxs(Card, {
      className: "max-w-[90%] md:max-w-[80%] p-4 bg-card text-card-foreground shadow-sm ml-10 flex flex-col gap-3",
      children: [tasks.length > 0 && /*#__PURE__*/_jsxs("div", {
        className: "flex flex-col gap-2 border-b border-border pb-3 mb-1",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "flex items-center justify-between mb-1",
          children: [/*#__PURE__*/_jsx("span", {
            className: "text-sm font-semibold text-primary",
            children: "Task Progress"
          }), isStreaming && tasks.some(t => t.status === "in_progress") && /*#__PURE__*/_jsx(Loader2, {
            className: "size-4 animate-spin text-primary"
          })]
        }), tasks.map((t, i) => /*#__PURE__*/_jsxs("div", {
          className: "flex items-start gap-2 text-sm transition-all duration-300",
          children: [t.status === "completed" ? /*#__PURE__*/_jsx(CheckCircle2, {
            className: "size-4 text-green-500 mt-0.5 shrink-0"
          }) : t.status === "in_progress" || isStreaming && i === tasks.length - 1 ? /*#__PURE__*/_jsx(Loader2, {
            className: "size-4 text-yellow-500 mt-0.5 shrink-0 animate-spin"
          }) : /*#__PURE__*/_jsx(Circle, {
            className: "size-4 text-muted-foreground mt-0.5 shrink-0"
          }), /*#__PURE__*/_jsx("span", {
            className: `${t.status === "completed" ? "text-foreground" : "text-muted-foreground"}`,
            children: t.description
          })]
        }, i))]
      }), /*#__PURE__*/_jsx("div", {
        className: "text-sm prose prose-sm dark:prose-invert max-w-none",
        children: isStreaming && !explanationText && !message.content ? /*#__PURE__*/_jsxs("div", {
          className: "flex items-center gap-2 text-muted-foreground",
          children: [/*#__PURE__*/_jsx(Loader2, {
            className: "size-4 animate-spin"
          }), "Generating code..."]
        }) : explanationText ? /*#__PURE__*/_jsx(ReactMarkdown, {
          remarkPlugins: [remarkGfm],
          children: explanationText
        }) : message.content ? /*#__PURE__*/_jsx("div", {
          className: "text-muted-foreground",
          children: "AI generation completed. Files have been applied to the editor."
        }) : /*#__PURE__*/_jsxs("div", {
          className: "flex items-center gap-2 text-muted-foreground",
          children: [/*#__PURE__*/_jsx(Loader2, {
            className: "size-4 animate-spin"
          }), "Processing response..."]
        })
      }), !isStreaming && /^Error\s*(\(|:)/i.test(message.content.trim()) && /*#__PURE__*/_jsx(Badge, {
        variant: "destructive",
        className: "w-fit mt-2",
        children: "Error during generation"
      })]
    })]
  });
}
