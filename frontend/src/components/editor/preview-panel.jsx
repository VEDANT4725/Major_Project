import React, { useEffect, useRef } from "react";
import { SandpackProvider, SandpackLayout, SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

// Listens for Sandpack errors and dispatches a custom DOM event.
// The parent page captures this event and sets previewError state.
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function SandpackErrorListener() {
  const {
    listen
  } = useSandpack();
  const lastErrorRef = useRef(null);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = listen(payload => {
      if (payload.type === "action" && payload.action === "show-error") {
        const errorMessage = [payload.title, payload.path, payload.message].filter(Boolean).join("\n");

        // Prevent duplicate error events
        if (lastErrorRef.current === errorMessage) return;
        lastErrorRef.current = errorMessage;
        window.dispatchEvent(new CustomEvent("sandpack-error", {
          detail: {
            error: errorMessage
          }
        }));
      }
      if (payload.type === "done") {
        // Clear error ref on successful compile
        lastErrorRef.current = null;
      }
    });
    return unsubscribe;
  }, [listen]);
  return null;
}
function parseEnvContent(content) {
  const env = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Strip quotes if they match on both ends
    if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}
export function PreviewPanel({
  files,
  isStreaming,
  previewError,
  onFixError,
  tasks
}) {
  // Convert paths from "src/App.tsx" to "/src/App.tsx" as expected by Sandpack
  const sandpackFiles = Object.entries(files).reduce((acc, [path, content]) => {
    const spPath = path.startsWith("/") ? path : `/${path}`;
    acc[spPath] = content;
    return acc;
  }, {});

  // Parse env files (.env, .env.local, etc.)
  const envVars = {};
  const envFileKeys = [".env", ".env.local", "/.env", "/.env.local"];
  for (const key of envFileKeys) {
    if (files[key]) {
      const parsed = parseEnvContent(files[key]);
      Object.assign(envVars, parsed);
    }
  }
  const envScript = `<script>
      window.process = window.process || {};
      window.process.env = {
        ...window.process.env,
        ${Object.entries(envVars).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n        ")}
      };
    </script>`;
  const envScriptBlock = `\n    <!-- ENV_VARS_START -->\n    ${envScript}\n    <!-- ENV_VARS_END -->\n`;

  // Inject env vars and Tailwind CDN in public/index.html in-memory for preview compilation
  const indexHtmlPath = "/public/index.html";
  if (!sandpackFiles[indexHtmlPath]) {
    sandpackFiles[indexHtmlPath] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
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
        overflow: auto;
        min-height: 100vh;
      }
      #root {
        display: block;
      }
      * {
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  } else {
    let content = sandpackFiles[indexHtmlPath];

    // Replace or insert the env script block
    if (content.includes("<!-- ENV_VARS_START -->") && content.includes("<!-- ENV_VARS_END -->")) {
      const startIndex = content.indexOf("<!-- ENV_VARS_START -->");
      const endIndex = content.indexOf("<!-- ENV_VARS_END -->") + "<!-- ENV_VARS_END -->".length;
      content = content.slice(0, startIndex) + envScriptBlock + content.slice(endIndex);
    } else {
      if (content.includes("</head>")) {
        content = content.replace("</head>", `${envScriptBlock}</head>`);
      } else {
        content = envScriptBlock + content;
      }
    }
    if (!content.includes("cdn.tailwindcss.com")) {
      const scriptStyleStr = `\n  <script src="https://cdn.tailwindcss.com"></script>\n  <style>html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; overflow: auto; min-height: 100vh; display: block; } * { box-sizing: border-box; }</style>\n`;
      if (content.includes("</head>")) {
        content = content.replace("</head>", `${scriptStyleStr}</head>`);
      } else {
        content = scriptStyleStr + content;
      }
    }
    sandpackFiles[indexHtmlPath] = content;
  }
  const hasFiles = Object.keys(sandpackFiles).length > 0;
  const packageJsonPath = files["package.json"] ? "package.json" : "/package.json";
  let packageDependencies = {};
  const rawPackageJson = files[packageJsonPath];
  if (rawPackageJson) {
    try {
      const trimmed = rawPackageJson.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        packageDependencies = parsed?.dependencies || {};
      }
    } catch {
      // Silently ignore during initial extraction
    }
  }
  const baseDependencies = {
    "lucide-react": "latest",
    "date-fns": "latest",
    "recharts": "latest",
    "react-router-dom": "latest",
    "framer-motion": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "class-variance-authority": "latest",
    "@radix-ui/react-slot": "latest"
  };

  // Final safety check for package.json to prevent Sandpack crashes
  let finalSandpackFiles = sandpackFiles;
  let isPackageJsonValid = true;
  const pJson = finalSandpackFiles["/package.json"] || finalSandpackFiles["package.json"];
  if (pJson) {
    try {
      const trimmed = pJson.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Not an object");
        }
      } else {
        isPackageJsonValid = false;
      }
    } catch (e) {
      isPackageJsonValid = false;
      if (!isStreaming || pJson.includes("}")) {
        console.warn("[PreviewPanel] package.json is invalid, using fallback", e);
      }
    }
  }
  if (!isPackageJsonValid) {
    const {
      ["/package.json"]: _p1,
      ["package.json"]: _p2,
      ...rest
    } = finalSandpackFiles;
    finalSandpackFiles = rest;
  }

  // Filter out build-time Node-only/Tailwind packages to prevent Sandpack dependency resolution errors
  const excludedDependencies = ["tailwindcss", "postcss", "autoprefixer", "tailwindcss-animate"];
  const filteredPackageDependencies = Object.fromEntries(Object.entries(packageDependencies).filter(([key]) => !excludedDependencies.includes(key) && !key.startsWith("@tailwindcss/")));
  const sandpackDependencies = {
    ...baseDependencies,
    ...filteredPackageDependencies
  };
  if (isStreaming) {
    const tasksToDisplay = tasks && tasks.length > 0 ? tasks : [{
      description: "Understanding your request",
      status: "in_progress"
    }, {
      description: "Generating files",
      status: "pending"
    }, {
      description: "Preparing preview",
      status: "pending"
    }];
    const completedCount = tasksToDisplay.filter(t => t.status === "completed").length;
    const totalCount = tasksToDisplay.length;
    const progressPercent = totalCount > 0 ? completedCount / totalCount * 100 : 0;
    return /*#__PURE__*/_jsxs("div", {
      className: "h-full w-full flex flex-col items-center justify-center bg-card text-card-foreground p-6 relative overflow-hidden",
      children: [/*#__PURE__*/_jsx("div", {
        className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent rounded-full blur-[80px] pointer-events-none animate-pulse duration-4000"
      }), /*#__PURE__*/_jsxs("div", {
        className: "relative z-10 w-full max-w-md bg-background/40 backdrop-blur-xl border border-primary/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(109,156,255,0.15)] flex flex-col gap-6",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "flex flex-col items-center text-center",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "relative mb-4",
            children: [/*#__PURE__*/_jsx("div", {
              className: "absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-30 blur-md animate-spin duration-10000"
            }), /*#__PURE__*/_jsx("div", {
              className: "relative flex size-14 items-center justify-center rounded-full bg-background border border-primary/20 shadow-inner",
              children: /*#__PURE__*/_jsx(Loader2, {
                className: "size-6 text-primary animate-spin"
              })
            })]
          }), /*#__PURE__*/_jsx("h3", {
            className: "text-xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75",
            children: "Building Project"
          }), /*#__PURE__*/_jsx("p", {
            className: "mt-1 text-xs text-muted-foreground",
            children: "AI is coding your project step-by-step"
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex items-center justify-between text-xs font-semibold text-muted-foreground px-1",
            children: [/*#__PURE__*/_jsx("span", {
              children: "Overall Progress"
            }), /*#__PURE__*/_jsxs("span", {
              className: "text-primary",
              children: [Math.round(progressPercent), "%"]
            })]
          }), /*#__PURE__*/_jsx("div", {
            className: "w-full bg-muted/30 rounded-full h-2 overflow-hidden border border-primary/5",
            children: /*#__PURE__*/_jsx("div", {
              className: "h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-500 ease-out",
              style: {
                width: `${progressPercent}%`
              }
            })
          })]
        }), /*#__PURE__*/_jsx("div", {
          className: "space-y-3 bg-muted/10 border border-primary/5 rounded-xl p-4",
          children: tasksToDisplay.map((task, index) => {
            const isCompleted = task.status === "completed";
            const isInProgress = task.status === "in_progress";
            return /*#__PURE__*/_jsxs("div", {
              className: `flex items-center gap-3 transition-all duration-300 ${isInProgress ? "text-foreground font-medium scale-[1.02]" : isCompleted ? "text-muted-foreground/80" : "text-muted-foreground/45"}`,
              children: [/*#__PURE__*/_jsx("div", {
                className: "flex shrink-0 items-center justify-center size-5",
                children: isCompleted ? /*#__PURE__*/_jsx(CheckCircle2, {
                  className: "size-5 text-emerald-400 fill-emerald-400/10 transition-all duration-300"
                }) : isInProgress ? /*#__PURE__*/_jsx(Loader2, {
                  className: "size-4 text-primary animate-spin"
                }) : /*#__PURE__*/_jsx(Circle, {
                  className: "size-4 text-muted-foreground/30 stroke-[1.5]"
                })
              }), /*#__PURE__*/_jsx("span", {
                className: "text-sm tracking-wide",
                children: task.description
              })]
            }, index);
          })
        }), /*#__PURE__*/_jsx("div", {
          className: "text-center text-[10px] text-muted-foreground/50 border-t border-primary/5 pt-4",
          children: "Do not close this page while generation is active."
        })]
      })]
    });
  }
  const showLoading = !hasFiles;
  if (showLoading) {
    return /*#__PURE__*/_jsxs("div", {
      className: "h-full w-full flex flex-col items-center justify-center bg-card text-card-foreground",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "relative mb-6",
        children: [/*#__PURE__*/_jsx("div", {
          className: "absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl"
        }), /*#__PURE__*/_jsx("div", {
          className: "relative flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-background shadow-lg",
          children: /*#__PURE__*/_jsx("div", {
            className: "size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
          })
        })]
      }), /*#__PURE__*/_jsx("h3", {
        className: "text-lg font-semibold text-foreground tracking-tight",
        children: "Waiting for files..."
      }), /*#__PURE__*/_jsx("p", {
        className: "mt-2 max-w-[280px] text-sm text-center text-muted-foreground",
        children: "Describe your project in the chat to start generating code."
      })]
    });
  }
  const sandpackKey = React.useMemo(() => {
    return `${Object.keys(finalSandpackFiles).length}-${Object.keys(packageDependencies).length}`;
  }, [finalSandpackFiles, packageDependencies]);
  return /*#__PURE__*/_jsxs("div", {
    className: "h-full w-full relative group sandpack-stretch",
    children: [previewError && !isStreaming && onFixError && /*#__PURE__*/_jsx("div", {
      className: "absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-200",
      children: /*#__PURE__*/_jsxs("div", {
        className: "flex flex-col items-center gap-4 max-w-sm text-center px-6",
        children: [/*#__PURE__*/_jsx("div", {
          className: "flex size-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20",
          children: /*#__PURE__*/_jsx("svg", {
            className: "size-6 text-destructive",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: 2,
            children: /*#__PURE__*/_jsx("path", {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            })
          })
        }), /*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsx("h3", {
            className: "text-sm font-semibold text-foreground mb-1",
            children: "Preview Error"
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground font-mono bg-muted rounded-md p-2 text-left max-h-24 overflow-auto",
            children: previewError
          })]
        }), /*#__PURE__*/_jsxs("button", {
          onClick: () => onFixError(previewError),
          className: "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
          children: [/*#__PURE__*/_jsx("svg", {
            className: "size-4",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: 2,
            children: /*#__PURE__*/_jsx("path", {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              d: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            })
          }), "Fix Error with AI"]
        }), /*#__PURE__*/_jsx("button", {
          onClick: () => {
            window.dispatchEvent(new CustomEvent("sandpack-error-dismiss"));
          },
          className: "text-xs text-muted-foreground hover:text-foreground transition-colors",
          children: "Dismiss"
        })]
      })
    }), /*#__PURE__*/_jsxs(SandpackProvider, {
      template: "react-ts",
      theme: "dark",
      files: finalSandpackFiles,
      customSetup: {
        dependencies: sandpackDependencies,
        entry: "/src/index.tsx"
      },
      options: {
        recompileMode: "immediate",
        recompileDelay: 300,
        externalResources: ["https://cdn.tailwindcss.com"]
      },
      children: [/*#__PURE__*/_jsx(SandpackLayout, {
        style: {
          height: "100%",
          width: "100%"
        },
        children: /*#__PURE__*/_jsx(SandpackPreview, {
          showOpenInCodeSandbox: false,
          showRefreshButton: true,
          showNavigator: false,
          style: {
            height: "100%",
            width: "100%"
          }
        })
      }), /*#__PURE__*/_jsx(SandpackErrorListener, {})]
    }, sandpackKey)]
  });
}
