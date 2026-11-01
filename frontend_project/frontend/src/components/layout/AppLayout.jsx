import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, Menu, Settings, X, Zap, Infinity, LogOut } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { createApiClient } from "@/lib/api-client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const NAV_ITEMS = [{
  label: "Dashboard",
  href: "/dashboard",
  icon: BarChart3
}, {
  label: "Analytics",
  href: "/analytics",
  icon: BarChart3
}, {
  label: "Settings",
  href: "/settings",
  icon: Settings
}];
export default function AppLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    getToken,
    isLoaded,
    isSignedIn,
    user,
    logout
  } = useAuth();
  const [credits, setCredits] = useState(null);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchCredits = async () => {
      try {
        const client = createApiClient(getToken);
        const data = await client.credits.get();
        setCredits(data);
      } catch (err) {
        console.error("Failed to fetch credits:", err);
      }
    };
    fetchCredits();
    const interval = setInterval(fetchCredits, 30000);
    const handleRefresh = () => fetchCredits();
    window.addEventListener("refresh-credits", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-credits", handleRefresh);
    };
  }, [isLoaded, isSignedIn, getToken]);
  const isEditorPage = pathname.startsWith("/project/") || pathname.startsWith("/preview/");
  if (isEditorPage) {
    return /*#__PURE__*/_jsx("div", {
      className: "flex h-screen flex-col bg-background text-foreground",
      children: /*#__PURE__*/_jsx("div", {
        className: "flex flex-1 overflow-hidden",
        children: /*#__PURE__*/_jsx(Outlet, {})
      })
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "flex h-screen bg-background text-foreground",
    children: [sidebarOpen && /*#__PURE__*/_jsx("div", {
      className: "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden",
      onClick: () => setSidebarOpen(false)
    }), /*#__PURE__*/_jsxs("aside", {
      className: cn("fixed inset-y-0 min-h-screen left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full"),
      children: [/*#__PURE__*/_jsxs("div", {
        className: "flex h-16 items-center justify-between px-5",
        children: [/*#__PURE__*/_jsx(Link, {
          to: "/dashboard",
          className: "flex items-center gap-2 text-lg font-semibold tracking-tight",
          children: "WebCraft"
        }), /*#__PURE__*/_jsx(Button, {
          variant: "ghost",
          size: "icon-xs",
          className: "md:hidden",
          onClick: () => setSidebarOpen(false),
          children: /*#__PURE__*/_jsx(X, {
            className: "size-4"
          })
        })]
      }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsx("nav", {
        className: "flex-1 space-y-1 px-3 py-4",
        children: NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || item.href === "/settings" && pathname.startsWith("/settings");
          return /*#__PURE__*/_jsxs(Link, {
            to: item.href,
            onClick: () => setSidebarOpen(false),
            className: cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"),
            children: [/*#__PURE__*/_jsx(item.icon, {
              className: "size-4"
            }), item.label]
          }, item.href);
        })
      }), /*#__PURE__*/_jsx("div", {
        className: "px-4 py-4 shrink-0",
        children: !credits ? /*#__PURE__*/_jsxs("div", {
          className: "space-y-2 rounded-xl bg-sidebar-accent/30 p-3.5 border border-sidebar-border animate-pulse",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex justify-between items-center",
            children: [/*#__PURE__*/_jsx("div", {
              className: "h-3 w-16 rounded bg-muted/60"
            }), /*#__PURE__*/_jsx("div", {
              className: "h-3 w-8 rounded bg-muted/60"
            })]
          }), /*#__PURE__*/_jsx("div", {
            className: "h-1.5 w-full rounded-full bg-muted/40"
          })]
        }) : String(credits.plan || "").toLowerCase() === "pro" || credits.remaining === -1 ? /*#__PURE__*/_jsxs("div", {
          className: "group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-4 transition-all duration-300 hover:border-primary/45 hover:shadow-[0_0_20px_rgba(109,156,255,0.08)]",
          children: [/*#__PURE__*/_jsx("div", {
            className: "absolute -right-6 -bottom-6 size-24 rounded-full bg-primary/10 blur-xl transition-all duration-500 group-hover:scale-125"
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-2.5",
            children: [/*#__PURE__*/_jsx("div", {
              className: "flex size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20",
              children: /*#__PURE__*/_jsx(Zap, {
                className: "size-4 text-primary animate-pulse"
              })
            }), /*#__PURE__*/_jsxs("div", {
              children: [/*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-1.5",
                children: [/*#__PURE__*/_jsx("span", {
                  className: "text-[13px] font-bold text-foreground",
                  children: "Pro Plan"
                }), /*#__PURE__*/_jsx("span", {
                  className: "rounded bg-gradient-to-r from-primary to-accent px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-primary-foreground shadow-sm",
                  children: "PRO"
                })]
              }), /*#__PURE__*/_jsxs("div", {
                className: "mt-1 flex items-center gap-1 text-[11px] text-muted-foreground",
                children: ["Quota: ", /*#__PURE__*/_jsx(Infinity, {
                  className: "size-3 text-foreground"
                })]
              })]
            })]
          })]
        }) : /*#__PURE__*/_jsxs("div", {
          className: "rounded-xl border border-sidebar-border/60 bg-sidebar-accent/10 p-4 transition-all duration-200 hover:border-sidebar-border/90",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex justify-between items-center mb-2",
            children: [/*#__PURE__*/_jsx("span", {
              className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
              children: "Credits"
            }), /*#__PURE__*/_jsxs("span", {
              className: "text-xs font-extrabold text-foreground",
              children: [credits.remaining, " / ", credits.total]
            })]
          }), /*#__PURE__*/_jsx("div", {
            className: "w-full rounded-full bg-muted/30 h-1.5 overflow-hidden",
            children: /*#__PURE__*/_jsx("div", {
              className: cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", credits.remaining < 10 ? "from-amber-500 to-rose-500" : "from-primary to-accent"),
              style: {
                width: `${Math.min(100, credits.remaining / credits.total * 100)}%`
              }
            })
          }), /*#__PURE__*/_jsxs(Link, {
            to: "/settings",
            className: "mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 border border-border/40",
            children: [/*#__PURE__*/_jsx(Zap, {
              className: "size-3 text-primary fill-primary/20 animate-bounce"
            }), "Upgrade to Pro"]
          })]
        })
      }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs("div", {
        className: "flex items-center gap-3 px-5 py-4",
        children: [/*#__PURE__*/_jsx("div", {
          className: "flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold",
          children: user?.username?.charAt(0).toUpperCase() || "U"
        }), /*#__PURE__*/_jsx("span", {
          className: "text-sm text-muted-foreground flex-1",
          children: user?.displayName || user?.username || "Account"
        }), /*#__PURE__*/_jsx(Button, {
          variant: "ghost",
          size: "icon-xs",
          onClick: logout,
          title: "Sign out",
          children: /*#__PURE__*/_jsx(LogOut, {
            className: "size-4"
          })
        })]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "flex flex-1 flex-col overflow-hidden",
      children: [/*#__PURE__*/_jsxs("header", {
        className: "flex h-16 shrink-0 items-center gap-3 border-b border-border px-6 md:hidden",
        children: [/*#__PURE__*/_jsx(Button, {
          variant: "ghost",
          size: "icon-sm",
          onClick: () => setSidebarOpen(true),
          children: /*#__PURE__*/_jsx(Menu, {
            className: "size-5"
          })
        }), /*#__PURE__*/_jsxs("span", {
          className: "flex items-center gap-2 text-sm font-semibold",
          children: [/*#__PURE__*/_jsx("img", {
            src: "/logo.png",
            alt: "",
            className: "size-5"
          }), "WebCraft"]
        })]
      }), /*#__PURE__*/_jsx("main", {
        className: "flex-1 overflow-y-auto animate-fade-in",
        children: /*#__PURE__*/_jsx(Outlet, {})
      })]
    })]
  });
}
