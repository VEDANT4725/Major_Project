import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { createApiClient } from "@/lib/api-client";
import { PreviewPanel } from "@/components/editor/preview-panel";
import { Loader2, AlertCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function stripMarkdownFences(content) {
  const lines = content.split("\n");

  // Strip opening fence if first line matches ```lang or ```
  if (lines.length > 0 && /^\s*```[a-zA-Z]*\s*$/.test(lines[0])) {
    lines.shift();
  }

  // Strip trailing empty lines, then closing fence
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  if (lines.length > 0 && /^\s*```\s*$/.test(lines[lines.length - 1])) {
    lines.pop();
  }
  return lines.join("\n");
}
function filesToRecord(files) {
  const record = {};
  for (const file of files) {
    const cleaned = stripMarkdownFences(file.content);
    record[file.path] = cleaned;
  }
  return record;
}
export default function PreviewPage() {
  const {
    projectId
  } = useParams();
  const {
    getToken,
    isLoaded: isAuthLoaded,
    isSignedIn
  } = useAuth();
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isSignedIn) {
      setError("You must be signed in to view this preview.");
      setLoading(false);
      return;
    }
    const fetchFiles = async () => {
      try {
        const client = createApiClient(getToken);
        const filesResponse = await client.projects.getFiles(projectId ?? "");
        if (filesResponse && filesResponse.files) {
          const filesRecord = filesToRecord(filesResponse.files);
          setFiles(filesRecord);
        } else {
          setError("Failed to load project files.");
        }
      } catch (err) {
        console.error("Error loading preview files:", err);
        setError(err.message || "An error occurred while loading project files.");
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [projectId, getToken, isAuthLoaded, isSignedIn]);
  if (loading) {
    return /*#__PURE__*/_jsxs("div", {
      className: "h-screen w-screen flex flex-col items-center justify-center bg-[#0d0e12] text-white",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "relative mb-6",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl"
        }), /*#__PURE__*/_jsx("div", {
          className: "relative flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-[#161821] shadow-lg",
          children: /*#__PURE__*/_jsx(Loader2, {
            className: "size-6 animate-spin text-primary"
          })
        })]
      }), /*#__PURE__*/_jsx("h3", {
        className: "text-lg font-semibold tracking-tight",
        children: "Initializing Live Preview..."
      }), /*#__PURE__*/_jsx("p", {
        className: "mt-2 text-sm text-gray-400",
        children: "Loading project configuration and environment"
      })]
    });
  }
  if (error) {
    return /*#__PURE__*/_jsxs("div", {
      className: "h-screen w-screen flex flex-col items-center justify-center bg-[#0d0e12] text-white p-6 text-center",
      children: [/*#__PURE__*/_jsx("div", {
        className: "flex size-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive mb-4",
        children: /*#__PURE__*/_jsx(AlertCircle, {
          className: "size-6"
        })
      }), /*#__PURE__*/_jsx("h3", {
        className: "text-xl font-bold tracking-tight mb-2",
        children: "Failed to Load Preview"
      }), /*#__PURE__*/_jsx("p", {
        className: "text-sm text-gray-400 max-w-md mb-6",
        children: error
      }), /*#__PURE__*/_jsx("button", {
        onClick: () => window.location.reload(),
        className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
        children: "Retry Loading"
      })]
    });
  }
  return /*#__PURE__*/_jsx("div", {
    className: "h-screen w-screen bg-[#0d0e12] overflow-hidden",
    children: /*#__PURE__*/_jsx(PreviewPanel, {
      files: files,
      isStreaming: false
    })
  });
}
