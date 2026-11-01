import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { createApiClient } from "@/lib/api-client";
import { BarChart3, Layers, Cpu, Zap, Calendar, Clock, RefreshCw, History } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];
export default function AnalyticsPage() {
  const {
    getToken,
    isLoaded,
    isSignedIn
  } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const client = createApiClient(getToken);
      const res = await client.analytics.get();
      setData(res);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setMounted(true);
    if (isLoaded && isSignedIn) {
      fetchAnalytics();
    }
  }, [isLoaded, isSignedIn]);
  if (!mounted || loading || !data) {
    return /*#__PURE__*/_jsx(AnalyticsSkeleton, {});
  }
  const {
    stats,
    modelUsage,
    timeline,
    recentGenerations
  } = data;

  // Transform modelUsage object to array for PieChart
  const pieData = Object.entries(modelUsage).map(([name, value]) => ({
    name: name.replace("gemini-", "").replace("-flash", " Flash").replace("-pro", " Pro"),
    value
  }));
  return /*#__PURE__*/_jsxs("div", {
    className: "flex flex-col gap-8 p-6 max-w-7xl mx-auto",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between",
      children: [/*#__PURE__*/_jsxs("div", {
        children: [/*#__PURE__*/_jsxs("h1", {
          className: "text-2xl font-bold tracking-tight text-foreground flex items-center gap-2",
          children: [/*#__PURE__*/_jsx(BarChart3, {
            className: "size-6 text-primary"
          }), "Analytics & Performance"]
        }), /*#__PURE__*/_jsx("p", {
          className: "text-xs text-muted-foreground",
          children: "Monitor your AI generations, credits usage, and workspace history."
        })]
      }), /*#__PURE__*/_jsxs("button", {
        onClick: fetchAnalytics,
        className: "flex shrink-0 w-fit items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-150 active:scale-95",
        children: [/*#__PURE__*/_jsx(RefreshCw, {
          className: "size-3.5 text-muted-foreground"
        }), "Refresh"]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
      children: [/*#__PURE__*/_jsxs(Card, {
        className: "bg-card/45 backdrop-blur-md border-border/80 relative overflow-hidden group transition-all duration-200 hover:border-primary/20",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none blur-md transition-all duration-300 group-hover:bg-primary/10"
        }), /*#__PURE__*/_jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between pb-2 space-y-0",
          children: [/*#__PURE__*/_jsx(CardTitle, {
            className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            children: "Total Projects"
          }), /*#__PURE__*/_jsx(Layers, {
            className: "size-4.5 text-primary"
          })]
        }), /*#__PURE__*/_jsxs(CardContent, {
          children: [/*#__PURE__*/_jsx("div", {
            className: "text-3xl font-extrabold tracking-tight",
            children: stats.totalProjects
          }), /*#__PURE__*/_jsx("p", {
            className: "text-[10px] text-muted-foreground mt-1",
            children: "Active workspaces created"
          })]
        })]
      }), /*#__PURE__*/_jsxs(Card, {
        className: "bg-card/45 backdrop-blur-md border-border/80 relative overflow-hidden group transition-all duration-200 hover:border-accent/20",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full pointer-events-none blur-md transition-all duration-300 group-hover:bg-accent/10"
        }), /*#__PURE__*/_jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between pb-2 space-y-0",
          children: [/*#__PURE__*/_jsx(CardTitle, {
            className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            children: "AI Generations"
          }), /*#__PURE__*/_jsx(Cpu, {
            className: "size-4.5 text-accent"
          })]
        }), /*#__PURE__*/_jsxs(CardContent, {
          children: [/*#__PURE__*/_jsx("div", {
            className: "text-3xl font-extrabold tracking-tight",
            children: stats.totalGenerations
          }), /*#__PURE__*/_jsx("p", {
            className: "text-[10px] text-muted-foreground mt-1",
            children: "Total model runs & edits"
          })]
        })]
      }), /*#__PURE__*/_jsxs(Card, {
        className: "bg-card/45 backdrop-blur-md border-border/80 relative overflow-hidden group transition-all duration-200 hover:border-emerald-500/20",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none blur-md transition-all duration-300 group-hover:bg-emerald-500/10"
        }), /*#__PURE__*/_jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between pb-2 space-y-0",
          children: [/*#__PURE__*/_jsx(CardTitle, {
            className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            children: "Credits Spent"
          }), /*#__PURE__*/_jsx(Zap, {
            className: "size-4.5 text-emerald-500 animate-pulse"
          })]
        }), /*#__PURE__*/_jsxs(CardContent, {
          children: [/*#__PURE__*/_jsx("div", {
            className: "text-3xl font-extrabold tracking-tight",
            children: stats.creditsUsed
          }), /*#__PURE__*/_jsx("p", {
            className: "text-[10px] text-muted-foreground mt-1",
            children: stats.creditsRemaining === -1 ? "Unlimited quota on Pro plan" : `${stats.creditsRemaining} remaining this month`
          })]
        })]
      }), /*#__PURE__*/_jsxs(Card, {
        className: "bg-card/45 backdrop-blur-md border-border/80 relative overflow-hidden group transition-all duration-200 hover:border-violet-500/20",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none blur-md transition-all duration-300 group-hover:bg-violet-500/10"
        }), /*#__PURE__*/_jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between pb-2 space-y-0",
          children: [/*#__PURE__*/_jsx(CardTitle, {
            className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            children: "Active Subscription"
          }), /*#__PURE__*/_jsx("div", {
            className: "size-4.5 flex items-center justify-center font-bold text-violet-500",
            children: "★"
          })]
        }), /*#__PURE__*/_jsxs(CardContent, {
          children: [/*#__PURE__*/_jsxs("div", {
            className: "text-2xl font-black uppercase tracking-wide bg-gradient-to-r from-primary via-accent to-violet-400 bg-clip-text text-transparent",
            children: [stats.plan, " tier"]
          }), /*#__PURE__*/_jsx("p", {
            className: "text-[10px] text-muted-foreground mt-1",
            children: "Full feature set enabled"
          })]
        })]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "grid gap-6 md:grid-cols-3",
      children: [/*#__PURE__*/_jsxs(Card, {
        className: "md:col-span-2 bg-card/30 border-border/60",
        children: [/*#__PURE__*/_jsxs(CardHeader, {
          children: [/*#__PURE__*/_jsxs(CardTitle, {
            className: "text-sm font-semibold flex items-center gap-1.5",
            children: [/*#__PURE__*/_jsx(Calendar, {
              className: "size-4 text-primary"
            }), "Activity & Velocity"]
          }), /*#__PURE__*/_jsx(CardDescription, {
            className: "text-[10px]",
            children: "Daily volume of projects and AI generation updates"
          })]
        }), /*#__PURE__*/_jsx(CardContent, {
          className: "h-[280px] pl-0",
          children: timeline.length > 0 ? /*#__PURE__*/_jsx(ResponsiveContainer, {
            width: "100%",
            height: "100%",
            children: /*#__PURE__*/_jsxs(AreaChart, {
              data: timeline,
              margin: {
                top: 10,
                right: 10,
                left: -20,
                bottom: 0
              },
              children: [/*#__PURE__*/_jsxs("defs", {
                children: [/*#__PURE__*/_jsxs("linearGradient", {
                  id: "colorGenerations",
                  x1: "0",
                  y1: "0",
                  x2: "0",
                  y2: "1",
                  children: [/*#__PURE__*/_jsx("stop", {
                    offset: "5%",
                    stopColor: "#6366f1",
                    stopOpacity: 0.2
                  }), /*#__PURE__*/_jsx("stop", {
                    offset: "95%",
                    stopColor: "#6366f1",
                    stopOpacity: 0
                  })]
                }), /*#__PURE__*/_jsxs("linearGradient", {
                  id: "colorProjects",
                  x1: "0",
                  y1: "0",
                  x2: "0",
                  y2: "1",
                  children: [/*#__PURE__*/_jsx("stop", {
                    offset: "5%",
                    stopColor: "#ec4899",
                    stopOpacity: 0.2
                  }), /*#__PURE__*/_jsx("stop", {
                    offset: "95%",
                    stopColor: "#ec4899",
                    stopOpacity: 0
                  })]
                })]
              }), /*#__PURE__*/_jsx(XAxis, {
                dataKey: "date",
                tickLine: false,
                axisLine: false,
                tick: {
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))"
                }
              }), /*#__PURE__*/_jsx(YAxis, {
                tickLine: false,
                axisLine: false,
                allowDecimals: false,
                tick: {
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))"
                }
              }), /*#__PURE__*/_jsx(ChartTooltip, {
                contentStyle: {
                  background: "rgba(13, 14, 18, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "11px"
                }
              }), /*#__PURE__*/_jsx(Area, {
                type: "monotone",
                dataKey: "generations",
                name: "Generations",
                stroke: "#6366f1",
                strokeWidth: 2,
                fillOpacity: 1,
                fill: "url(#colorGenerations)"
              }), /*#__PURE__*/_jsx(Area, {
                type: "monotone",
                dataKey: "projects",
                name: "New Projects",
                stroke: "#ec4899",
                strokeWidth: 2,
                fillOpacity: 1,
                fill: "url(#colorProjects)"
              })]
            })
          }) : /*#__PURE__*/_jsx("div", {
            className: "h-full flex items-center justify-center text-xs text-muted-foreground",
            children: "No activity recorded yet"
          })
        })]
      }), /*#__PURE__*/_jsxs(Card, {
        className: "bg-card/30 border-border/60",
        children: [/*#__PURE__*/_jsxs(CardHeader, {
          children: [/*#__PURE__*/_jsxs(CardTitle, {
            className: "text-sm font-semibold flex items-center gap-1.5",
            children: [/*#__PURE__*/_jsx(Cpu, {
              className: "size-4 text-accent"
            }), "Model Distribution"]
          }), /*#__PURE__*/_jsx(CardDescription, {
            className: "text-[10px]",
            children: "Breakdown of AI engines powering your generations"
          })]
        }), /*#__PURE__*/_jsx(CardContent, {
          className: "h-[280px] flex flex-col justify-center items-center",
          children: pieData.length > 0 ? /*#__PURE__*/_jsxs(_Fragment, {
            children: [/*#__PURE__*/_jsx("div", {
              className: "w-full h-[180px]",
              children: /*#__PURE__*/_jsx(ResponsiveContainer, {
                width: "100%",
                height: "100%",
                children: /*#__PURE__*/_jsxs(PieChart, {
                  children: [/*#__PURE__*/_jsx(Pie, {
                    data: pieData,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: 50,
                    outerRadius: 70,
                    paddingAngle: 4,
                    dataKey: "value",
                    children: pieData.map((entry, index) => /*#__PURE__*/_jsx(Cell, {
                      fill: COLORS[index % COLORS.length]
                    }, `cell-${index}`))
                  }), /*#__PURE__*/_jsx(ChartTooltip, {
                    contentStyle: {
                      background: "rgba(13, 14, 18, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px"
                    }
                  })]
                })
              })
            }), /*#__PURE__*/_jsx("div", {
              className: "mt-2 grid grid-cols-2 gap-2 text-[10px] w-full px-2",
              children: pieData.map((entry, idx) => /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-1.5",
                children: [/*#__PURE__*/_jsx("span", {
                  className: "size-2 rounded-full shrink-0",
                  style: {
                    backgroundColor: COLORS[idx % COLORS.length]
                  }
                }), /*#__PURE__*/_jsxs("span", {
                  className: "truncate text-muted-foreground",
                  children: [entry.name, ": ", /*#__PURE__*/_jsx("strong", {
                    className: "text-foreground",
                    children: entry.value
                  })]
                })]
              }, idx))
            })]
          }) : /*#__PURE__*/_jsx("div", {
            className: "h-full flex items-center justify-center text-xs text-muted-foreground",
            children: "No models recorded yet"
          })
        })]
      })]
    }), /*#__PURE__*/_jsxs(Card, {
      className: "bg-card/20 border-border/50",
      children: [/*#__PURE__*/_jsx(CardHeader, {
        className: "flex flex-row items-center justify-between pb-3",
        children: /*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsxs(CardTitle, {
            className: "text-sm font-semibold flex items-center gap-1.5",
            children: [/*#__PURE__*/_jsx(History, {
              className: "size-4 text-muted-foreground"
            }), "Recent Generation Runs"]
          }), /*#__PURE__*/_jsx(CardDescription, {
            className: "text-[10px]",
            children: "Audit log of the last 10 AI operations executed in your workspace"
          })]
        })
      }), /*#__PURE__*/_jsx(CardContent, {
        className: "px-0 pb-0",
        children: recentGenerations.length > 0 ? /*#__PURE__*/_jsx("div", {
          className: "overflow-x-auto",
          children: /*#__PURE__*/_jsxs("table", {
            className: "w-full text-left border-collapse text-xs",
            children: [/*#__PURE__*/_jsx("thead", {
              children: /*#__PURE__*/_jsxs("tr", {
                className: "border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold",
                children: [/*#__PURE__*/_jsx("th", {
                  className: "p-3",
                  children: "Project"
                }), /*#__PURE__*/_jsx("th", {
                  className: "p-3",
                  children: "Version"
                }), /*#__PURE__*/_jsx("th", {
                  className: "p-3",
                  children: "Trigger Type"
                }), /*#__PURE__*/_jsx("th", {
                  className: "p-3",
                  children: "AI Engine"
                }), /*#__PURE__*/_jsx("th", {
                  className: "p-3",
                  children: "Prompt Description"
                }), /*#__PURE__*/_jsx("th", {
                  className: "p-3",
                  children: "Files"
                }), /*#__PURE__*/_jsx("th", {
                  className: "p-3",
                  children: "Date"
                })]
              })
            }), /*#__PURE__*/_jsx("tbody", {
              children: recentGenerations.map((gen, index) => /*#__PURE__*/_jsxs("tr", {
                className: "border-b border-border/30 hover:bg-muted/10 transition-colors duration-150",
                children: [/*#__PURE__*/_jsx("td", {
                  className: "p-3 font-semibold text-foreground truncate max-w-[150px]",
                  children: gen.projectName
                }), /*#__PURE__*/_jsx("td", {
                  className: "p-3",
                  children: /*#__PURE__*/_jsxs("span", {
                    className: "rounded-full bg-muted/70 px-2 py-0.5 font-mono text-[10px]",
                    children: ["v", gen.versionNumber]
                  })
                }), /*#__PURE__*/_jsx("td", {
                  className: "p-3",
                  children: /*#__PURE__*/_jsx("span", {
                    className: cn("rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide", gen.type === "ai" ? "bg-primary/10 text-primary" : gen.type === "manual" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"),
                    children: gen.type
                  })
                }), /*#__PURE__*/_jsx("td", {
                  className: "p-3 font-mono text-muted-foreground text-[10px]",
                  children: gen.model.replace("gemini-", "")
                }), /*#__PURE__*/_jsx("td", {
                  className: "p-3 max-w-xs truncate text-muted-foreground",
                  title: gen.prompt,
                  children: gen.prompt || /*#__PURE__*/_jsx("em", {
                    className: "text-muted-foreground/40",
                    children: "Initial project layout"
                  })
                }), /*#__PURE__*/_jsx("td", {
                  className: "p-3 font-medium text-foreground",
                  children: gen.fileCount
                }), /*#__PURE__*/_jsxs("td", {
                  className: "p-3 text-muted-foreground flex items-center gap-1",
                  children: [/*#__PURE__*/_jsx(Clock, {
                    className: "size-3 text-muted-foreground/60"
                  }), new Date(gen.createdAt).toLocaleDateString(), " ", new Date(gen.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })]
                })]
              }, index))
            })]
          })
        }) : /*#__PURE__*/_jsx("div", {
          className: "py-8 text-center text-xs text-muted-foreground",
          children: "No generation runs found. Create a project to populate metrics."
        })
      })]
    })]
  });
}
function AnalyticsSkeleton() {
  return /*#__PURE__*/_jsxs("div", {
    className: "flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-pulse",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex flex-col gap-2",
      children: [/*#__PURE__*/_jsx(Skeleton, {
        className: "h-7 w-56 rounded"
      }), /*#__PURE__*/_jsx(Skeleton, {
        className: "h-4 w-96 rounded"
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
      children: Array.from({
        length: 4
      }).map((_, i) => /*#__PURE__*/_jsx(Skeleton, {
        className: "h-24 rounded-xl"
      }, i))
    }), /*#__PURE__*/_jsxs("div", {
      className: "grid gap-6 md:grid-cols-3",
      children: [/*#__PURE__*/_jsx(Skeleton, {
        className: "md:col-span-2 h-[340px] rounded-xl"
      }), /*#__PURE__*/_jsx(Skeleton, {
        className: "h-[340px] rounded-xl"
      })]
    }), /*#__PURE__*/_jsx(Skeleton, {
      className: "h-72 rounded-xl"
    })]
  });
}
