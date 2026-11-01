import React, { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { FileTree } from "./file-tree";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function CodeEditor({
  files,
  activeFile,
  onActiveFileChange,
  onFileChange,
  readOnly = false
}) {
  useEffect(() => {
    // Monaco emits "Canceled: Canceled" rejections when models switch quickly.
    // They are expected and should not surface as noisy unhandled errors.
    const handleUnhandledRejection = event => {
      const reason = String(event.reason ?? "");
      if (reason.includes("Canceled: Canceled")) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  // Determine language from extension
  const getLanguage = path => {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".json")) return "json";
    return "plaintext";
  };
  return /*#__PURE__*/_jsxs("div", {
    className: "flex h-full w-full",
    children: [/*#__PURE__*/_jsx(FileTree, {
      files: files,
      activeFile: activeFile,
      onActiveFileChange: onActiveFileChange
    }), /*#__PURE__*/_jsx("div", {
      className: "flex-1 h-full bg-[#1e1e1e]",
      children: activeFile && files[activeFile] !== undefined ? /*#__PURE__*/_jsx(Editor, {
        height: "100%",
        language: getLanguage(activeFile),
        theme: "vs-dark",
        value: files[activeFile],
        path: activeFile,
        onChange: value => {
          if (!readOnly) onFileChange(activeFile, value || "");
        },
        options: {
          readOnly,
          readOnlyMessage: {
            value: "You are viewing a previous version. Restore it to make changes."
          },
          minimap: {
            enabled: false
          },
          fontSize: 14,
          wordWrap: "on",
          padding: {
            top: 16
          },
          scrollBeyondLastLine: false,
          smoothScrolling: true
        },
        onMount: (editor, monaco) => {
          // Disable TypeScript/JavaScript validation completely
          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
            noSuggestionDiagnostics: true
          });
          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
            noSuggestionDiagnostics: true
          });
          // Disable error markers
          monaco.editor.setModelMarkers(editor.getModel(), "owner", []);
        }
      }) : /*#__PURE__*/_jsx("div", {
        className: "flex items-center justify-center h-full text-muted-foreground",
        children: "Select a file to edit"
      })
    })]
  });
}
