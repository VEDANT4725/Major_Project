"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogFooter, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const AI_MODELS = [{
  value: "gemini-3.1-flash",
  label: "Gemini 3.1 Flash (Free - Default)",
  disabled: false
}, {
  value: "gpt-4o-mini",
  label: "GPT-4o Mini (Premium)",
  disabled: true
}, {
  value: "gpt-4o",
  label: "GPT-4o (Premium)",
  disabled: true
}, {
  value: "gemini-2-pro",
  label: "Gemini 2.0 Pro (Premium)",
  disabled: true
}, {
  value: "claude-sonnet-4-5",
  label: "Claude 3.5 Sonnet (Premium)",
  disabled: true
}, {
  value: "claude-haiku-3-5",
  label: "Claude 3.5 Haiku (Premium)",
  disabled: true
}, {
  value: "deepseek-v3",
  label: "DeepSeek V3 (Premium)",
  disabled: true
}, {
  value: "deepseek-r1",
  label: "DeepSeek R1 (Premium)",
  disabled: true
}];
export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState(AI_MODELS[0].value);
  function handleSubmit(event) {
    event?.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit({
      name: trimmedName,
      description: description.trim(),
      model
    });
    setName("");
    setDescription("");
    setModel(AI_MODELS[0].value);
  }
  return /*#__PURE__*/_jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: /*#__PURE__*/_jsxs(DialogContent, {
      className: "sm:max-w-md",
      children: [/*#__PURE__*/_jsxs(DialogHeader, {
        children: [/*#__PURE__*/_jsx(DialogTitle, {
          children: "Launch a New Project"
        }), /*#__PURE__*/_jsx(DialogDescription, {
          children: "Define your vision and let AI bring it to life. Describe what you want to build, and WebCraft will generate your app instantly."
        })]
      }), /*#__PURE__*/_jsxs("form", {
        onSubmit: handleSubmit,
        className: "space-y-4",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/_jsx("label", {
            htmlFor: "project-name",
            className: "text-sm font-medium",
            children: "Project Name"
          }), /*#__PURE__*/_jsx(Input, {
            placeholder: "My awesome app",
            id: "project-name",
            value: name,
            autoFocus: true,
            onChange: event => setName(event.target.value)
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/_jsx("label", {
            htmlFor: "ai-model",
            className: "text-sm font-medium",
            children: "AI Engine"
          }), /*#__PURE__*/_jsxs(Select, {
            value: model,
            onValueChange: setModel,
            children: [/*#__PURE__*/_jsx(SelectTrigger, {
              id: "ai-model",
              children: /*#__PURE__*/_jsx(SelectValue, {
                placeholder: "Choose your AI engine"
              })
            }), /*#__PURE__*/_jsx(SelectContent, {
              children: AI_MODELS.map(aiModel => /*#__PURE__*/_jsx(SelectItem, {
                value: aiModel.value,
                disabled: aiModel.disabled,
                children: aiModel.label
              }, aiModel.value))
            })]
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/_jsx("label", {
            htmlFor: "project-description",
            className: "text-sm font-medium",
            children: "Project Vision"
          }), /*#__PURE__*/_jsx(Textarea, {
            id: "project-description",
            placeholder: "Describe the product you want to build — features, design, and goals. WebCraft will transform it into a powerful, production-ready application.",
            value: description,
            onChange: event => setDescription(event.target.value),
            rows: 3
          })]
        }), /*#__PURE__*/_jsxs(DialogFooter, {
          className: "justify-end gap-2",
          children: [/*#__PURE__*/_jsx(Button, {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            children: "Cancel"
          }), /*#__PURE__*/_jsx(Button, {
            type: "submit",
            disabled: !name.trim() || !description.trim(),
            children: "Generate Project"
          })]
        })]
      })]
    })
  });
}
