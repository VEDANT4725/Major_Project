"use client";

import { Link } from "react-router-dom";
import React from "react";
import { useAuth } from "@/components/auth";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowRight, Plus, Terminal, Sparkles } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Hero() {
  const {
    isSignedIn
  } = useAuth();
  const destination = isSignedIn ? "/dashboard" : "/register";
  const handleOpenReport = () => {
    window.open("/project-report/FINAL_REPORT_BLUEPRINT_AI.pdf", "_blank");
  };
  return /*#__PURE__*/_jsxs("section", {
    className: "relative flex min-h-screen items-center justify-center bg-gradient-to-b from-[#08080A] via-[#0B0B0F] to-[#121217] px-6 pt-24 pb-16 overflow-hidden",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "pointer-events-none absolute inset-0 overflow-hidden",
      children: [/*#__PURE__*/_jsx("div", {
        className: "absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none"
      }), /*#__PURE__*/_jsx("div", {
        className: "absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none"
      }), /*#__PURE__*/_jsx("div", {
        className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[80%] rounded-full bg-indigo-500/5 blur-[160px] pointer-events-none"
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "relative z-10 mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "flex flex-col items-start text-left space-y-6 lg:max-w-xl",
        children: [/*#__PURE__*/_jsx(Link, {
          to: destination,
          children: /*#__PURE__*/_jsxs(Badge, {
            variant: "secondary",
            className: "gap-2 border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400 backdrop-blur-sm transition-all duration-150 hover:bg-emerald-500/10 hover:border-emerald-500/25",
            children: [/*#__PURE__*/_jsx(Sparkles, {
              className: "size-3.5 text-emerald-400"
            }), /*#__PURE__*/_jsx("span", {
              children: "Introducing WebCraft v3.0"
            }), /*#__PURE__*/_jsx(ArrowRight, {
              className: "size-3"
            })]
          })
        }), /*#__PURE__*/_jsxs("h1", {
          className: "text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]",
          children: ["The AI Engine for ", /*#__PURE__*/_jsx("br", {}), /*#__PURE__*/_jsx("span", {
            className: "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent",
            children: "Web Application"
          }), " ", /*#__PURE__*/_jsx("br", {}), "Software Synthesis."]
        }), /*#__PURE__*/_jsx("p", {
          className: "text-base text-white/60 leading-relaxed",
          children: "An autonomous framework that translates natural language prompts into working code. Describe your vision, edit code in real-time, inspect files, and synchronize directly to GitHub repositories."
        }), /*#__PURE__*/_jsxs("div", {
          className: "grid grid-cols-2 gap-4 w-full pt-2",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-2 text-xs text-white/70",
            children: [/*#__PURE__*/_jsx("span", {
              className: "flex size-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-400",
              children: "✓"
            }), /*#__PURE__*/_jsx("span", {
              children: "Secure Sandpack Preview"
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-2 text-xs text-white/70",
            children: [/*#__PURE__*/_jsx("span", {
              className: "flex size-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-400",
              children: "✓"
            }), /*#__PURE__*/_jsx("span", {
              children: "JWT Session Security"
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-2 text-xs text-white/70",
            children: [/*#__PURE__*/_jsx("span", {
              className: "flex size-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-400",
              children: "✓"
            }), /*#__PURE__*/_jsx("span", {
              children: "ZIP & GitHub OAuth Sync"
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-2 text-xs text-white/70",
            children: [/*#__PURE__*/_jsx("span", {
              className: "flex size-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-400",
              children: "✓"
            }), /*#__PURE__*/_jsx("span", {
              children: "Recharts Core Analytics"
            })]
          })]
        }), /*#__PURE__*/_jsx("div", {
          className: "flex flex-col sm:flex-row gap-3 w-full pt-4",
          children: /*#__PURE__*/_jsx(Button, {
            size: "lg",
            className: "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/15 border-0 text-sm h-11 px-6 rounded-lg",
            asChild: true,
            children: /*#__PURE__*/_jsxs(Link, {
              to: destination,
              children: ["Get Started Free", /*#__PURE__*/_jsx(ArrowRight, {
                className: "size-4 ml-1.5"
              })]
            })
          })
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "w-full relative animate-in fade-in slide-in-from-bottom-6 duration-700",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute inset-0 bg-emerald-500/5 blur-[60px] rounded-3xl"
        }), /*#__PURE__*/_jsxs("div", {
          className: "w-full rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xl shadow-2xl overflow-hidden relative z-10",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/40",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-1.5",
              children: [/*#__PURE__*/_jsx("span", {
                className: "size-3 rounded-full bg-destructive/60"
              }), /*#__PURE__*/_jsx("span", {
                className: "size-3 rounded-full bg-amber-500/60"
              }), /*#__PURE__*/_jsx("span", {
                className: "size-3 rounded-full bg-emerald-500/60"
              })]
            }), /*#__PURE__*/_jsx("div", {
              className: "flex items-center gap-2",
              children: /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-1 px-3 py-1 rounded bg-background border border-border/30 text-[10px] font-mono text-muted-foreground",
                children: [/*#__PURE__*/_jsx(Terminal, {
                  className: "size-3 text-emerald-400"
                }), /*#__PURE__*/_jsx("span", {
                  children: "webcraft-terminal"
                })]
              })
            }), /*#__PURE__*/_jsx("div", {
              className: "w-12"
            }), " "]
          }), /*#__PURE__*/_jsxs("div", {
            className: "p-5 font-mono text-xs text-white/80 space-y-2.5 text-left bg-black/25",
            children: [/*#__PURE__*/_jsx("div", {
              className: "flex items-center gap-2 text-white/40",
              children: /*#__PURE__*/_jsx("span", {
                children: "[sys] initializing webcraft software synthesis kernel v3.0..."
              })
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-2",
              children: [/*#__PURE__*/_jsx("span", {
                className: "text-emerald-400",
                children: "✓"
              }), /*#__PURE__*/_jsx("span", {
                children: "Auth Session handshake complete"
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-2",
              children: [/*#__PURE__*/_jsx("span", {
                className: "text-emerald-400",
                children: "✓"
              }), /*#__PURE__*/_jsx("span", {
                children: "MongoDB KV Metadata mapping initialized"
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-2",
              children: [/*#__PURE__*/_jsx("span", {
                className: "text-emerald-400",
                children: "✓"
              }), /*#__PURE__*/_jsx("span", {
                children: "Gemini LLM system prompt compiler registered"
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-2",
              children: [/*#__PURE__*/_jsx("span", {
                className: "text-emerald-400",
                children: "✓"
              }), /*#__PURE__*/_jsx("span", {
                children: "GitHub OAuth redirection parameters verified"
              })]
            }), /*#__PURE__*/_jsx("div", {
              className: "flex items-center gap-2 text-white/30",
              children: /*#__PURE__*/_jsx("span", {
                children: "$ await user input console authorization..."
              })
            })]
          }), /*#__PURE__*/_jsx("div", {
            className: "p-4 border-t border-border/40 bg-muted/20",
            children: /*#__PURE__*/_jsx(Link, {
              to: destination,
              className: "block",
              children: /*#__PURE__*/_jsxs("div", {
                className: "group relative overflow-hidden rounded-xl border border-white/10 hover:border-emerald-500/30 bg-[#121215]/80 shadow-md transition-all duration-300",
                children: [/*#__PURE__*/_jsx("div", {
                  className: "px-4 py-4 text-left",
                  children: /*#__PURE__*/_jsx("p", {
                    className: "text-xs sm:text-sm text-white/40 font-medium group-hover:text-white/50 transition-colors",
                    children: "Ask WebCraft to create a landing page for your next big idea..."
                  })
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex items-center justify-between px-4 pb-3 pt-2 border-t border-white/5",
                  children: [/*#__PURE__*/_jsx("div", {
                    className: "flex items-center",
                    children: /*#__PURE__*/_jsx("div", {
                      className: "flex size-7 items-center justify-center rounded-lg bg-white/5 text-white/30 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300",
                      children: /*#__PURE__*/_jsx(Plus, {
                        className: "size-4"
                      })
                    })
                  }), /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/*#__PURE__*/_jsx("div", {
                      className: "rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/50",
                      children: "Plan"
                    }), /*#__PURE__*/_jsx("div", {
                      className: "flex size-7 items-center justify-center rounded-full bg-white/10 group-hover:bg-emerald-500 text-white/50 group-hover:text-black transition-all duration-300",
                      children: /*#__PURE__*/_jsx(ArrowRight, {
                        className: "size-3.5"
                      })
                    })]
                  })]
                })]
              })
            })
          })]
        })]
      })]
    })]
  });
}
