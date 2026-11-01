"use client";

import { useSandpack, SandpackProvider, SandpackPreview, SandpackLayout } from "@codesandbox/sandpack-react";
import { useEffect } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const VIRTUAL_WIDTH = 1024;
const VIRTUAL_HEIGHT = 640;
function toSandpackFiles(files) {
  const sandpackFiles = {};
  for (const [path, content] of Object.entries(files)) {
    const sandpackPath = path.startsWith("src/") ? `/${path.slice(4)}` : `/${path}`;
    sandpackFiles[sandpackPath] = {
      code: content
    };
  }
  return sandpackFiles;
}
function extractDependencies(files) {
  const baseDeps = {
    react: "^18.2.0",
    "react-dom": "^18.2.0"
  };
  const packageJsonContent = files["package.json"];
  if (!packageJsonContent) {
    return baseDeps;
  }
  try {
    const parse = JSON.parse(packageJsonContent);
    return {
      ...baseDeps,
      ...(parse.dependencies || {})
    };
  } catch (error) {
    return baseDeps;
  }
}
function LoadNotifier({
  onLoad
}) {
  const {
    listen
  } = useSandpack();
  useEffect(() => {
    if (!onLoad) return;
    const unsubscribe = listen(message => {
      if (message.type === "done") {
        onLoad();
      }
    });
    return unsubscribe;
  }, [listen, onLoad]);
  return null;
}
export function ProjectPreview({
  files,
  onLoad
}) {
  const sandpackFiles = toSandpackFiles(files);
  const dependencies = extractDependencies(files);
  return /*#__PURE__*/_jsx("div", {
    className: "origin-top-left",
    style: {
      width: VIRTUAL_WIDTH,
      height: VIRTUAL_HEIGHT
    },
    children: /*#__PURE__*/_jsx("div", {
      className: "sandpack-stretch h-full w-full",
      children: /*#__PURE__*/_jsxs(SandpackProvider, {
        template: "react-ts",
        theme: "dark",
        files: sandpackFiles,
        options: {
          externalResources: ["https://cdn.tailwindcss.com"]
        },
        customSetup: {
          dependencies
        },
        children: [/*#__PURE__*/_jsx(LoadNotifier, {
          onLoad: onLoad
        }), /*#__PURE__*/_jsx(SandpackLayout, {
          style: {
            height: "100%",
            border: "none",
            borderRadius: 0
          },
          children: /*#__PURE__*/_jsx(SandpackPreview, {
            showNavigator: false,
            showOpenInCodeSandbox: false,
            showRefreshButton: false,
            style: {
              height: "100%"
            }
          })
        })]
      })
    })
  });
}
