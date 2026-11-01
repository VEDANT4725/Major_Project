import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { createApiClient } from "@/lib/api-client";
import { Github, User, CheckCircle2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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

  // Synchronization of tabs between "profile" and "integrations"
  const activeTab = searchParams.get("tab") === "profile" ? "profile" : "integrations";
  const [ghStatus, setGhStatus] = useState(null);
  const [ghLoading, setGhLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [connecting, setConnecting] = useState(false);
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
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      fetchGithubStatus();
    }
  }, [isAuthLoaded, isSignedIn]);
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
  const changeTab = tab => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    navigate(`/settings?${params.toString()}`);
  };
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
