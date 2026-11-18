"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DeviceToggle } from "./device-toggle";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ProjectMenu } from "./project-menu";
import { EditorTabs } from "./editor-tabs";
import { Download, ExternalLink, Eye, Loader2, MessageSquare, Github, CheckCircle2, AlertCircle, ArrowUpRight, Copy, Check, Globe, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useAuth } from "@/components/auth";
import { zipSync, strToU8 } from "fflate";
import { createApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

function VercelIcon({ className = "size-3.5" }) {
  return /*#__PURE__*/_jsx("svg", {
    viewBox: "0 0 76 65",
    fill: "currentColor",
    className: className,
    "aria-hidden": "true",
    children: /*#__PURE__*/_jsx("path", {
      d: "M37.5274 0L75.0548 65H0L37.5274 0Z"
    })
  });
}

export function EditorHeader({
  projectName,
  files,
  activeTab,
  onTabChange,
  mobilePanel,
  onMobilePanelChange,
  projectId,
  userPlan,
  creditsRemaining,
  creditsTotal,
  onRename,
  onDelete,
  deviceMode,
  onDeviceModeChange,
  vercelProjectName: savedVercelProjectName,
  vercelDeploymentUrl: savedVercelDeploymentUrl,
  onVercelDeployed
}) {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const {
    getToken,
    user
  } = useAuth();

  // GitHub integration states
  const [ghConnected, setGhConnected] = useState(false);
  const [ghUsername, setGhUsername] = useState(null);
  const [ghLoading, setGhLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNotConnectedOpen, setIsNotConnectedOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDesc, setRepoDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState("idle");
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState("");
  const [createdRepoUrl, setCreatedRepoUrl] = useState("");

  // Vercel integration states
  const [vercelConnected, setVercelConnected] = useState(false);
  const [vercelOauthConfigured, setVercelOauthConfigured] = useState(false);
  const [vercelUsername, setVercelUsername] = useState(null);
  const [vercelLoading, setVercelLoading] = useState(true);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);
  const [vercelProjName, setVercelProjName] = useState("");
  const [vercelTarget, setVercelTarget] = useState("production");
  const [vercelTokenInput, setVercelTokenInput] = useState("");
  const [vercelTeamIdInput, setVercelTeamIdInput] = useState("");
  const [isConnectingVercel, setIsConnectingVercel] = useState(false);
  const [isRedirectingVercelOAuth, setIsRedirectingVercelOAuth] = useState(false);
  const [showVercelTokenFallback, setShowVercelTokenFallback] = useState(false);
  const [isDeployingVercel, setIsDeployingVercel] = useState(false);
  const [vercelStep, setVercelStep] = useState("idle"); // idle | uploading | building | ready | error
  const [vercelReadyState, setVercelReadyState] = useState("");
  const [vercelDeployUrl, setVercelDeployUrl] = useState("");
  const [vercelInspectorUrl, setVercelInspectorUrl] = useState("");
  const [vercelError, setVercelError] = useState("");
  const [copiedVercelUrl, setCopiedVercelUrl] = useState(false);
  const vercelPollTimerRef = useRef(null);

  const stopVercelPolling = useCallback(() => {
    if (vercelPollTimerRef.current) {
      clearTimeout(vercelPollTimerRef.current);
      vercelPollTimerRef.current = null;
    }
  }, []);

  const checkGithubStatus = useCallback(async () => {
    try {
      setGhLoading(true);
      const client = createApiClient(getToken);
      const res = await client.settings.getGithub();
      setGhConnected(res.connected);
      if (res.connected && res.username) {
        setGhUsername(res.username);
      }
    } catch (err) {
      console.error("Failed to check GitHub status in editor header:", err);
    } finally {
      setGhLoading(false);
    }
  }, [getToken]);
  const checkVercelStatus = useCallback(async () => {
    try {
      setVercelLoading(true);
      const client = createApiClient(getToken);
      const res = await client.settings.getVercel();
      setVercelConnected(Boolean(res?.connected));
      setVercelOauthConfigured(Boolean(res?.oauthConfigured));
      setVercelUsername(res?.connected ? res.username || null : null);
    } catch (err) {
      console.error("Failed to check Vercel status in editor header:", err);
    } finally {
      setVercelLoading(false);
    }
  }, [getToken]);
  useEffect(() => {
    if (projectId) {
      checkGithubStatus();
      checkVercelStatus();
    }
    const handleStatusChange = () => checkGithubStatus();
    const handleVercelStatusChange = () => checkVercelStatus();
    window.addEventListener("github-status-changed", handleStatusChange);
    window.addEventListener("vercel-status-changed", handleVercelStatusChange);
    return () => {
      window.removeEventListener("github-status-changed", handleStatusChange);
      window.removeEventListener("vercel-status-changed", handleVercelStatusChange);
      stopVercelPolling();
    };
  }, [projectId, checkGithubStatus, checkVercelStatus, stopVercelPolling]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("vercel") === "connected") {
      setIsVercelModalOpen(true);
      setVercelStep("idle");
      params.delete("vercel");
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);
  useEffect(() => {
    if (projectName) {
      const formatted = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      setRepoName(formatted || "project");
    }
  }, [projectName]);
  useEffect(() => {
    if (savedVercelProjectName) {
      setVercelProjName(savedVercelProjectName);
    } else if (projectName) {
      const formatted = projectName.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^[.-]+|[.-]+$/g, "");
      setVercelProjName(formatted || "webcraft-app");
    }
  }, [savedVercelProjectName, projectName]);
  const handleVercelClick = () => {
    stopVercelPolling();
    setIsVercelModalOpen(true);
    setVercelStep("idle");
    setVercelReadyState("");
    setVercelError("");
    setCopiedVercelUrl(false);
  };
  const handleCloseVercelModal = () => {
    if (isDeployingVercel && vercelStep === "uploading") return;
    stopVercelPolling();
    setIsVercelModalOpen(false);
    setIsDeployingVercel(false);
    setVercelStep("idle");
  };
  const handleVercelOAuthConnect = async () => {
    try {
      setIsRedirectingVercelOAuth(true);
      const client = createApiClient(getToken);
      const res = await client.settings.getVercelOauthUrl(projectId);
      if (!res?.url) {
        throw new Error("Could not generate Vercel OAuth URL.");
      }
      window.location.href = res.url;
    } catch (error) {
      console.error("Vercel OAuth error:", error);
      toast.error(error.message || "Vercel OAuth is not configured on the server yet.");
      setShowVercelTokenFallback(true);
      setIsRedirectingVercelOAuth(false);
    }
  };
  const handleQuickConnectVercel = async e => {
    if (e) e.preventDefault();
    const token = vercelTokenInput.trim();
    if (!token) {
      toast.error("Please enter your Vercel access token.");
      return;
    }
    try {
      setIsConnectingVercel(true);
      const client = createApiClient(getToken);
      const res = await client.settings.connectVercel(token, vercelTeamIdInput.trim() || undefined);
      setVercelConnected(Boolean(res?.connected));
      setVercelUsername(res?.username || null);
      setVercelTokenInput("");
      setVercelTeamIdInput("");
      toast.success(`Connected Vercel account @${res.username}`);
      window.dispatchEvent(new CustomEvent("vercel-status-changed"));
    } catch (error) {
      console.error("Vercel connect error:", error);
      toast.error(error.message || "Failed to connect Vercel account.");
    } finally {
      setIsConnectingVercel(false);
    }
  };
  const handleVercelDeploy = async () => {
    try {
      stopVercelPolling();
      setIsDeployingVercel(true);
      setVercelStep("uploading");
      setVercelReadyState("UPLOADING");
      setVercelError("");
      setVercelDeployUrl("");
      setVercelInspectorUrl("");
      const client = createApiClient(getToken);
      const deployment = await client.deploy.vercel(projectId, {
        projectName: vercelProjName.trim() || undefined,
        target: vercelTarget,
        files
      });
      const initialUrl = deployment.aliasUrl || deployment.url || "";
      setVercelDeployUrl(initialUrl);
      if (deployment.inspectorUrl) {
        setVercelInspectorUrl(deployment.inspectorUrl);
      }
      if (onVercelDeployed) {
        onVercelDeployed(deployment);
      }
      const state = (deployment.readyState || "QUEUED").toUpperCase();
      setVercelReadyState(state);
      if (state === "READY") {
        setVercelStep("ready");
        setIsDeployingVercel(false);
        toast.success("Project deployed live on Vercel!");
        return;
      }
      if (state === "ERROR" || state === "CANCELED") {
        setVercelStep("error");
        setVercelError(deployment.errorMessage || "Vercel build failed. Open Vercel Inspector for logs.");
        setIsDeployingVercel(false);
        return;
      }

      // Poll Vercel deployment status until READY or ERROR
      setVercelStep("building");
      let attempts = 0;
      const maxAttempts = 60;
      const pollStatus = async () => {
        attempts++;
        try {
          const status = await client.deploy.getVercelStatus(deployment.deploymentId);
          const nextState = (status.readyState || "BUILDING").toUpperCase();
          setVercelReadyState(nextState);
          const liveUrl = status.aliasUrl || status.url || initialUrl;
          if (liveUrl) setVercelDeployUrl(liveUrl);
          if (status.inspectorUrl) setVercelInspectorUrl(status.inspectorUrl);
          if (nextState === "READY") {
            stopVercelPolling();
            setVercelStep("ready");
            setIsDeployingVercel(false);
            if (onVercelDeployed) {
              onVercelDeployed(status);
            }
            toast.success("Your site is live on Vercel!");
            return;
          }
          if (nextState === "ERROR" || nextState === "CANCELED") {
            stopVercelPolling();
            setVercelStep("error");
            setVercelError(status.errorMessage || "Vercel build failed. Check the build logs on Vercel Inspector.");
            setIsDeployingVercel(false);
            return;
          }
          if (attempts >= maxAttempts) {
            stopVercelPolling();
            setVercelStep("ready");
            setIsDeployingVercel(false);
            toast.info("Deployment is still building on Vercel. You can monitor it in the Vercel Inspector.");
            return;
          }
          vercelPollTimerRef.current = setTimeout(pollStatus, 3000);
        } catch (pollErr) {
          console.error("Failed polling Vercel status:", pollErr);
          if (attempts < maxAttempts) {
            vercelPollTimerRef.current = setTimeout(pollStatus, 4000);
          } else {
            stopVercelPolling();
            setIsDeployingVercel(false);
          }
        }
      };
      vercelPollTimerRef.current = setTimeout(pollStatus, 3000);
    } catch (error) {
      console.error("Vercel deploy failed:", error);
      setVercelError(error.message || "Failed to trigger Vercel deployment.");
      setVercelStep("error");
      setIsDeployingVercel(false);
    }
  };
  const handleCopyVercelUrl = async urlToCopy => {
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedVercelUrl(true);
      toast.success("Copied live URL to clipboard!");
      setTimeout(() => setCopiedVercelUrl(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };
  const handleGithubClick = () => {
    if (ghConnected) {
      setIsSyncModalOpen(true);
      setSyncStep("idle");
      setSyncProgress(0);
      setSyncError("");
    } else {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        toast.error("GitHub Client ID is not configured. Redirecting to settings page...");
        setTimeout(() => {
          navigate("/settings?tab=integrations");
        }, 1500);
        return;
      }
      const callbackUrl = encodeURIComponent(window.location.origin + "/auth/github/callback");
      const scope = "repo";
      // Pass the projectId as state to allow returning to the editor page after authorization
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${callbackUrl}&state=${projectId}`;
    }
  };
  const handleGithubSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStep("creating");
      setSyncError("");
      setSyncProgress(10);
      const client = createApiClient(getToken);

      // 1. Fetch GitHub PAT token
      const {
        token: pat
      } = await client.settings.getGithubToken();
      if (!pat) {
        throw new Error("GitHub connection token not found. Please reconnect.");
      }

      // 2. Create Repository
      const createResponse = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `token ${pat}`,
          "Content-Type": "application/json",
          "User-Agent": "Blueprint-AI-Client"
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDesc || `Generated by WebCraft`,
          private: isPrivate,
          auto_init: false
        })
      });
      if (!createResponse.ok) {
        const errBody = await createResponse.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to create repository. Make sure repository name is unique on your profile.");
      }
      const repoData = await createResponse.json();
      setCreatedRepoUrl(repoData.html_url);
      setSyncStep("uploading");
      setSyncProgress(30);

      // 3. Prepare the files list (applying exact clean logic as zip export)
      const processedFiles = {};
      for (const [path, content] of Object.entries(files)) {
        let cleanPath = path.startsWith("/") ? path.slice(1) : path;
        if (cleanPath === "index.html") {
          cleanPath = "public/index.html";
        }
        let fileContent = content;
        if (cleanPath === "package.json") {
          try {
            const parsed = JSON.parse(content);
            if (parsed && parsed.scripts) {
              if (!parsed.scripts.dev && parsed.scripts.start) {
                parsed.scripts.dev = parsed.scripts.start;
              }
            }
            fileContent = JSON.stringify(parsed, null, 2);
          } catch {}
        }
        processedFiles[cleanPath] = fileContent;
      }

      // Auto inject public/index.html if missing
      const hasIndexHtml = Object.keys(processedFiles).some(p => p === "public/index.html" || p === "index.html");
      if (!hasIndexHtml) {
        const envVars = {};
        const envFileKeys = [".env", ".env.local", "/.env", "/.env.local"];
        for (const key of envFileKeys) {
          if (files[key]) {
            const lines = files[key].split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith("#")) continue;
              const eqIdx = trimmed.indexOf("=");
              if (eqIdx === -1) continue;
              const k = trimmed.slice(0, eqIdx).trim();
              let v = trimmed.slice(eqIdx + 1).trim();
              if (v.startsWith('"') && v.endsWith('"') || v.startsWith("'") && v.endsWith("'")) {
                v = v.slice(1, -1);
              }
              envVars[k] = v;
            }
          }
        }
        const envScript = `<script>
      window.process = window.process || {};
      window.process.env = {
        ...window.process.env,
        ${Object.entries(envVars).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n        ")}
      };
    </script>`;
        const defaultIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <!-- ENV_VARS_START -->
    ${envScript}
    <!-- ENV_VARS_END -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body, #root {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
        processedFiles["public/index.html"] = defaultIndexHtml;
      }

      // Auto inject tsconfig.json if missing
      const hasTsConfig = Object.keys(processedFiles).some(p => p === "tsconfig.json");
      if (!hasTsConfig) {
        const defaultTsConfig = {
          compilerOptions: {
            target: "es5",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noFallthroughCasesInSwitch: true,
            module: "esnext",
            moduleResolution: "node",
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx"
          },
          include: ["src"]
        };
        processedFiles["tsconfig.json"] = JSON.stringify(defaultTsConfig, null, 2);
      }

      // 4. Commit and push files one by one to GitHub repo
      const entries = Object.entries(processedFiles);
      const totalFiles = entries.length;
      let uploaded = 0;
      for (const [filePath, fileContent] of entries) {
        const base64 = btoa(unescape(encodeURIComponent(fileContent)));
        const uploadRes = await fetch(`https://api.github.com/repos/${ghUsername}/${repoName}/contents/${filePath}`, {
          method: "PUT",
          headers: {
            Authorization: `token ${pat}`,
            "Content-Type": "application/json",
            "User-Agent": "Blueprint-AI-Client"
          },
          body: JSON.stringify({
            message: `Add ${filePath} via WebCraft`,
            content: base64
          })
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.message || `Failed to upload ${filePath} to repository.`);
        }
        uploaded++;
        setSyncProgress(30 + Math.floor(uploaded / totalFiles * 65));
      }
      setSyncProgress(100);
      setSyncStep("success");
      toast.success("Successfully synchronized code to GitHub!");
    } catch (error) {
      console.error("Failed syncing to GitHub:", error);
      setSyncError(error.message || "An unknown error occurred during upload.");
      setSyncStep("error");
    } finally {
      setIsSyncing(false);
    }
  };
  function handleOpenPreview() {
    window.open(`/preview/${projectId}`, '_blank');
  }
  function handleExport() {
    try {
      setIsExporting(true);
      const zipData = {};

      // 1. Process existing files
      for (const [path, content] of Object.entries(files)) {
        // Remove leading slash if present for valid zip structure
        let cleanPath = path.startsWith("/") ? path.slice(1) : path;

        // If it is index.html in the root, move it to public/index.html
        if (cleanPath === "index.html") {
          cleanPath = "public/index.html";
        }
        let fileContent = content;

        // Safety check for package.json scripts so dev script is always present
        if (cleanPath === "package.json") {
          try {
            const parsed = JSON.parse(content);
            if (parsed && parsed.scripts) {
              if (!parsed.scripts.dev && parsed.scripts.start) {
                parsed.scripts.dev = parsed.scripts.start;
              }
            }
            fileContent = JSON.stringify(parsed, null, 2);
          } catch (e) {
            console.warn("Failed to check/modify package.json scripts for export", e);
          }
        }
        zipData[cleanPath] = strToU8(fileContent);
      }

      // 2. Check if index.html is missing
      const hasIndexHtml = Object.keys(zipData).some(p => p === "public/index.html" || p === "index.html");
      if (!hasIndexHtml) {
        // Parse environment variables for injection
        const envVars = {};
        const envFileKeys = [".env", ".env.local", "/.env", "/.env.local"];
        for (const key of envFileKeys) {
          if (files[key]) {
            const lines = files[key].split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith("#")) continue;
              const eqIdx = trimmed.indexOf("=");
              if (eqIdx === -1) continue;
              const k = trimmed.slice(0, eqIdx).trim();
              let v = trimmed.slice(eqIdx + 1).trim();
              if (v.startsWith('"') && v.endsWith('"') || v.startsWith("'") && v.endsWith("'")) {
                v = v.slice(1, -1);
              }
              envVars[k] = v;
            }
          }
        }
        const envScript = `<script>
      window.process = window.process || {};
      window.process.env = {
        ...window.process.env,
        ${Object.entries(envVars).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n        ")}
      };
    </script>`;
        const defaultIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <!-- ENV_VARS_START -->
    ${envScript}
    <!-- ENV_VARS_END -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body, #root {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
        zipData["public/index.html"] = strToU8(defaultIndexHtml);
      }

      // 3. Check if tsconfig.json is missing
      const hasTsConfig = Object.keys(zipData).some(p => p === "tsconfig.json");
      if (!hasTsConfig) {
        const defaultTsConfig = {
          compilerOptions: {
            target: "es5",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noFallthroughCasesInSwitch: true,
            module: "esnext",
            moduleResolution: "node",
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx"
          },
          include: ["src"]
        };
        zipData["tsconfig.json"] = strToU8(JSON.stringify(defaultTsConfig, null, 2));
      }
      const zipped = zipSync(zipData);
      const blob = new Blob([zipped], {
        type: "application/zip"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = projectName.toLowerCase().replace(/[^a-z0-9_-]/gi, "_") || "project";
      link.download = `${safeName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export project: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }
  return /*#__PURE__*/_jsxs("header", {
    className: "flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-1.5 sm:px-3",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex items-center gap-1.5 sm:gap-3",
      children: [/*#__PURE__*/_jsx(Link, {
        to: "/dashboard",
        className: "shrink-0 transition-opacity duration-150 hover:opacity-80",
        "aria-label": "Go to dashboard",
        children: /*#__PURE__*/_jsx("img", {
          src: "/logo.png",
          alt: "WebCraft",
          className: "size-6 sm:size-7"
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex flex-col",
        children: [/*#__PURE__*/_jsx(ProjectMenu, {
          projectName: projectName,
          projectId: projectId,
          creditsRemaining: creditsRemaining,
          creditsTotal: creditsTotal,
          userPlan: userPlan,
          onRename: onRename,
          onDelete: onDelete
        }), /*#__PURE__*/_jsx("span", {
          className: "px-1 text-[10px] text-muted-foreground sm:text-[11px]",
          children: "Previewing last saved version"
        })]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "hidden md:block absolute left-1/2 -translate-x-1/2",
      children: [/*#__PURE__*/_jsx(EditorTabs, {
        activeTab: activeTab,
        onTabChange: onTabChange
      }), /*#__PURE__*/_jsx("div", {
        className: "mx-auto md:hidden",
        children: /*#__PURE__*/_jsxs("div", {
          className: "flex items-center gap-0.5 rounded-full bg-secondary/60 p-0.5",
          children: [/*#__PURE__*/_jsxs("button", {
            onClick: () => onMobilePanelChange("chat"),
            className: cn("flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150", mobilePanel === "chat" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"),
            children: [/*#__PURE__*/_jsx(MessageSquare, {
              className: "size-3"
            }), "Chat"]
          }), /*#__PURE__*/_jsxs("button", {
            onClick: () => {
              onTabChange("preview");
              onMobilePanelChange("content");
            },
            className: cn("flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150", mobilePanel === "content" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"),
            children: [/*#__PURE__*/_jsx(Eye, {
              className: "size-3"
            }), "Preview"]
          })]
        })
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2",
      children: [activeTab === "preview" && /*#__PURE__*/_jsx("div", {
        className: "hidden md:flex items-center gap-1.5",
        children: /*#__PURE__*/_jsx(DeviceToggle, {
          deviceMode: deviceMode,
          onDeviceModeChange: onDeviceModeChange
        })
      }), /*#__PURE__*/_jsxs(Button, {
        variant: "outline",
        size: "sm",
        onClick: handleOpenPreview,
        disabled: isOpening,
        className: "gap-1.5 text-xs",
        title: "Open live preview in new tab",
        children: [isOpening ? /*#__PURE__*/_jsx(Loader2, {
          className: "size-3.5 animate-spin"
        }) : /*#__PURE__*/_jsx(ExternalLink, {
          className: "size-3.5"
        }), /*#__PURE__*/_jsx("span", {
          className: "hidden sm:inline",
          children: "Preview"
        })]
      }), /*#__PURE__*/_jsxs(Button, {
        variant: "outline",
        size: "sm",
        onClick: handleExport,
        disabled: isExporting,
        className: "gap-1.5 text-xs",
        children: [isExporting ? /*#__PURE__*/_jsx(Loader2, {
          className: "size-3.5 animate-spin"
        }) : /*#__PURE__*/_jsx(Download, {
          className: "size-3.5"
        }), /*#__PURE__*/_jsx("span", {
          children: "Export"
        })]
      }), /*#__PURE__*/_jsxs(Button, {
        variant: "outline",
        size: "sm",
        onClick: handleGithubClick,
        disabled: isSyncing,
        className: "gap-1.5 text-xs border-primary/20 hover:border-primary/45 hover:bg-primary/5 text-foreground",
        title: ghConnected ? "Sync and push project files to a GitHub repository" : "Connect your GitHub account in settings to sync",
        children: [isSyncing ? /*#__PURE__*/_jsx(Loader2, {
          className: "size-3.5 animate-spin"
        }) : /*#__PURE__*/_jsx(Github, {
          className: "size-3.5 text-primary"
        }), /*#__PURE__*/_jsx("span", {
          className: "hidden sm:inline",
          children: ghConnected ? "Push to GitHub" : "Connect GitHub"
        }), /*#__PURE__*/_jsx("span", {
          className: "inline sm:hidden",
          children: ghConnected ? "Push" : "Connect"
        })]
      }), /*#__PURE__*/_jsxs(Button, {
        size: "sm",
        onClick: handleVercelClick,
        disabled: isDeployingVercel,
        className: "gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-semibold",
        title: vercelConnected ? "Deploy this project live to Vercel" : "Connect Vercel to deploy live",
        children: [isDeployingVercel ? /*#__PURE__*/_jsx(Loader2, {
          className: "size-3.5 animate-spin"
        }) : /*#__PURE__*/_jsx(VercelIcon, {
          className: "size-3"
        }), /*#__PURE__*/_jsx("span", {
          className: "hidden sm:inline",
          children: "Deploy"
        }), /*#__PURE__*/_jsx("span", {
          className: "inline sm:hidden",
          children: "Deploy"
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: "flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold cursor-pointer",
        title: "Account",
        children: user?.username?.charAt(0).toUpperCase() || "U"
      })]
    }), isNotConnectedOpen && /*#__PURE__*/_jsx("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200",
      children: /*#__PURE__*/_jsxs("div", {
        className: "w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl relative animate-in scale-in duration-200",
        children: [/*#__PURE__*/_jsx("button", {
          onClick: () => setIsNotConnectedOpen(false),
          className: "absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs",
          children: "✕"
        }), /*#__PURE__*/_jsxs("div", {
          className: "flex flex-col items-center text-center gap-3",
          children: [/*#__PURE__*/_jsx("div", {
            className: "flex size-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500",
            children: /*#__PURE__*/_jsx(AlertCircle, {
              className: "size-6"
            })
          }), /*#__PURE__*/_jsx("h3", {
            className: "text-sm font-bold text-foreground",
            children: "GitHub Account Not Connected"
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground leading-relaxed",
            children: "To sync your project directly to GitHub repositories, please connect your GitHub account in your settings first."
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "flex gap-2.5 mt-5",
          children: [/*#__PURE__*/_jsx(Button, {
            variant: "outline",
            className: "flex-1 text-xs",
            onClick: () => setIsNotConnectedOpen(false),
            children: "Cancel"
          }), /*#__PURE__*/_jsxs(Button, {
            className: "flex-1 text-xs font-bold gap-1",
            onClick: () => {
              setIsNotConnectedOpen(false);
              window.open("/settings?tab=integrations", "_blank");
            },
            children: ["Connect GitHub", /*#__PURE__*/_jsx(ArrowUpRight, {
              className: "size-3"
            })]
          })]
        })]
      })
    }), isSyncModalOpen && /*#__PURE__*/_jsx("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200",
      children: /*#__PURE__*/_jsxs("div", {
        className: "w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl relative animate-in scale-in duration-200",
        children: [!isSyncing && /*#__PURE__*/_jsx("button", {
          onClick: () => {
            setIsSyncModalOpen(false);
            setSyncStep("idle");
          },
          className: "absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs",
          children: "✕"
        }), /*#__PURE__*/_jsxs("h3", {
          className: "text-base font-bold flex items-center gap-2 mb-1.5 text-foreground",
          children: [/*#__PURE__*/_jsx(Github, {
            className: "size-5 text-primary"
          }), "Sync Workspace to GitHub"]
        }), /*#__PURE__*/_jsx("p", {
          className: "text-xs text-muted-foreground mb-4",
          children: "This will create a new repository under your account and push all code files."
        }), syncStep === "idle" && /*#__PURE__*/_jsxs("div", {
          className: "space-y-4",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "space-y-1.5",
            children: [/*#__PURE__*/_jsx("label", {
              className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
              children: "Repository Name"
            }), /*#__PURE__*/_jsx("input", {
              type: "text",
              value: repoName,
              onChange: e => setRepoName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "-")),
              placeholder: "repo-name",
              className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              maxLength: 100
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "space-y-1.5",
            children: [/*#__PURE__*/_jsx("label", {
              className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
              children: "Description (Optional)"
            }), /*#__PURE__*/_jsx("input", {
              type: "text",
              value: repoDesc,
              onChange: e => setRepoDesc(e.target.value),
              placeholder: "Generated by WebCraft",
              className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              maxLength: 200
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex flex-col gap-0.5",
              children: [/*#__PURE__*/_jsx("span", {
                className: "text-xs font-bold text-foreground",
                children: "Private Repository"
              }), /*#__PURE__*/_jsx("span", {
                className: "text-[10px] text-muted-foreground",
                children: "Limit visibility to yourself"
              })]
            }), /*#__PURE__*/_jsx("input", {
              type: "checkbox",
              checked: isPrivate,
              onChange: e => setIsPrivate(e.target.checked),
              className: "size-4 rounded border-border text-primary focus:ring-primary bg-background cursor-pointer"
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex gap-2.5 mt-5",
            children: [/*#__PURE__*/_jsx(Button, {
              variant: "outline",
              className: "flex-1 text-xs",
              onClick: () => setIsSyncModalOpen(false),
              children: "Cancel"
            }), /*#__PURE__*/_jsx(Button, {
              className: "flex-1 text-xs font-bold gap-1.5",
              onClick: handleGithubSync,
              disabled: !repoName.trim(),
              children: "Create & Sync Repo"
            })]
          })]
        }), (syncStep === "creating" || syncStep === "uploading") && /*#__PURE__*/_jsxs("div", {
          className: "py-6 flex flex-col items-center gap-4 text-center",
          children: [/*#__PURE__*/_jsx(Loader2, {
            className: "size-8 text-primary animate-spin"
          }), /*#__PURE__*/_jsxs("div", {
            className: "space-y-1",
            children: [/*#__PURE__*/_jsx("h4", {
              className: "text-sm font-semibold text-foreground",
              children: syncStep === "creating" ? "Creating new repository..." : "Uploading project files..."
            }), /*#__PURE__*/_jsx("p", {
              className: "text-[10px] text-muted-foreground",
              children: "This should only take a few seconds"
            })]
          }), /*#__PURE__*/_jsx("div", {
            className: "w-full bg-muted/40 h-2 rounded-full overflow-hidden mt-2",
            children: /*#__PURE__*/_jsx("div", {
              className: "h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full",
              style: {
                width: `${syncProgress}%`
              }
            })
          }), /*#__PURE__*/_jsxs("span", {
            className: "text-[11px] font-bold text-primary",
            children: [syncProgress, "%"]
          })]
        }), syncStep === "success" && /*#__PURE__*/_jsxs("div", {
          className: "py-6 flex flex-col items-center gap-4 text-center",
          children: [/*#__PURE__*/_jsx("div", {
            className: "flex size-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
            children: /*#__PURE__*/_jsx(CheckCircle2, {
              className: "size-7"
            })
          }), /*#__PURE__*/_jsxs("div", {
            className: "space-y-1",
            children: [/*#__PURE__*/_jsx("h4", {
              className: "text-sm font-bold text-foreground",
              children: "Sync Completed Successfully!"
            }), /*#__PURE__*/_jsx("p", {
              className: "text-xs text-muted-foreground",
              children: "All files have been successfully pushed to your repository."
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex gap-2.5 mt-5 w-full",
            children: [/*#__PURE__*/_jsx(Button, {
              variant: "outline",
              className: "flex-1 text-xs",
              onClick: () => {
                setIsSyncModalOpen(false);
                setSyncStep("idle");
              },
              children: "Close"
            }), /*#__PURE__*/_jsxs(Button, {
              className: "flex-1 text-xs font-bold gap-1",
              onClick: () => window.open(createdRepoUrl, "_blank"),
              children: ["Open Repository", /*#__PURE__*/_jsx(ArrowUpRight, {
                className: "size-3"
              })]
            })]
          })]
        }), syncStep === "error" && /*#__PURE__*/_jsxs("div", {
          className: "py-6 flex flex-col items-center gap-4 text-center",
          children: [/*#__PURE__*/_jsx("div", {
            className: "flex size-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive",
            children: /*#__PURE__*/_jsx(AlertCircle, {
              className: "size-7"
            })
          }), /*#__PURE__*/_jsxs("div", {
            className: "space-y-1",
            children: [/*#__PURE__*/_jsx("h4", {
              className: "text-sm font-bold text-foreground",
              children: "GitHub Sync Failed"
            }), /*#__PURE__*/_jsx("p", {
              className: "text-xs text-destructive bg-destructive/5 rounded-lg border border-destructive/10 p-2.5 max-h-24 overflow-y-auto max-w-xs font-mono text-left",
              children: syncError
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex gap-2.5 mt-5 w-full",
            children: [/*#__PURE__*/_jsx(Button, {
              variant: "outline",
              className: "flex-1 text-xs",
              onClick: () => setSyncStep("idle"),
              children: "Try Again"
            }), /*#__PURE__*/_jsx(Button, {
              className: "flex-1 text-xs font-bold",
              onClick: () => {
                setIsSyncModalOpen(false);
                setSyncStep("idle");
              },
              children: "Close"
            })]
          })]
        })]
      })
    }), isVercelModalOpen && /*#__PURE__*/_jsx("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200",
      children: /*#__PURE__*/_jsxs("div", {
        className: "w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl relative animate-in scale-in duration-200",
        children: [!(isDeployingVercel && vercelStep === "uploading") && /*#__PURE__*/_jsx("button", {
          onClick: handleCloseVercelModal,
          className: "absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs",
          children: "✕"
        }), /*#__PURE__*/_jsxs("h3", {
          className: "text-base font-bold flex items-center gap-2 mb-1.5 text-foreground",
          children: [/*#__PURE__*/_jsx("span", {
            className: "flex size-6 items-center justify-center rounded-md bg-foreground text-background",
            children: /*#__PURE__*/_jsx(VercelIcon, {
              className: "size-3"
            })
          }), "Deploy to Vercel"]
        }), !vercelConnected ? /*#__PURE__*/_jsxs("div", {
          className: "space-y-4 mt-2",
          children: [/*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Connect your Vercel account to publish this project live in one click."
          }), /*#__PURE__*/_jsxs("div", {
            className: "rounded-lg bg-muted/40 p-3.5 border border-border/30 space-y-3",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex items-center justify-between text-xs",
              children: [/*#__PURE__*/_jsx("span", {
                className: "font-semibold text-foreground",
                children: "One-Click Vercel OAuth"
              }), /*#__PURE__*/_jsx("span", {
                className: cn("rounded-full px-2 py-0.5 text-[10px] font-medium", vercelOauthConfigured ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"),
                children: vercelOauthConfigured ? "Recommended" : "Needs Server Setup"
              })]
            }), /*#__PURE__*/_jsx("p", {
              className: "text-[11px] text-muted-foreground",
              children: vercelOauthConfigured ? "Authorize securely via Vercel OAuth 2.0 and return straight back to this editor." : "Configure VERCEL_CLIENT_ID & VERCEL_CLIENT_SECRET in backend .env to enable OAuth, or use a Personal Access Token below."
            }), /*#__PURE__*/_jsxs(Button, {
              type: "button",
              onClick: handleVercelOAuthConnect,
              disabled: isRedirectingVercelOAuth || !vercelOauthConfigured,
              className: "w-full text-xs font-bold gap-1.5 bg-foreground text-background hover:bg-foreground/90",
              children: [isRedirectingVercelOAuth ? /*#__PURE__*/_jsx(Loader2, {
                className: "size-3.5 animate-spin"
              }) : /*#__PURE__*/_jsx(VercelIcon, {
                className: "size-3"
              }), "Connect Vercel via OAuth"]
            })]
          }), vercelOauthConfigured && /*#__PURE__*/_jsx("div", {
            className: "text-center",
            children: /*#__PURE__*/_jsx("button", {
              type: "button",
              onClick: () => setShowVercelTokenFallback(prev => !prev),
              className: "text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline",
              children: showVercelTokenFallback ? "Hide Personal Access Token form" : "Or connect manually with a Personal Access Token"
            })
          }), (!vercelOauthConfigured || showVercelTokenFallback) && /*#__PURE__*/_jsxs("form", {
            onSubmit: handleQuickConnectVercel,
            className: "space-y-3 pt-2 border-t border-border/30",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex items-center justify-between text-[11px]",
              children: [/*#__PURE__*/_jsxs("span", {
                className: "font-semibold text-foreground flex items-center gap-1.5",
                children: [/*#__PURE__*/_jsx(KeyRound, {
                  className: "size-3.5 text-primary"
                }), "Personal Access Token"]
              }), /*#__PURE__*/_jsxs("a", {
                href: "https://vercel.com/account/tokens",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-primary hover:underline flex items-center gap-1 font-medium",
                children: ["Create on Vercel", /*#__PURE__*/_jsx(ExternalLink, {
                  className: "size-3"
                })]
              })]
            }), /*#__PURE__*/_jsx("input", {
              type: "password",
              value: vercelTokenInput,
              onChange: e => setVercelTokenInput(e.target.value),
              placeholder: "Paste your Vercel token...",
              autoComplete: "off",
              className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs font-mono shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            }), /*#__PURE__*/_jsx("input", {
              type: "text",
              value: vercelTeamIdInput,
              onChange: e => setVercelTeamIdInput(e.target.value),
              placeholder: "Team ID (Optional — leave blank for personal account)",
              className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs font-mono shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex gap-2.5 pt-1",
              children: [/*#__PURE__*/_jsx(Button, {
                type: "button",
                variant: "outline",
                className: "flex-1 text-xs",
                onClick: handleCloseVercelModal,
                children: "Cancel"
              }), /*#__PURE__*/_jsxs(Button, {
                type: "submit",
                variant: "secondary",
                className: "flex-1 text-xs font-bold gap-1.5",
                disabled: isConnectingVercel || !vercelTokenInput.trim(),
                children: [isConnectingVercel ? /*#__PURE__*/_jsx(Loader2, {
                  className: "size-3.5 animate-spin"
                }) : /*#__PURE__*/_jsx(KeyRound, {
                  className: "size-3"
                }), "Connect Token"]
              })]
            })]
          })]
        }) : /*#__PURE__*/_jsxs(React.Fragment, {
          children: [/*#__PURE__*/_jsxs("p", {
            className: "text-xs text-muted-foreground mb-4",
            children: ["Deploy your live app to Vercel", vercelUsername ? ` as @${vercelUsername}` : "", "."]
          }), vercelStep === "idle" && /*#__PURE__*/_jsxs("div", {
            className: "space-y-4",
            children: [savedVercelDeploymentUrl && /*#__PURE__*/_jsxs("div", {
              className: "flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-2 min-w-0",
                children: [/*#__PURE__*/_jsx(Globe, {
                  className: "size-3.5 text-emerald-400 shrink-0"
                }), /*#__PURE__*/_jsx("span", {
                  className: "truncate text-emerald-300 font-mono text-[11px]",
                  children: savedVercelDeploymentUrl
                })]
              }), /*#__PURE__*/_jsxs("a", {
                href: savedVercelDeploymentUrl,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-[11px] font-semibold text-primary hover:underline shrink-0 flex items-center gap-0.5",
                children: ["Visit", /*#__PURE__*/_jsx(ArrowUpRight, {
                  className: "size-3"
                })]
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-1.5",
              children: [/*#__PURE__*/_jsx("label", {
                className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
                children: "Vercel Project Name"
              }), /*#__PURE__*/_jsx("input", {
                type: "text",
                value: vercelProjName,
                onChange: e => setVercelProjName(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "-")),
                placeholder: "my-webcraft-app",
                maxLength: 100,
                className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs font-mono shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              }), /*#__PURE__*/_jsx("p", {
                className: "text-[10px] text-muted-foreground",
                children: "Lowercase letters, numbers, hyphens, dots, or underscores."
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-1.5",
              children: [/*#__PURE__*/_jsx("label", {
                className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
                children: "Deployment Environment"
              }), /*#__PURE__*/_jsxs("div", {
                className: "grid grid-cols-2 gap-2",
                children: [/*#__PURE__*/_jsxs("button", {
                  type: "button",
                  onClick: () => setVercelTarget("production"),
                  className: cn("rounded-lg border px-3 py-2 text-left transition-all", vercelTarget === "production" ? "border-primary bg-primary/10 text-foreground" : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"),
                  children: [/*#__PURE__*/_jsx("div", {
                    className: "text-xs font-bold",
                    children: "Production"
                  }), /*#__PURE__*/_jsx("div", {
                    className: "text-[10px] text-muted-foreground",
                    children: "Live production domain"
                  })]
                }), /*#__PURE__*/_jsxs("button", {
                  type: "button",
                  onClick: () => setVercelTarget("preview"),
                  className: cn("rounded-lg border px-3 py-2 text-left transition-all", vercelTarget === "preview" ? "border-primary bg-primary/10 text-foreground" : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"),
                  children: [/*#__PURE__*/_jsx("div", {
                    className: "text-xs font-bold",
                    children: "Preview"
                  }), /*#__PURE__*/_jsx("div", {
                    className: "text-[10px] text-muted-foreground",
                    children: "Unique preview URL"
                  })]
                })]
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex gap-2.5 pt-2",
              children: [/*#__PURE__*/_jsx(Button, {
                variant: "outline",
                className: "flex-1 text-xs",
                onClick: handleCloseVercelModal,
                children: "Cancel"
              }), /*#__PURE__*/_jsxs(Button, {
                className: "flex-1 text-xs font-bold gap-1.5 bg-foreground text-background hover:bg-foreground/90",
                onClick: handleVercelDeploy,
                disabled: !vercelProjName.trim(),
                children: [/*#__PURE__*/_jsx(VercelIcon, {
                  className: "size-3"
                }), "Deploy Now"]
              })]
            })]
          }), (vercelStep === "uploading" || vercelStep === "building") && /*#__PURE__*/_jsxs("div", {
            className: "py-6 flex flex-col items-center gap-4 text-center",
            children: [/*#__PURE__*/_jsx(Loader2, {
              className: "size-8 text-primary animate-spin"
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-1",
              children: [/*#__PURE__*/_jsx("h4", {
                className: "text-sm font-semibold text-foreground",
                children: vercelStep === "uploading" ? "Uploading project files to Vercel..." : vercelReadyState === "BUILDING" ? "Building your app on Vercel..." : vercelReadyState === "INITIALIZING" ? "Initializing build container..." : "Queued on Vercel..."
              }), /*#__PURE__*/_jsx("p", {
                className: "text-[11px] text-muted-foreground",
                children: "Vercel is installing dependencies and building your production bundle. Usually takes 30–60s."
              })]
            }), /*#__PURE__*/_jsx("span", {
              className: "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-primary",
              children: vercelReadyState || "BUILDING"
            }), vercelInspectorUrl && /*#__PURE__*/_jsxs("a", {
              href: vercelInspectorUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-xs text-primary hover:underline flex items-center gap-1",
              children: ["View Live Build Logs on Vercel", /*#__PURE__*/_jsx(ExternalLink, {
                className: "size-3"
              })]
            })]
          }), vercelStep === "ready" && /*#__PURE__*/_jsxs("div", {
            className: "py-4 flex flex-col items-center gap-4 text-center",
            children: [/*#__PURE__*/_jsx("div", {
              className: "flex size-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
              children: /*#__PURE__*/_jsx(CheckCircle2, {
                className: "size-7"
              })
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-1",
              children: [/*#__PURE__*/_jsx("h4", {
                className: "text-sm font-bold text-foreground",
                children: "Deployed Successfully!"
              }), /*#__PURE__*/_jsx("p", {
                className: "text-xs text-muted-foreground",
                children: "Your website is live on Vercel and ready to share."
              })]
            }), vercelDeployUrl && /*#__PURE__*/_jsxs("div", {
              className: "w-full flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2",
              children: [/*#__PURE__*/_jsx("span", {
                className: "flex-1 truncate text-left font-mono text-xs text-foreground",
                children: vercelDeployUrl
              }), /*#__PURE__*/_jsx("button", {
                type: "button",
                onClick: () => handleCopyVercelUrl(vercelDeployUrl),
                className: "text-muted-foreground hover:text-foreground p-1 rounded",
                title: "Copy URL",
                children: copiedVercelUrl ? /*#__PURE__*/_jsx(Check, {
                  className: "size-3.5 text-emerald-400"
                }) : /*#__PURE__*/_jsx(Copy, {
                  className: "size-3.5"
                })
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex gap-2.5 mt-2 w-full",
              children: [vercelInspectorUrl ? /*#__PURE__*/_jsxs(Button, {
                variant: "outline",
                className: "flex-1 text-xs gap-1",
                onClick: () => window.open(vercelInspectorUrl, "_blank"),
                children: ["Inspector", /*#__PURE__*/_jsx(ExternalLink, {
                  className: "size-3"
                })]
              }) : /*#__PURE__*/_jsx(Button, {
                variant: "outline",
                className: "flex-1 text-xs",
                onClick: handleCloseVercelModal,
                children: "Close"
              }), /*#__PURE__*/_jsxs(Button, {
                className: "flex-1 text-xs font-bold gap-1 bg-foreground text-background hover:bg-foreground/90",
                onClick: () => window.open(vercelDeployUrl, "_blank"),
                disabled: !vercelDeployUrl,
                children: ["Open Live Site", /*#__PURE__*/_jsx(ArrowUpRight, {
                  className: "size-3"
                })]
              })]
            })]
          }), vercelStep === "error" && /*#__PURE__*/_jsxs("div", {
            className: "py-4 flex flex-col items-center gap-4 text-center",
            children: [/*#__PURE__*/_jsx("div", {
              className: "flex size-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive",
              children: /*#__PURE__*/_jsx(AlertCircle, {
                className: "size-7"
              })
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-1.5 w-full",
              children: [/*#__PURE__*/_jsx("h4", {
                className: "text-sm font-bold text-foreground",
                children: "Vercel Deployment Failed"
              }), /*#__PURE__*/_jsx("p", {
                className: "text-xs text-destructive bg-destructive/5 rounded-lg border border-destructive/10 p-2.5 max-h-28 overflow-y-auto font-mono text-left break-words",
                children: vercelError
              }), vercelInspectorUrl && /*#__PURE__*/_jsxs("a", {
                href: vercelInspectorUrl,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1",
                children: ["Inspect Build Logs on Vercel", /*#__PURE__*/_jsx(ExternalLink, {
                  className: "size-3"
                })]
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex gap-2.5 mt-2 w-full",
              children: [/*#__PURE__*/_jsx(Button, {
                variant: "outline",
                className: "flex-1 text-xs",
                onClick: () => setVercelStep("idle"),
                children: "Try Again"
              }), /*#__PURE__*/_jsx(Button, {
                className: "flex-1 text-xs font-bold",
                onClick: handleCloseVercelModal,
                children: "Close"
              })]
            })]
          })]
        })]
      })
    })]
  });
}
