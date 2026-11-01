import React, { useEffect, useRef, useState, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/auth";
import { createApiClient } from "@/lib/api-client";
import { Github, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function GithubCallbackContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    getToken,
    isLoaded,
    isSignedIn
  } = useAuth();
  const [status, setStatus] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  // Prevent double-trigger in strict mode
  const exchangeTriggered = useRef(false);
  useEffect(() => {
    if (!isLoaded || !isSignedIn || exchangeTriggered.current) return;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // optional project ID

    if (!code) {
      setStatus("error");
      setErrorMessage("Authorization code is missing from the callback parameters.");
      return;
    }
    const exchangeCode = async () => {
      exchangeTriggered.current = true;
      try {
        const client = createApiClient(getToken);
        await client.settings.connectGithubOauth(code);

        // Dispatch event to refresh state across components
        window.dispatchEvent(new CustomEvent("github-status-changed"));
        setStatus("success");
        toast.success("Successfully connected to GitHub!");
        setTimeout(() => {
          if (state && state !== "null" && state !== "undefined") {
            navigate(`/project/${state}`);
          } else {
            navigate("/settings?tab=integrations");
          }
        }, 1500);
      } catch (error) {
        console.error("OAuth handshake error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to exchange authorization token.");
        toast.error(error.message || "GitHub authentication failed.");
      }
    };
    exchangeCode();
  }, [isLoaded, isSignedIn, searchParams, getToken, navigate]);
  return /*#__PURE__*/_jsxs("div", {
    className: "w-full max-w-md rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xl p-8 shadow-2xl relative z-10 text-center space-y-6",
    children: [status === "connecting" && /*#__PURE__*/_jsxs("div", {
      className: "space-y-6 py-4 animate-in fade-in duration-300",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "relative flex items-center justify-center mx-auto size-20",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        }), /*#__PURE__*/_jsx(Github, {
          className: "size-8 text-primary animate-pulse"
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "space-y-2",
        children: [/*#__PURE__*/_jsx("h2", {
          className: "text-xl font-bold tracking-tight",
          children: "Connecting to GitHub"
        }), /*#__PURE__*/_jsx("p", {
          className: "text-sm text-muted-foreground",
          children: "Completing secure OAuth authentication handshake..."
        })]
      })]
    }), status === "success" && /*#__PURE__*/_jsxs("div", {
      className: "space-y-6 py-4 animate-in scale-in duration-300",
      children: [/*#__PURE__*/_jsx("div", {
        className: "flex size-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto",
        children: /*#__PURE__*/_jsx(CheckCircle, {
          className: "size-10"
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: "space-y-2",
        children: [/*#__PURE__*/_jsx("h2", {
          className: "text-xl font-bold tracking-tight text-emerald-400",
          children: "Connection Successful!"
        }), /*#__PURE__*/_jsx("p", {
          className: "text-sm text-muted-foreground",
          children: "Redirecting you back to your workspace..."
        })]
      })]
    }), status === "error" && /*#__PURE__*/_jsxs("div", {
      className: "space-y-6 py-4 animate-in scale-in duration-300",
      children: [/*#__PURE__*/_jsx("div", {
        className: "flex size-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive mx-auto",
        children: /*#__PURE__*/_jsx(AlertTriangle, {
          className: "size-10"
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: "space-y-2",
        children: [/*#__PURE__*/_jsx("h2", {
          className: "text-xl font-bold tracking-tight text-destructive",
          children: "Authentication Failed"
        }), /*#__PURE__*/_jsx("p", {
          className: "text-xs text-muted-foreground font-mono bg-destructive/5 rounded-lg border border-destructive/10 p-3 max-h-32 overflow-y-auto",
          children: errorMessage
        })]
      }), /*#__PURE__*/_jsx("button", {
        onClick: () => navigate("/settings?tab=integrations"),
        className: "w-full inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors",
        children: "Return to Settings"
      })]
    })]
  });
}
export default function GithubCallbackPage() {
  return /*#__PURE__*/_jsxs("div", {
    className: "flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground relative overflow-hidden",
    children: [/*#__PURE__*/_jsx("div", {
      className: "absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none"
    }), /*#__PURE__*/_jsx(Suspense, {
      fallback: /*#__PURE__*/_jsxs("div", {
        className: "w-full max-w-md rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xl p-8 shadow-2xl text-center space-y-6",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "relative flex items-center justify-center mx-auto size-20",
          children: [/*#__PURE__*/_jsx("div", {
            className: "absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
          }), /*#__PURE__*/_jsx(Github, {
            className: "size-8 text-primary animate-pulse"
          })]
        }), /*#__PURE__*/_jsx("div", {
          className: "space-y-2",
          children: /*#__PURE__*/_jsx("h2", {
            className: "text-xl font-bold tracking-tight animate-pulse",
            children: "Loading auth session..."
          })
        })]
      }),
      children: /*#__PURE__*/_jsx(GithubCallbackContent, {})
    })]
  });
}
