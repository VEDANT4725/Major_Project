import { EditorLayout, VersionHistory } from "@/components/editor";
import { createApiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_MODEL_ID, getModelById } from "@/lib/models";
import { useAuth } from "@/components/auth";
import { useNavigate, useParams } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WORKER_URL } from "@/lib/api-client";
import { CodeEditor } from "@/components/editor/code-editor";
import { PreviewPanel } from "@/components/editor/preview-panel";
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

/**
 * Converts a ProjectFile[] array to a Record<string, string>.
 * This is the format expected by Sandpack and Monaco.
 * Also strips any markdown code fences from file content.
 *
 * @param files - Array of ProjectFile objects from the API
 * @returns Object mapping file paths to their content
 */
function filesToRecord(files) {
  const record = {};
  for (const file of files) {
    const cleaned = stripMarkdownFences(file.content);
    record[file.path] = cleaned;
  }
  return record;
}
export default function EditorPage() {
  const {
    projectId
  } = useParams();
  const {
    getToken
  } = useAuth();
  const navigate = useNavigate();
  const client = React.useMemo(() => createApiClient(getToken), [getToken]);

  // --- Preview error state for manual fix ---
  const [previewError, setPreviewError] = useState(null);

  /** Mirror of isStreaming as a ref — avoids stale closures in callbacks */
  const isStreamingRef = useRef(false);

  /**
   * Stores a pending prompt from sessionStorage (set during project creation).
   * Consumed once after the editor finishes loading to auto-send the first message.
   */
  const pendingPromptRef = useRef(null);

  /**
   * Ref that always holds the latest handleSendMessage callback.
   * Used by the auto-send effect to avoid stale closure issues
   * without needing handleSendMessage in the effect's deps.
   */
  const handleSendMessageRef = useRef(() => {});
  const [project, setProject] = useState(null);

  /** File contents — Record<filePath, content> */
  const [files, setFiles] = useState({});

  /** Currently selected file in Monaco editor */
  const [activeFile, setActiveFile] = useState("src/App.tsx");

  /** Chat message history */
  const [messages, setMessages] = useState([]);

  /** Whether AI is currently generating a response */
  const [isStreaming, setIsStreaming] = useState(false);

  /** Live stream tasks for the loading screen */
  const [currentTasks, setCurrentTasks] = useState([]);

  /** Loading state while fetching project data */
  const [isLoading, setIsLoading] = useState(true);

  /** Version history metadata for the timeline */
  const [versions, setVersions] = useState([]);

  /** Whether versions are still loading */
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);

  /** User's remaining credits (-1 = unlimited, undefined = loading) */
  const [creditsRemaining, setCreditsRemaining] = useState(undefined);

  /** Total credits for the billing period (e.g. 50 for free) */
  const [creditsTotal, setCreditsTotal] = useState(50);

  /** User's current plan — determines model access */
  const [userPlan, setUserPlan] = useState("free");

  /** Currently selected AI model ID */
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);

  /** Whether the user has exhausted their free credits */
  const isCreditsExhausted = creditsRemaining !== undefined && creditsRemaining !== -1 && creditsRemaining <= 0;

  /**
   * Which old version the user is currently viewing (null = current).
   * When viewing an old version, the editor shows those files read-only.
   */
  const [viewingVersion, setViewingVersion] = useState(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(null);

  /**
  * Saved files for the current version — used to restore when
  * the user clicks "Back to current" after viewing an old version.
  */
  const currentFilesRef = useRef({});

  /**
   * Diff state — when set, the history panel shows the diff viewer
   * instead of the timeline.
   */
  const [diffState, setDiffState] = useState(null);
  const refreshVersions = useCallback(async () => {
    try {
      setIsLoadingVersions(true);
      const response = await client.versions.list(projectId ?? "");
      setVersions(response.versions);
    } catch (error) {
      console.error("Failed to refresh versions:", error);
    } finally {
      setIsLoadingVersions(false);
    }
  }, [projectId, client]);
  const handleBackToCurrent = useCallback(() => {
    setViewingVersion(null);
    if (Object.keys(currentFilesRef.current).length > 0) {
      setFiles(currentFilesRef.current);
    }
  }, []);
  const handleViewVersion = useCallback(async versionNumber => {
    if (versionNumber === project?.currentVersion) {
      handleBackToCurrent();
      return;
    }
    try {
      const response = await client.versions.getFiles(projectId ?? "", versionNumber);
      const versionFiles = filesToRecord(response.files || []);
      setViewingVersion(versionNumber);
      setFiles(versionFiles);
      const paths = Object.keys(versionFiles);
      if (paths.length > 0 && !paths.includes(activeFile)) {
        setActiveFile(paths.includes("src/App.tsx") ? "src/App.tsx" : paths[0]);
      }
    } catch (error) {
      console.error("Failed to load version:", error);
      toast.error(error.message || "Failed to load version files");
    }
  }, [project?.currentVersion, client, projectId, handleBackToCurrent, activeFile]);
  const handleRestoreVersion = useCallback(async () => {
    if (viewingVersion === null) return;
    try {
      const filesArray = Object.entries(files).map(([path, content]) => ({
        path,
        content
      }));
      const response = await client.versions.create(projectId ?? "", {
        files: filesArray,
        prompt: `Restored from version ${viewingVersion}`,
        model: selectedModelId,
        type: "RESTORE",
        changedFiles: Object.keys(files),
        restoredFrom: viewingVersion
      });
      const restoredVersion = response.version;
      setProject(prev => prev ? {
        ...prev,
        currentVersion: restoredVersion,
        updatedAt: new Date().toISOString()
      } : prev);
      currentFilesRef.current = files;
      lastSavedFilesRef.current = files;
      setViewingVersion(null);
      await refreshVersions();
      toast.success(`Restored version ${viewingVersion} as v${restoredVersion}`);
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error(error.message || "Failed to restore version");
    }
  }, [viewingVersion, files, client, projectId, selectedModelId, refreshVersions]);
  const handleSendMessage = useCallback(async (content, images, selectedFiles) => {
    if (isStreamingRef.current) {
      console.warn("[handleSendMessage] Stream already in progress. Ignoring duplicate request.");
      return;
    }

    // If user was viewing old version → jump to latest
    if (viewingVersion !== project?.currentVersion) {
      handleBackToCurrent?.();
    }

    // ---- USER MESSAGE ----
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      images: images && images.length > 0 ? images : undefined,
      selectedFiles: selectedFiles && selectedFiles.length > 0 ? selectedFiles : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    isStreamingRef.current = true;

    // ---- INITIALIZE STREAM TASKS ----
    const initialTasks = [{
      description: "Understanding your request",
      status: "in_progress"
    }, {
      description: "Generating files",
      status: "pending"
    }, {
      description: "Preparing preview",
      status: "pending"
    }];
    setCurrentTasks(initialTasks);

    // ---- EMPTY AI MESSAGE ----
    const aiMessageId = `msg-${Date.now()}-assistant`;
    const aiMessage = {
      id: aiMessageId,
      role: "assistant",
      content: '<task status="in_progress">Understanding your request</task>\n' + '<task status="pending">Generating files</task>\n' + '<task status="pending">Preparing preview</task>',
      timestamp: new Date().toISOString(),
      model: selectedModelId
    };
    setMessages(prev => [...prev, aiMessage]);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const response = await fetch(`${WORKER_URL}/api/chat/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: content,
          model: selectedModelId,
          images: images && images.length > 0 ? images : undefined,
          selectedFiles: selectedFiles && selectedFiles.length > 0 ? selectedFiles : undefined
        })
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
          error: "Request failed"
        }));
        throw new Error(errorBody.error || "Request failed");
      }
      if (!response.body) {
        throw new Error("No response body");
      }

      // ---- STREAM READER ----
      // ---- STREAM READER ----
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let chunkCount = 0;
      const startTime = Date.now();
      const taskStatusByDescription = new Map();
      const buildTaskMarkup = () => Array.from(taskStatusByDescription.entries()).map(([description, status]) => `<task status="${status}">${description}</task>`).join("\n");
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, {
          stream: true
        });
        chunkCount++;

        // Check for timeout (60 seconds without any data)
        if (Date.now() - startTime > 60000 && chunkCount === 0) {
          console.error("[SendMessage] Stream timeout - no data received");
          throw new Error("Generation timed out. The AI service may be unavailable.");
        }
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const event = JSON.parse(data);

            // Skip heartbeat/ping events
            if (event.time !== undefined) {
              continue;
            }

            // ---- CONNECTION CONFIRMED ----
            if (event.text === "Stream started") {
              continue;
            }

            // ---- STREAM TEXT ----
            if (event.text !== undefined) {
              // Ignore raw code text in chat UI.
              // We only show task placeholders + final explanation.
            }
            const incomingTasks = Array.isArray(event.tasks) ? event.tasks : event.status && event.description ? [{
              description: event.description,
              status: event.status
            }] : [];
            if (incomingTasks.length > 0) {
              for (const task of incomingTasks) {
                if (!task?.description) continue;
                taskStatusByDescription.set(task.description, task.status || "pending");

                // Update currentTasks state for PreviewPanel
                setCurrentTasks(prev => {
                  const index = prev.findIndex(t => t.description === task.description);
                  const nextTask = {
                    description: task.description,
                    status: task.status || "pending"
                  };
                  if (index !== -1) {
                    const newTasks = [...prev];
                    newTasks[index] = nextTask;
                    return newTasks;
                  }
                  const previewIndex = prev.findIndex(t => t.description === "Preparing preview");
                  if (previewIndex !== -1) {
                    const newTasks = [...prev];
                    newTasks.splice(previewIndex, 0, nextTask);
                    return newTasks;
                  }
                  return [...prev, nextTask];
                });
              }
              const tasksMarkup = buildTaskMarkup();
              setMessages(prev => prev.map(msg => msg.id === aiMessageId ? {
                ...msg,
                content: tasksMarkup
              } : msg));
            }

            // ---- FILES GENERATED ----
            if (event.files && !event.isPartial) {
              const newFiles = filesToRecord(event.files);
              setFiles(newFiles);
              currentFilesRef.current = newFiles;
              lastSavedFilesRef.current = newFiles;
              // Clear any preview error when new files arrive
              setPreviewError(null);
            }
            if (event.event === "error") {
              console.error("[SSE] Error event received:", event.data);
              toast.error(event.data.text || "AI generation error");
              setIsStreaming(false);
              isStreamingRef.current = false;
              return;
            }

            // ---- DONE ----
            if (event.versionId || event.model) {
              // Set all tasks to completed in currentTasks state
              setCurrentTasks(prev => prev.map(t => ({
                ...t,
                status: "completed"
              })));
              const tasksMarkup = buildTaskMarkup();
              const changedCount = Array.isArray(event.changedFiles) ? event.changedFiles.length : 0;
              const completionNote = changedCount > 0 ? `Build complete. Updated ${changedCount} files and synced preview.` : "Build complete. Project synced to editor and preview.";
              const finalContent = `${tasksMarkup}\n\n${completionNote}`;
              setMessages(prev => prev.map(msg => msg.id === aiMessageId ? {
                ...msg,
                content: finalContent || "Generation completed."
              } : msg));
            }

            // ---- CREDITS ----
            if (event.creditsRemaining !== undefined) {
              setCreditsRemaining(event.creditsRemaining);
            }

            // ---- VERSION ----
            if (event.versionId) {
              const parsedVersion = Number.isFinite(Number(event.version)) ? Number(event.version) : Number.parseInt(String(event.versionId).split("-v").pop(), 10);
              const versionNumber = Number.isFinite(parsedVersion) ? parsedVersion : undefined;
              setProject(prev => prev ? {
                ...prev,
                currentVersion: versionNumber ?? prev.currentVersion + 1,
                updatedAt: new Date().toISOString()
              } : prev);
              setMessages(prev => prev.map(msg => msg.id === aiMessageId ? {
                ...msg,
                versionNumber
              } : msg));
              setTimeout(() => refreshVersions?.(), 500);
            }

            // ---- RATE LIMIT ----
            if (event.code === "RATE_LIMITED") {
              setRateLimitedUntil(Date.now() + 60000);
              window.dispatchEvent(new CustomEvent("rate-limited", {
                detail: {
                  retryAfter: 60
                }
              }));
            }

            // ---- ERROR FROM STREAM ----
            if (event.error || event.code && event.versionId === undefined) {
              const msg = event.message || event.error || "Unknown error";
              const code = event.code || "UNKNOWN";
              console.error("[SSE] Error received:", code, msg);
              setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                ...m,
                content: `Error (${code}): ${msg}`
              } : m));
              toast.error(`${code}: ${msg}`);
            }
          } catch {
            // Ignore bad chunks
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      const lower = errorMessage.toLowerCase();
      if (lower.includes("too many requests") || lower.includes("rate limit")) {
        setRateLimitedUntil(Date.now() + 60000);
        window.dispatchEvent(new CustomEvent("rate-limited", {
          detail: {
            retryAfter: 60
          }
        }));
      }
      setMessages(prev => prev.map(msg => msg.id === aiMessageId ? {
        ...msg,
        content: `Error: ${errorMessage}`
      } : msg));
      toast.error(errorMessage);
    } finally {
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  }, [project, projectId, selectedModelId, getToken, viewingVersion, handleBackToCurrent, refreshVersions]);
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);
  useEffect(() => {
    if (!isLoading && pendingPromptRef.current) {
      const prompt = pendingPromptRef.current;
      pendingPromptRef.current = null;

      // Wait slightly for handleSendMessageRef to be populated by the other useEffect
      setTimeout(() => {
        if (handleSendMessageRef.current) {
          handleSendMessageRef.current(prompt);
        }
      }, 500);
    }
  }, [isLoading]);

  // ------------------------------------------------------------
  // Preview error listener — manual fix button
  // ------------------------------------------------------------
  useEffect(() => {
    const handleSandpackError = event => {
      const customEvent = event;
      // Only capture error after streaming is done
      if (isStreamingRef.current) return;
      setPreviewError(customEvent.detail.error);
    };
    const handleDismiss = () => setPreviewError(null);
    window.addEventListener("sandpack-error", handleSandpackError);
    window.addEventListener("sandpack-error-dismiss", handleDismiss);
    return () => {
      window.removeEventListener("sandpack-error", handleSandpackError);
      window.removeEventListener("sandpack-error-dismiss", handleDismiss);
    };
  }, []);

  // ------------------------------------------------------------
  // Fix Error handler — sends targeted single-file fix request
  // ------------------------------------------------------------
  const handleFixError = useCallback(error => {
    setPreviewError(null);
    const prompt = `The preview has a runtime/build error. Fix ONLY the file(s) causing this error — do NOT rewrite all files. Return only the fixed file(s) in the standard XML format.

Error:
${error}`;
    handleSendMessageRef.current(prompt, undefined, ["codebase"]);
  }, []);

  // ------------------------------------------------------------
  // Auto-save: debounced manual edits → new version
  // ------------------------------------------------------------

  /** Ref tracking the debounce timer for auto-save */
  const autoSaveTimerRef = useRef(null);

  /** Ref to the last saved files snapshot (for change detection) */
  const lastSavedFilesRef = useRef({});

  /** Live mirror of the editor files used by debounced save callbacks */
  const filesRef = useRef({});

  /** Prevent overlapping version writes while a save is in flight */
  const autoSaveInFlightRef = useRef(false);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  const persistManualChanges = useCallback(async () => {
    if (viewingVersion !== null || isStreamingRef.current || autoSaveInFlightRef.current) return;
    const snapshot = { ...filesRef.current };
    const lastSaved = lastSavedFilesRef.current || {};
    const changed = Object.keys(snapshot).filter(path => snapshot[path] !== lastSaved[path]);
    if (changed.length === 0) return;
    autoSaveInFlightRef.current = true;
    try {
      const response = await client.versions.create(projectId ?? "", {
        files: Object.entries(snapshot).map(([path, content]) => ({
          path,
          content
        })),
        prompt: "Manual code edits",
        model: selectedModelId,
        type: "MANUAL",
        changedFiles: changed
      });
      lastSavedFilesRef.current = snapshot;
      currentFilesRef.current = snapshot;
      const versionNumber = Number(response.version);
      setProject(prev => prev ? {
        ...prev,
        currentVersion: Number.isFinite(versionNumber) ? versionNumber : prev.currentVersion,
        updatedAt: new Date().toISOString()
      } : prev);
      refreshVersions();
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error(error.message || "Auto-save failed. Your changes are still in the editor.");
    } finally {
      autoSaveInFlightRef.current = false;
    }
  }, [viewingVersion, client, projectId, selectedModelId, refreshVersions]);
  const scheduleAutoSave = useCallback(() => {
    if (viewingVersion !== null || isStreamingRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => persistManualChanges(), 1200);
  }, [viewingVersion, persistManualChanges]);
  useEffect(() => () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
  }, []);
  const handleModelChange = useCallback(async modelId => {
    setSelectedModelId(modelId);
    if (!projectId) return;
    try {
      const response = await client.projects.update(projectId, {
        model: modelId
      });
      setProject(prev => prev ? {
        ...prev,
        model: response.project?.model ?? modelId
      } : prev);
    } catch (error) {
      console.error("Failed to update project model:", error);
      toast.error(error.message || "Failed to save model selection");
    }
  }, [client, projectId]);
  const handleRenameProject = useCallback(async newName => {
    if (!projectId) return;
    try {
      const response = await client.projects.update(projectId, {
        name: newName
      });
      setProject(prev => prev ? {
        ...prev,
        name: response.project?.name ?? newName
      } : prev);
      toast.success("Project renamed");
    } catch (error) {
      console.error("Failed to rename project:", error);
      toast.error(error.message || "Failed to rename project");
    }
  }, [client, projectId]);
  const handleDeleteProject = useCallback(async () => {
    if (!projectId) return;
    try {
      await client.projects.delete(projectId);
      toast.success("Project deleted");
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error(error.message || "Failed to delete project");
    }
  }, [client, projectId, navigate]);
  useEffect(() => {
    const loadProject = async () => {
      try {
        const [projectResponse, filesResponse, chatResponse, versionsResponse, creditsResponse] = await Promise.all([client.projects.get(projectId ?? ""), client.projects.getFiles(projectId ?? ""), client.chats.getHistory(projectId ?? ""), client.versions.list(projectId ?? ""), client.credits.get()]);
        setProject(projectResponse.project);
        // Validate model exists in registry, fallback to default if not
        const projectModel = projectResponse.project.model;
        const validModel = getModelById(projectModel) ? projectModel : DEFAULT_MODEL_ID;
        setSelectedModelId(validModel);
        setCreditsRemaining(creditsResponse.isUnlimited ? -1 : creditsResponse.remaining);
        setCreditsTotal(creditsResponse.total);
        setUserPlan(String(creditsResponse.plan || "free").toLowerCase());
        const filesRecord = filesToRecord(filesResponse.files);
        setFiles(filesRecord);
        currentFilesRef.current = filesRecord;
        lastSavedFilesRef.current = filesRecord;
        setMessages(chatResponse.messages);
        setVersions(versionsResponse.versions);
        const filePaths = filesResponse.files.map(f => f.path);
        if (filePaths.includes("src/App.tsx")) {
          setActiveFile("src/App.tsx");
        } else if (filePaths.length > 0) {
          setActiveFile(filePaths[0]);
        }
        try {
          const storageKey = `pending_prompt_${projectId}`;
          const pending = sessionStorage.getItem(storageKey);
          if (pending) {
            pendingPromptRef.current = pending;
            sessionStorage.removeItem(storageKey);
          }
        } catch {
          // ignore storage errors
        }
      } catch (error) {
        console.error("Load project error:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
        setIsLoadingVersions(false);
      }
    };
    loadProject();
  }, [projectId, getToken, navigate]);
  if (isLoading) return /*#__PURE__*/_jsx(EditorLayoutSkeleton, {});
  return /*#__PURE__*/_jsx(EditorLayout, {
    projectId: projectId ?? "",
    projectName: project?.name ?? "",
    files: files,
    messages: messages,
    isStreaming: isStreaming,
    onSendMessage: handleSendMessage,
    onFilesChange: updatedFiles => {
      setFiles(updatedFiles);
    },
    activeFile: activeFile,
    onActiveFileChange: setActiveFile,
    previewPanel: /*#__PURE__*/_jsx(PreviewPanel, {
      files: files,
      isStreaming: isStreaming,
      previewError: previewError,
      onFixError: handleFixError,
      tasks: currentTasks
    }),
    codeEditorPanel: /*#__PURE__*/_jsx(CodeEditor, {
      files: files,
      activeFile: activeFile,
      onActiveFileChange: setActiveFile,
      readOnly: viewingVersion !== null,
      onFileChange: (path, content) => {
        setFiles(prev => ({
          ...prev,
          [path]: content
        }));
        scheduleAutoSave();
      }
    }),
    historyPanel: /*#__PURE__*/_jsx(VersionHistory, {
      versions: versions,
      currentVersion: project?.currentVersion ?? 0,
      viewingVersion: viewingVersion,
      isLoading: isLoadingVersions,
      onViewVersion: handleViewVersion,
      onBackToCurrent: handleBackToCurrent,
      onRestoreVersion: handleRestoreVersion
    }),
    viewingVersion: viewingVersion,
    onBackToCurrent: handleBackToCurrent,
    onRestoreViewing: handleRestoreVersion,
    creditsRemaining: creditsRemaining,
    creditsTotal: creditsTotal,
    isCreditsExhausted: isCreditsExhausted,
    selectedModelId: selectedModelId,
    onModelChange: handleModelChange,
    userPlan: userPlan,
    onRename: handleRenameProject,
    onDelete: handleDeleteProject
  });
}
;
export function EditorLayoutSkeleton() {
  return /*#__PURE__*/_jsxs("div", {
    className: "flex h-full w-full flex-col overflow-hidden",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex h-12 shrink-0 items-center border-b border-border px-3",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "flex items-center gap-3",
        children: [/*#__PURE__*/_jsx(Skeleton, {
          className: "size-7 rounded-full"
        }), /*#__PURE__*/_jsxs("div", {
          className: "flex flex-col gap-1",
          children: [/*#__PURE__*/_jsx(Skeleton, {
            className: "h-4 w-32"
          }), /*#__PURE__*/_jsx(Skeleton, {
            className: "h-3 w-44 hidden sm:block"
          })]
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: "mx-auto",
        children: /*#__PURE__*/_jsx(Skeleton, {
          className: "h-8 w-48 rounded-full"
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex items-center gap-2",
        children: [/*#__PURE__*/_jsx(Skeleton, {
          className: "h-8 w-16 rounded-md hidden sm:block"
        }), /*#__PURE__*/_jsx(Skeleton, {
          className: "size-7 rounded-full"
        })]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "hidden md:flex flex-1 overflow-hidden",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "flex w-[30%] shrink-0 flex-col border-r border-border",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "flex-1 space-y-4 p-4",
          children: [/*#__PURE__*/_jsx(Skeleton, {
            className: "ml-auto h-16 w-3/4 rounded-2xl"
          }), /*#__PURE__*/_jsx(Skeleton, {
            className: "h-24 w-3/4 rounded-2xl"
          }), /*#__PURE__*/_jsx(Skeleton, {
            className: "ml-auto h-12 w-2/3 rounded-2xl"
          })]
        }), /*#__PURE__*/_jsx("div", {
          className: "border-t border-border p-3",
          children: /*#__PURE__*/_jsx(Skeleton, {
            className: "h-12 rounded-xl"
          })
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: "flex flex-1 flex-col",
        children: /*#__PURE__*/_jsx("div", {
          className: "flex-1 p-4",
          children: /*#__PURE__*/_jsx(Skeleton, {
            className: "h-full w-full rounded-lg"
          })
        })
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: "flex md:hidden flex-1 flex-col p-4",
      children: /*#__PURE__*/_jsx(Skeleton, {
        className: "h-full w-full rounded-lg"
      })
    })]
  });
}
