import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { createApiClient } from "@/lib/api-client";
import { Github, User, CheckCircle2, ExternalLink, Loader2, AlertCircle, Zap, CreditCard, Crown, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

function VercelIcon({ className = "size-4" }) {
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

export default function SettingsPage() {
  const {
    getToken,
    isLoaded: isAuthLoaded,
    isSignedIn,
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Synchronization of tabs between "profile", "integrations", and "billing"
  const activeTab = searchParams.get("tab") === "profile" ? "profile" : searchParams.get("tab") === "billing" ? "billing" : "integrations";
  const [ghStatus, setGhStatus] = useState(null);
  const [ghLoading, setGhLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [vercelStatus, setVercelStatus] = useState(null);
  const [vercelLoading, setVercelLoading] = useState(true);
  const [vercelTokenInput, setVercelTokenInput] = useState("");
  const [vercelTeamIdInput, setVercelTeamIdInput] = useState("");
  const [vercelConnecting, setVercelConnecting] = useState(false);
  const [vercelOAuthRedirecting, setVercelOAuthRedirecting] = useState(false);
  const [showVercelTokenForm, setShowVercelTokenForm] = useState(false);
  const [credits, setCredits] = useState(null);
  const [upgrading] = useState(false);
  const fetchGithubStatus = async () => {
    try {
      setGhLoading(true);
      const client = createApiClient(getToken);
      const status = await client.settings.getGithub();
      setGhStatus(status);
    } catch (error) {
      console.error("Failed to load GitHub status:", error);
    } finally {
      setGhLoading(false);
    }
  };
  const fetchVercelStatus = async () => {
    try {
      setVercelLoading(true);
      const client = createApiClient(getToken);
      const status = await client.settings.getVercel();
      setVercelStatus(status);
    } catch (error) {
      console.error("Failed to load Vercel status:", error);
    } finally {
      setVercelLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const client = createApiClient(getToken);
      const data = await client.credits.get();
      setCredits(data);
    } catch (error) {
      console.error("Failed to load credits:", error);
    }
  };

  const handleUpgradePlan = () => navigate("/billing");
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      fetchGithubStatus();
      fetchVercelStatus();
      fetchCredits();
    }
  }, [isAuthLoaded, isSignedIn]);
  useEffect(() => {
    if (activeTab === "billing") navigate("/billing", { replace: true });
  }, [activeTab, navigate]);
  const handleConnectGithub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      toast.error("GitHub Client ID is not configured. Please add VITE_GITHUB_CLIENT_ID to your .env.local file.");
      return;
    }
    setConnecting(true);
    const callbackUrl = encodeURIComponent(window.location.origin + "/auth/github/callback");
    const scope = "repo";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${callbackUrl}`;
  };
  const handleDisconnectGithub = async () => {
    if (!confirm("Are you sure you want to disconnect GitHub?")) return;
    try {
      setGhLoading(true);
      const client = createApiClient(getToken);
      await client.settings.disconnectGithub();
      setGhStatus({
        connected: false
      });
      toast.success("Disconnected GitHub connection.");

      // Dispatch event to refresh header/other components
      window.dispatchEvent(new CustomEvent("github-status-changed"));
    } catch (error) {
      console.error("GitHub disconnect error:", error);
      toast.error(error.message || "Failed to disconnect GitHub.");
    } finally {
      setGhLoading(false);
    }
  };
  const handleConnectVercelOAuth = async () => {
    try {
      setVercelOAuthRedirecting(true);
      const client = createApiClient(getToken);
      const res = await client.settings.getVercelOauthUrl();
      if (!res?.url) {
        throw new Error("Could not get Vercel OAuth URL.");
      }
      window.location.href = res.url;
    } catch (error) {
      console.error("Vercel OAuth redirect error:", error);
      toast.error(error.message || "Vercel OAuth is not configured on the server yet.");
      setShowVercelTokenForm(true);
      setVercelOAuthRedirecting(false);
    }
  };
  const handleConnectVercel = async e => {
    if (e) e.preventDefault();
    const token = vercelTokenInput.trim();
    if (!token) {
      toast.error("Please enter your Vercel access token.");
      return;
    }
    try {
      setVercelConnecting(true);
      const client = createApiClient(getToken);
      const status = await client.settings.connectVercel(token, vercelTeamIdInput.trim() || undefined);
      setVercelStatus(status);
      setVercelTokenInput("");
      setVercelTeamIdInput("");
      toast.success(`Connected Vercel account @${status.username}`);
      window.dispatchEvent(new CustomEvent("vercel-status-changed"));
    } catch (error) {
      console.error("Vercel connect error:", error);
      toast.error(error.message || "Failed to connect Vercel account.");
    } finally {
      setVercelConnecting(false);
    }
  };
  const handleDisconnectVercel = async () => {
    if (!confirm("Are you sure you want to disconnect Vercel?")) return;
    try {
      setVercelLoading(true);
      const client = createApiClient(getToken);
      await client.settings.disconnectVercel();
      setVercelStatus({
        connected: false
      });
      toast.success("Disconnected Vercel account.");
      window.dispatchEvent(new CustomEvent("vercel-status-changed"));
    } catch (error) {
      console.error("Vercel disconnect error:", error);
      toast.error(error.message || "Failed to disconnect Vercel.");
    } finally {
      setVercelLoading(false);
    }
  };
  const changeTab = tab => {
    if (tab === "billing") {
      navigate("/billing");
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    navigate(`/settings?${params.toString()}`);
  };
  if (activeTab === "billing") return /*#__PURE__*/_jsx(Navigate, {
    to: "/billing",
    replace: true
  });
  return /*#__PURE__*/_jsxs("div", {
    className: "flex h-full max-w-7xl mx-auto overflow-hidden bg-background text-foreground flex-col md:flex-row",
    children: [/*#__PURE__*/_jsxs("aside", {
      className: "w-full md:w-60 border-b md:border-b-0 md:border-r border-border p-4 flex flex-row md:flex-col gap-1.5 shrink-0",
      children: [/*#__PURE__*/_jsxs("button", {
        onClick: () => changeTab("integrations"),
        className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 text-left ${activeTab === "integrations" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`,
        children: [/*#__PURE__*/_jsx(Github, {
          className: "size-4"
        }), "Integrations"]
      }), /*#__PURE__*/_jsxs("button", {
        onClick: () => changeTab("billing"),
        className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 text-left ${activeTab === "billing" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`,
        children: [/*#__PURE__*/_jsx(CreditCard, {
          className: "size-4"
        }), "Billing & Credits"]
      }), /*#__PURE__*/_jsxs("button", {
        onClick: () => changeTab("profile"),
        className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 text-left ${activeTab === "profile" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`,
        children: [/*#__PURE__*/_jsx(User, {
          className: "size-4"
        }), "Account Profile"]
      })]
    }), /*#__PURE__*/_jsx("main", {
      className: "flex-1 p-6 overflow-y-auto",
      children: activeTab === "integrations" ? /*#__PURE__*/_jsxs("div", {
        className: "max-w-2xl space-y-6",
        children: [/*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsxs("h2", {
            className: "text-xl font-bold tracking-tight mb-1 flex items-center gap-2",
            children: [/*#__PURE__*/_jsx(Github, {
              className: "size-5 text-foreground"
            }), "GitHub Integration"]
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Connect your GitHub account to sync and push generated code projects directly to repositories."
          })]
        }), ghLoading ? /*#__PURE__*/_jsx(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 p-8 flex items-center justify-center",
          children: /*#__PURE__*/_jsx(Loader2, {
            className: "size-6 text-primary animate-spin"
          })
        }) : ghStatus?.connected ? /*#__PURE__*/_jsxs(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 overflow-hidden relative border-emerald-500/10",
          children: [/*#__PURE__*/_jsx("div", {
            className: "absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none blur-md"
          }), /*#__PURE__*/_jsxs(CardHeader, {
            className: "pb-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/_jsxs(CardTitle, {
                className: "text-sm font-bold flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(CheckCircle2, {
                  className: "size-4 text-emerald-400"
                }), "Connection Status: Active"]
              }), /*#__PURE__*/_jsx("span", {
                className: "inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-400/25 animate-pulse",
                children: "Live"
              })]
            }), /*#__PURE__*/_jsx(CardDescription, {
              className: "text-[10px]",
              children: "Your account is successfully linked and ready to push projects."
            })]
          }), /*#__PURE__*/_jsxs(CardContent, {
            className: "border-t border-border/30 pt-4 flex items-center gap-4",
            children: [/*#__PURE__*/_jsx("img", {
              src: ghStatus.avatarUrl,
              alt: ghStatus.username,
              className: "size-14 rounded-full border border-border bg-muted shadow-sm"
            }), /*#__PURE__*/_jsxs("div", {
              children: [/*#__PURE__*/_jsx("div", {
                className: "text-sm font-extrabold text-foreground",
                children: ghStatus.name
              }), /*#__PURE__*/_jsxs("a", {
                href: `https://github.com/${ghStatus.username}`,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5",
                children: ["@", ghStatus.username, /*#__PURE__*/_jsx(ExternalLink, {
                  className: "size-3"
                })]
              })]
            })]
          }), /*#__PURE__*/_jsx(CardFooter, {
            className: "border-t border-border/30 bg-muted/10 px-6 py-3 flex justify-end",
            children: /*#__PURE__*/_jsx(Button, {
              variant: "outline",
              size: "sm",
              onClick: handleDisconnectGithub,
              className: "text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold",
              children: "Disconnect Account"
            })
          })]
        }) : /*#__PURE__*/_jsxs(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 overflow-hidden relative",
          children: [/*#__PURE__*/_jsxs(CardHeader, {
            children: [/*#__PURE__*/_jsxs(CardTitle, {
              className: "text-sm font-bold flex items-center gap-2",
              children: [/*#__PURE__*/_jsx(AlertCircle, {
                className: "size-4.5 text-amber-500"
              }), "GitHub Account Disconnected"]
            }), /*#__PURE__*/_jsx(CardDescription, {
              className: "text-[10px]",
              children: "Authorize WebCraft to publish generated code projects directly to your GitHub repositories."
            })]
          }), /*#__PURE__*/_jsx(CardContent, {
            className: "space-y-4",
            children: /*#__PURE__*/_jsxs("div", {
              className: "rounded-lg bg-muted/40 p-4 border border-border/30 text-xs text-muted-foreground space-y-2.5",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "font-semibold text-foreground flex items-center gap-1",
                children: [/*#__PURE__*/_jsx("span", {
                  children: "💡"
                }), " OAuth Access Scope:"]
              }), /*#__PURE__*/_jsxs("ul", {
                className: "list-disc pl-5 space-y-1 text-[11px]",
                children: [/*#__PURE__*/_jsxs("li", {
                  children: ["Your authorization grants WebCraft standard ", /*#__PURE__*/_jsx("code", {
                    className: "bg-background px-1.5 py-0.5 rounded font-mono text-[10px] text-primary",
                    children: "repo"
                  }), " scope permissions."]
                }), /*#__PURE__*/_jsx("li", {
                  children: "This is used solely to create new repositories and upload project files on your behalf."
                })]
              })]
            })
          }), /*#__PURE__*/_jsx(CardFooter, {
            className: "border-t border-border/30 bg-muted/10 px-6 py-3 flex justify-end",
            children: /*#__PURE__*/_jsxs(Button, {
              onClick: handleConnectGithub,
              size: "sm",
              disabled: connecting,
              className: "text-xs font-bold gap-1.5",
              children: [connecting ? /*#__PURE__*/_jsx(Loader2, {
                className: "size-3.5 animate-spin"
              }) : /*#__PURE__*/_jsx(Github, {
                className: "size-3.5"
              }), "Connect GitHub via OAuth"]
            })
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "pt-4 border-t border-border/40",
          children: [/*#__PURE__*/_jsxs("h2", {
            className: "text-xl font-bold tracking-tight mb-1 flex items-center gap-2",
            children: [/*#__PURE__*/_jsx(VercelIcon, {
              className: "size-4 text-foreground"
            }), "Vercel Deployment"]
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Connect your Vercel account to deploy generated websites live in one click directly from the editor."
          })]
        }), vercelLoading ? /*#__PURE__*/_jsx(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 p-8 flex items-center justify-center",
          children: /*#__PURE__*/_jsx(Loader2, {
            className: "size-6 text-primary animate-spin"
          })
        }) : vercelStatus?.connected ? /*#__PURE__*/_jsxs(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 overflow-hidden relative border-emerald-500/10",
          children: [/*#__PURE__*/_jsx("div", {
            className: "absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none blur-md"
          }), /*#__PURE__*/_jsxs(CardHeader, {
            className: "pb-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/_jsxs(CardTitle, {
                className: "text-sm font-bold flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(CheckCircle2, {
                  className: "size-4 text-emerald-400"
                }), "Connection Status: Active"]
              }), /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-1.5",
                children: [vercelStatus.authType && /*#__PURE__*/_jsx("span", {
                  className: "inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground",
                  children: vercelStatus.authType === "OAUTH" ? "OAuth 2.0" : "Access Token"
                }), /*#__PURE__*/_jsx("span", {
                  className: "inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-400/25 animate-pulse",
                  children: "Live"
                })]
              })]
            }), /*#__PURE__*/_jsx(CardDescription, {
              className: "text-[10px]",
              children: "Your Vercel account is connected and ready for one-click production and preview deployments."
            })]
          }), /*#__PURE__*/_jsxs(CardContent, {
            className: "border-t border-border/30 pt-4 flex items-center gap-4",
            children: [vercelStatus.avatarUrl ? /*#__PURE__*/_jsx("img", {
              src: vercelStatus.avatarUrl,
              alt: vercelStatus.username,
              className: "size-14 rounded-full border border-border bg-muted shadow-sm"
            }) : /*#__PURE__*/_jsx("div", {
              className: "size-14 rounded-full border border-border bg-foreground text-background flex items-center justify-center shadow-sm",
              children: /*#__PURE__*/_jsx(VercelIcon, {
                className: "size-6"
              })
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-0.5",
              children: [/*#__PURE__*/_jsx("div", {
                className: "text-sm font-extrabold text-foreground",
                children: vercelStatus.name || vercelStatus.username
              }), /*#__PURE__*/_jsxs("a", {
                href: `https://vercel.com/${vercelStatus.username}`,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1",
                children: ["@", vercelStatus.username, /*#__PURE__*/_jsx(ExternalLink, {
                  className: "size-3"
                })]
              }), vercelStatus.email && /*#__PURE__*/_jsx("div", {
                className: "text-[11px] text-muted-foreground",
                children: vercelStatus.email
              }), vercelStatus.teamId && /*#__PURE__*/_jsxs("div", {
                className: "text-[10px] text-muted-foreground font-mono mt-1",
                children: ["Team ID: ", vercelStatus.teamId]
              })]
            })]
          }), /*#__PURE__*/_jsx(CardFooter, {
            className: "border-t border-border/30 bg-muted/10 px-6 py-3 flex justify-end",
            children: /*#__PURE__*/_jsx(Button, {
              variant: "outline",
              size: "sm",
              onClick: handleDisconnectVercel,
              className: "text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold",
              children: "Disconnect Account"
            })
          })]
        }) : /*#__PURE__*/_jsxs(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 overflow-hidden relative",
          children: [/*#__PURE__*/_jsxs(CardHeader, {
            children: [/*#__PURE__*/_jsxs(CardTitle, {
              className: "text-sm font-bold flex items-center gap-2",
              children: [/*#__PURE__*/_jsx(AlertCircle, {
                className: "size-4.5 text-amber-500"
              }), "Vercel Account Disconnected"]
            }), /*#__PURE__*/_jsx(CardDescription, {
              className: "text-[10px]",
              children: "Authorize WebCraft via Vercel OAuth to deploy generated projects directly to your Vercel account or team."
            })]
          }), /*#__PURE__*/_jsxs(CardContent, {
            className: "space-y-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "rounded-lg bg-muted/40 p-4 border border-border/30 text-xs text-muted-foreground space-y-2.5",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "font-semibold text-foreground flex items-center justify-between gap-2",
                children: [/*#__PURE__*/_jsxs("span", {
                  className: "flex items-center gap-1.5",
                  children: [/*#__PURE__*/_jsx(VercelIcon, {
                    className: "size-3 text-foreground"
                  }), "Vercel OAuth Integration"]
                }), /*#__PURE__*/_jsx("span", {
                  className: cn("rounded-full px-2 py-0.5 text-[10px] font-medium", vercelStatus?.oauthConfigured ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"),
                  children: vercelStatus?.oauthConfigured ? "OAuth Ready" : "OAuth Not Configured"
                })]
              }), /*#__PURE__*/_jsxs("ul", {
                className: "list-disc pl-5 space-y-1 text-[11px]",
                children: [/*#__PURE__*/_jsx("li", {
                  children: "One-click secure OAuth 2.0 connection — no manual token copying required."
                }), /*#__PURE__*/_jsx("li", {
                  children: "Tokens are encrypted with AES-256-GCM before storage and used only to trigger deployments on your behalf."
                })]
              })]
            }), (showVercelTokenForm || !vercelStatus?.oauthConfigured) && /*#__PURE__*/_jsxs("form", {
              onSubmit: handleConnectVercel,
              className: "space-y-3 pt-2 border-t border-border/30",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "flex items-center justify-between text-xs",
                children: [/*#__PURE__*/_jsxs("span", {
                  className: "font-semibold text-foreground flex items-center gap-1.5",
                  children: [/*#__PURE__*/_jsx(KeyRound, {
                    className: "size-3.5 text-primary"
                  }), "Or connect manually with a Personal Access Token"]
                }), /*#__PURE__*/_jsxs("a", {
                  href: "https://vercel.com/account/tokens",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-[11px] text-primary hover:underline flex items-center gap-1 font-medium",
                  children: ["Create Token", /*#__PURE__*/_jsx(ExternalLink, {
                    className: "size-3"
                  })]
                })]
              }), /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5",
                children: [/*#__PURE__*/_jsx("label", {
                  className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
                  children: "Vercel Access Token"
                }), /*#__PURE__*/_jsx(Input, {
                  type: "password",
                  value: vercelTokenInput,
                  onChange: e => setVercelTokenInput(e.target.value),
                  placeholder: "Paste your Vercel token here...",
                  autoComplete: "off",
                  className: "text-xs font-mono"
                })]
              }), /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5",
                children: [/*#__PURE__*/_jsx("label", {
                  className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
                  children: "Team ID (Optional)"
                }), /*#__PURE__*/_jsx(Input, {
                  type: "text",
                  value: vercelTeamIdInput,
                  onChange: e => setVercelTeamIdInput(e.target.value),
                  placeholder: "team_xxxxxxxxxxxx (leave blank for personal Hobby account)",
                  className: "text-xs font-mono"
                })]
              }), /*#__PURE__*/_jsx("div", {
                className: "flex justify-end",
                children: /*#__PURE__*/_jsxs(Button, {
                  type: "submit",
                  variant: "secondary",
                  size: "sm",
                  disabled: vercelConnecting || !vercelTokenInput.trim(),
                  className: "text-xs font-bold gap-1.5",
                  children: [vercelConnecting ? /*#__PURE__*/_jsx(Loader2, {
                    className: "size-3.5 animate-spin"
                  }) : /*#__PURE__*/_jsx(KeyRound, {
                    className: "size-3.5"
                  }), "Save Token"]
                })
              })]
            })]
          }), /*#__PURE__*/_jsxs(CardFooter, {
            className: "border-t border-border/30 bg-muted/10 px-6 py-3 flex items-center justify-between gap-2",
            children: [vercelStatus?.oauthConfigured ? /*#__PURE__*/_jsx("button", {
              type: "button",
              onClick: () => setShowVercelTokenForm(prev => !prev),
              className: "text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline",
              children: showVercelTokenForm ? "Hide token fallback" : "Use Personal Access Token instead"
            }) : /*#__PURE__*/_jsx("span", {
              className: "text-[10px] text-muted-foreground",
              children: "Set VERCEL_CLIENT_ID & VERCEL_CLIENT_SECRET in backend .env to enable OAuth"
            }), /*#__PURE__*/_jsxs(Button, {
              type: "button",
              onClick: handleConnectVercelOAuth,
              size: "sm",
              disabled: vercelOAuthRedirecting || !vercelStatus?.oauthConfigured,
              className: "text-xs font-bold gap-1.5 bg-foreground text-background hover:bg-foreground/90",
              children: [vercelOAuthRedirecting ? /*#__PURE__*/_jsx(Loader2, {
                className: "size-3.5 animate-spin"
              }) : /*#__PURE__*/_jsx(VercelIcon, {
                className: "size-3"
              }), "Connect Vercel via OAuth"]
            })]
          })]
        })]
      }) : activeTab === "billing" ? /*#__PURE__*/_jsxs("div", {
        className: "max-w-2xl space-y-6",
        children: [/*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsxs("h2", {
            className: "text-xl font-bold tracking-tight mb-1 flex items-center gap-2",
            children: [/*#__PURE__*/_jsx(CreditCard, {
              className: "size-5 text-foreground"
            }), "Billing & Credits"]
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Manage your subscription and credit usage."
          })]
        }), !credits ? /*#__PURE__*/_jsx(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 p-8 flex items-center justify-center",
          children: /*#__PURE__*/_jsx(Loader2, {
            className: "size-6 text-primary animate-spin"
          })
        }) : credits.plan?.toLowerCase() === "pro" || credits.remaining === -1 ? /*#__PURE__*/_jsxs(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80 overflow-hidden relative border-primary/20",
          children: [/*#__PURE__*/_jsx("div", {
            className: "absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none blur-xl"
          }), /*#__PURE__*/_jsxs(CardHeader, {
            className: "pb-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/_jsxs(CardTitle, {
                className: "text-sm font-bold flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(Crown, {
                  className: "size-4 text-primary"
                }), "Pro Plan Active"]
              }), /*#__PURE__*/_jsx("span", {
                className: "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/25",
                children: "ACTIVE"
              })]
            }), /*#__PURE__*/_jsx(CardDescription, {
              className: "text-[10px]",
              children: "You have unlimited access to all features and AI models."
            })]
          }), /*#__PURE__*/_jsxs(CardContent, {
            className: "border-t border-border/30 pt-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "grid grid-cols-2 gap-4 mb-4",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "rounded-lg bg-muted/40 p-3 border border-border/30",
                children: [/*#__PURE__*/_jsx("div", {
                  className: "text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1",
                  children: "Credits"
                }), /*#__PURE__*/_jsxs("div", {
                  className: "text-lg font-bold text-foreground flex items-center gap-1",
                  children: ["Unlimited", /*#__PURE__*/_jsx(Zap, {
                    className: "size-4 text-primary"
                  })]
                })]
              }), /*#__PURE__*/_jsxs("div", {
                className: "rounded-lg bg-muted/40 p-3 border border-border/30",
                children: [/*#__PURE__*/_jsx("div", {
                  className: "text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1",
                  children: "Plan"
                }), /*#__PURE__*/_jsx("div", {
                  className: "text-lg font-bold text-primary",
                  children: "PRO"
                })]
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-2",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-2 text-xs text-muted-foreground",
                children: [/*#__PURE__*/_jsx(CheckCircle2, {
                  className: "size-3 text-emerald-400"
                }), "Unlimited AI generations"]
              }), /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-2 text-xs text-muted-foreground",
                children: [/*#__PURE__*/_jsx(CheckCircle2, {
                  className: "size-3 text-emerald-400"
                }), "Access to premium AI models"]
              }), /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-2 text-xs text-muted-foreground",
                children: [/*#__PURE__*/_jsx(CheckCircle2, {
                  className: "size-3 text-emerald-400"
                }), "Priority support"]
              })]
            })]
          })]
        }) : /*#__PURE__*/_jsxs("div", {
          className: "space-y-4",
          children: [/*#__PURE__*/_jsxs(Card, {
            className: "bg-card/45 backdrop-blur-md border-border/80",
            children: [/*#__PURE__*/_jsxs(CardHeader, {
              children: [/*#__PURE__*/_jsxs(CardTitle, {
                className: "text-sm font-bold flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(Zap, {
                  className: "size-4 text-primary"
                }), "Free Plan"]
              }), /*#__PURE__*/_jsx(CardDescription, {
                className: "text-[10px]",
                children: "You are currently on the free tier with limited credits."
              })]
            }), /*#__PURE__*/_jsxs(CardContent, {
              className: "space-y-4",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "flex justify-between items-center mb-2",
                children: [/*#__PURE__*/_jsx("span", {
                  className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                  children: "Credits Remaining"
                }), /*#__PURE__*/_jsxs("span", {
                  className: "text-xs font-extrabold text-foreground",
                  children: [credits.remaining, " / ", credits.total]
                })]
              }), /*#__PURE__*/_jsx("div", {
                className: "w-full rounded-full bg-muted/30 h-2 overflow-hidden",
                children: /*#__PURE__*/_jsx("div", {
                  className: cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", credits.remaining < 10 ? "from-amber-500 to-rose-500" : "from-primary to-accent"),
                  style: {
                    width: `${Math.min(100, credits.remaining / credits.total * 100)}%`
                  }
                })
              }), /*#__PURE__*/_jsxs("div", {
                className: "text-[10px] text-muted-foreground mt-2",
                children: ["Project creation: 10 credits | Edits: 3 credits"]
              })]
            })]
          }), /*#__PURE__*/_jsxs(Card, {
            className: "bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border border-primary/20 bg-card/45 backdrop-blur-md",
            children: [/*#__PURE__*/_jsxs(CardHeader, {
              children: [/*#__PURE__*/_jsxs(CardTitle, {
                className: "text-sm font-bold flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(Crown, {
                  className: "size-4 text-primary"
                }), "Upgrade to Pro"]
              }), /*#__PURE__*/_jsx(CardDescription, {
                className: "text-[10px]",
                children: "Get unlimited credits and access to premium features."
              })]
            }), /*#__PURE__*/_jsxs(CardContent, {
              className: "space-y-3",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "space-y-2",
                children: [/*#__PURE__*/_jsxs("div", {
                  className: "flex items-center gap-2 text-xs text-muted-foreground",
                  children: [/*#__PURE__*/_jsx(CheckCircle2, {
                    className: "size-3 text-emerald-400"
                  }), "Unlimited AI generations"]
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex items-center gap-2 text-xs text-muted-foreground",
                  children: [/*#__PURE__*/_jsx(CheckCircle2, {
                    className: "size-3 text-emerald-400"
                }), "Access to premium AI models (Claude Sonnet, GPT-4o)"]
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex items-center gap-2 text-xs text-muted-foreground",
                  children: [/*#__PURE__*/_jsx(CheckCircle2, {
                    className: "size-3 text-emerald-400"
                }), "Priority support"]
                })]
              })]
            }), /*#__PURE__*/_jsxs(CardFooter, {
              className: "border-t border-border/30 bg-muted/10 px-6 py-3 flex justify-end",
              children: /*#__PURE__*/_jsx(Button, {
                onClick: handleUpgradePlan,
                disabled: upgrading,
                className: "bg-primary hover:bg-primary/90 text-xs font-bold gap-1.5",
                children: [upgrading ? /*#__PURE__*/_jsx(Loader2, {
                  className: "size-3.5 animate-spin"
                }) : /*#__PURE__*/_jsx(Zap, {
                  className: "size-3.5"
                }), "Upgrade Now"]
              })
            })]
          })]
        })]
      }) : /*#__PURE__*/_jsxs("div", {
        className: "w-full max-w-lg space-y-6",
        children: [/*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsxs("h2", {
            className: "text-xl font-bold tracking-tight mb-1 flex items-center gap-2",
            children: [/*#__PURE__*/_jsx(User, {
              className: "size-5 text-foreground"
            }), "Account Profile"]
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "View your account information and manage your session."
          })]
        }), /*#__PURE__*/_jsxs(Card, {
          className: "bg-card/45 backdrop-blur-md border-border/80",
          children: [/*#__PURE__*/_jsx(CardHeader, {
            children: /*#__PURE__*/_jsxs(CardTitle, {
              className: "text-sm font-bold flex items-center gap-2",
              children: [/*#__PURE__*/_jsx(User, {
                className: "size-4 text-primary"
              }), "Account Information"]
            })
          }), /*#__PURE__*/_jsxs(CardContent, {
            className: "space-y-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "space-y-1.5",
              children: [/*#__PURE__*/_jsx("label", {
                className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
                children: "Username"
              }), /*#__PURE__*/_jsx(Input, {
                value: user?.username || "",
                readOnly: true,
                className: "bg-muted/30"
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "space-y-1.5",
              children: [/*#__PURE__*/_jsx("label", {
                className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wide",
                children: "Email"
              }), /*#__PURE__*/_jsx(Input, {
                value: user?.email || "",
                readOnly: true,
                className: "bg-muted/30"
              })]
            })]
          }), /*#__PURE__*/_jsx(CardFooter, {
            className: "border-t border-border/30 bg-muted/10 px-6 py-3 flex justify-end",
            children: /*#__PURE__*/_jsx(Button, {
              variant: "outline",
              size: "sm",
              onClick: () => logout(),
              className: "text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold",
              children: "Sign Out"
            })
          })]
        })]
      })
    })]
  });
}
