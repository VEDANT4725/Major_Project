import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SendHorizontal, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { ModelSelector } from "./model-selector";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export function ChatInput({
  onSend,
  isStreaming,
  creditsRemaining,
  isCreditsExhausted = false,
  supportsVision = false,
  files = {},
  selectedModelId,
  onModelChange,
  userPlan
}) {
  const [value, setValue] = useState("");
  const [attachedImages, setAttachedImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Autocomplete suggestions states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerIdx, setTriggerIdx] = useState(-1);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const isDisabled = isStreaming || isCreditsExhausted;
  const hasContent = value.trim().length > 0 || attachedImages.length > 0 || selectedFiles.length > 0;

  // Sync selected files when files list changes (in case a file is deleted)
  useEffect(() => {
    setSelectedFiles(prev => {
      const availableFiles = Object.keys(files || {});
      return prev.filter(f => f === "codebase" || availableFiles.includes(f));
    });
  }, [files]);

  // Outside click handler for suggestions popup
  useEffect(() => {
    const handleOutsideClick = e => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter files and codebase options based on search query
  const allFilePaths = Object.keys(files || {});
  const suggestionsList = ["codebase", ...allFilePaths];
  const filteredFiles = suggestionsList.filter(f => {
    if (!searchQuery) return true;
    return f.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const handleSelectFile = useCallback(file => {
    setSelectedFiles(prev => {
      if (file === "codebase") {
        return ["codebase"];
      }
      const filtered = prev.filter(f => f !== "codebase");
      if (filtered.includes(file)) return filtered;
      return [...filtered, file];
    });

    // Replace trigger text #query in value
    const cursor = textareaRef.current?.selectionStart ?? 0;
    const textBeforeTrigger = value.slice(0, triggerIdx);
    const textAfterTrigger = value.slice(cursor);
    setValue(textBeforeTrigger + textAfterTrigger);
    setShowSuggestions(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      if (textareaRef.current) {
        textareaRef.current.selectionStart = triggerIdx;
        textareaRef.current.selectionEnd = triggerIdx;
      }
    }, 10);
  }, [value, triggerIdx]);
  const handleRemoveFile = useCallback(file => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  }, []);
  const handleTextareaChange = e => {
    const val = e.target.value;
    setValue(val);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastHashIdx = textBeforeCursor.lastIndexOf("#");
    if (lastHashIdx !== -1) {
      const query = textBeforeCursor.slice(lastHashIdx + 1);
      // Verify there are no spaces or newlines in the query
      const hasWhitespace = /\s/.test(query);
      if (!hasWhitespace) {
        setShowSuggestions(true);
        setSearchQuery(query);
        setTriggerIdx(lastHashIdx);
        setActiveSuggestionIdx(0);
        return;
      }
    }
    setShowSuggestions(false);
  };

  // Autofocus
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // -------- FILE PROCESSING --------
  const processFile = useCallback(async file => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPEG, GIF, and WebP images are supported.");
      return null;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be under 4MB.");
      return null;
    }
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = dataUrl.split(",")[1];
        resolve({
          base64,
          mediaType: file.type,
          name: file.name
        });
      };
      reader.onerror = () => {
        toast.error("Failed to read image file.");
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }, []);
  const handleFiles = useCallback(async files => {
    const remaining = MAX_IMAGES - attachedImages.length;
    const filesToProcess = Array.from(files).slice(0, remaining);
    if (Array.from(files).length > remaining) {
      toast.error(`Maximum ${MAX_IMAGES} images per message.`);
    }
    const results = await Promise.all(filesToProcess.map(processFile));
    const valid = results.filter(Boolean);
    if (valid.length > 0) {
      setAttachedImages(prev => [...prev, ...valid]);
    }
  }, [attachedImages.length, processFile]);
  const handleFileSelect = useCallback(e => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  }, [handleFiles]);
  const removeImage = useCallback(index => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // -------- SEND --------
  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed && attachedImages.length === 0 && selectedFiles.length === 0 || isCreditsExhausted) return;
    onSend(trimmed || "Describe this image", attachedImages.length > 0 ? attachedImages : undefined, selectedFiles.length > 0 ? selectedFiles : undefined);
    setValue("");
    setAttachedImages([]);
    setSelectedFiles([]);
  }, [value, attachedImages, selectedFiles, isCreditsExhausted, onSend]);

  // -------- KEYBOARD --------
  const handleKeyDown = e => {
    if (showSuggestions && filteredFiles.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx(prev => (prev + 1) % filteredFiles.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectFile(filteredFiles[activeSuggestionIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -------- DROP --------
  const handleDrop = useCallback(e => {
    e.preventDefault();
    if (!supportsVision) return;
    const imageFiles = [];
    for (const file of Array.from(e.dataTransfer.files)) {
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
  }, [supportsVision, handleFiles]);

  // -------- PASTE --------
  const handlePaste = useCallback(e => {
    if (!supportsVision) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFiles(imageFiles);
    }
  }, [supportsVision, handleFiles]);
  return /*#__PURE__*/_jsxs("div", {
    className: "px-3 pb-3 pt-1.5 relative",
    onDrop: handleDrop,
    onDragOver: e => e.preventDefault(),
    children: [showSuggestions && filteredFiles.length > 0 && /*#__PURE__*/_jsxs("div", {
      ref: suggestionsRef,
      className: "absolute bottom-full left-3 right-3 mb-2 z-50 max-h-[220px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg",
      children: [/*#__PURE__*/_jsx("div", {
        className: "px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/50 mb-1",
        children: "Files suggestion"
      }), filteredFiles.map((file, idx) => /*#__PURE__*/_jsx("button", {
        onClick: () => handleSelectFile(file),
        className: cn("flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors", idx === activeSuggestionIdx ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-accent/50 hover:text-accent-foreground"),
        children: /*#__PURE__*/_jsx("span", {
          className: "truncate",
          children: file === "codebase" ? "#codebase (entire project)" : file
        })
      }, file))]
    }), /*#__PURE__*/_jsxs("div", {
      className: cn("flex flex-col rounded-xl border border-border/50 bg-background transition-colors", "focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/10"),
      children: [selectedFiles.length > 0 && /*#__PURE__*/_jsx("div", {
        className: "flex flex-wrap gap-1.5 px-3 pt-2",
        children: selectedFiles.map(file => /*#__PURE__*/_jsxs("div", {
          className: cn("flex items-center gap-1 rounded bg-secondary/80 px-2 py-0.5 text-xs font-medium text-secondary-foreground border border-border/40", file === "codebase" && "bg-primary/10 text-primary border-primary/20"),
          children: [/*#__PURE__*/_jsx("span", {
            className: "max-w-[150px] truncate",
            children: file === "codebase" ? "#codebase" : file
          }), /*#__PURE__*/_jsx("button", {
            onClick: () => handleRemoveFile(file),
            className: "rounded-full hover:bg-muted p-0.5 transition-colors",
            children: /*#__PURE__*/_jsx(X, {
              className: "size-3"
            })
          })]
        }, file))
      }), attachedImages.length > 0 && /*#__PURE__*/_jsxs("div", {
        className: "flex flex-wrap gap-2 px-3 pt-2",
        children: [attachedImages.map((img, index) => /*#__PURE__*/_jsxs("div", {
          className: "group relative size-14 overflow-hidden rounded-lg border border-border/50",
          children: [/*#__PURE__*/_jsx("img", {
            src: `data:${img.mediaType};base64,${img.base64}`,
            alt: img.name || "Attached image",
            className: "size-full object-cover"
          }), /*#__PURE__*/_jsx("button", {
            onClick: () => removeImage(index),
            className: "absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition group-hover:opacity-100",
            children: /*#__PURE__*/_jsx(X, {
              className: "size-2.5"
            })
          })]
        }, index)), /*#__PURE__*/_jsxs("span", {
          className: "text-[11px] font-medium text-muted-foreground/60",
          children: [attachedImages.length, "/", MAX_IMAGES]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex items-end gap-2 px-3 py-2",
        children: [supportsVision && /*#__PURE__*/_jsx(Button, {
          type: "button",
          variant: "ghost",
          size: "icon-xs",
          onClick: () => fileInputRef.current?.click(),
          disabled: isDisabled || attachedImages.length >= MAX_IMAGES,
          children: /*#__PURE__*/_jsx(Paperclip, {
            className: "size-3.5"
          })
        }), /*#__PURE__*/_jsx("textarea", {
          ref: textareaRef,
          value: value,
          onChange: handleTextareaChange,
          onKeyDown: handleKeyDown,
          onPaste: handlePaste,
          placeholder: isCreditsExhausted ? "You've run out of credits" : isStreaming ? "AI is generating..." : "Describe what you want to build...",
          disabled: isDisabled,
          rows: 1,
          className: cn("flex-1 resize-none bg-transparent text-sm outline-none", "min-h-[24px] max-h-[200px]", isDisabled && "opacity-50 cursor-not-allowed")
        }), /*#__PURE__*/_jsx(Button, {
          size: "icon-xs",
          onClick: handleSend,
          disabled: !hasContent || isDisabled,
          children: /*#__PURE__*/_jsx(SendHorizontal, {
            className: "size-3.5"
          })
        })]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "mt-1.5 flex items-center justify-between gap-2 px-1",
      children: [/*#__PURE__*/_jsx(ModelSelector, {
        selectedModelId: selectedModelId,
        onModelChange: onModelChange,
        userPlan: userPlan,
        disabled: isStreaming
      }), /*#__PURE__*/_jsx("span", {
        className: "hidden text-[10px] text-muted-foreground/60 sm:inline",
        children: "AI can make mistakes. Review generated code."
      })]
    }), /*#__PURE__*/_jsx("input", {
      ref: fileInputRef,
      type: "file",
      accept: ACCEPTED_TYPES.join(","),
      multiple: true,
      className: "hidden",
      onChange: handleFileSelect
    })]
  });
}
