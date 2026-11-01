import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Code, MessageSquare } from "lucide-react";
import { getModelById } from "@/lib/models";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ChatPanel({
  messages,
  isStreaming,
  onSendMessage,
  creditsRemaining,
  isCreditsExhausted,
  selectedModelId,
  onModelChange,
  userPlan,
  files = {}
}) {
  const messagesEndRef = useRef(null);
  const selectedModel = getModelById(selectedModelId);
  const supportsVision = selectedModel?.supportsVision ?? false;

  // ✅ Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, isStreaming]);
  return /*#__PURE__*/_jsxs("div", {
    className: "flex h-full flex-col bg-background",
    children: [/*#__PURE__*/_jsx(ScrollArea, {
      className: "flex-1 overflow-hidden",
      children: /*#__PURE__*/_jsxs("div", {
        className: "flex flex-col gap-5 p-4",
        children: [messages.length === 0 && /*#__PURE__*/_jsxs("div", {
          className: "flex flex-1 flex-col items-center justify-center px-6 py-16 text-center",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "relative mb-5",
            children: [/*#__PURE__*/_jsx("div", {
              className: "absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl"
            }), /*#__PURE__*/_jsx("div", {
              className: "relative flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-card",
              children: /*#__PURE__*/_jsx(Sparkles, {
                className: "size-7 text-primary"
              })
            })]
          }), /*#__PURE__*/_jsx("h3", {
            className: "text-base font-semibold text-foreground",
            children: "What do you want to build?"
          }), /*#__PURE__*/_jsx("p", {
            className: "mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground",
            children: "Describe your app and the AI will generate working code with a live preview."
          }), /*#__PURE__*/_jsx("div", {
            className: "mt-6 flex flex-wrap items-center justify-center gap-2",
            children: [{
              icon: Code,
              label: "A landing page"
            }, {
              icon: MessageSquare,
              label: "A chat app"
            }].map(suggestion => /*#__PURE__*/_jsxs("button", {
              onClick: () => onSendMessage(suggestion.label),
              className: "flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted transition",
              children: [/*#__PURE__*/_jsx(suggestion.icon, {
                className: "size-3"
              }), suggestion.label]
            }, suggestion.label))
          })]
        }), messages.map((message, index) => /*#__PURE__*/_jsx(MessageBubble, {
          message: message,
          isStreaming: isStreaming && message.role === "assistant" && index === messages.length - 1,
          isAutoHealInProgress: isStreaming && message.role === "user" && index === messages.length - 2
        }, message.id))]
      })
    }), /*#__PURE__*/_jsx(ChatInput, {
      onSend: onSendMessage,
      isStreaming: isStreaming,
      creditsRemaining: creditsRemaining,
      isCreditsExhausted: isCreditsExhausted,
      supportsVision: supportsVision,
      files: files,
      selectedModelId: selectedModelId,
      onModelChange: onModelChange,
      userPlan: userPlan
    })]
  });
}
