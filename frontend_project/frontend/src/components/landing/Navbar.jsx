import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "@/components/auth";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export function Navbar() {
  const {
    isSignedIn
  } = useAuth();
  return /*#__PURE__*/_jsx("header", {
    className: "fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/40 backdrop-blur-md",
    children: /*#__PURE__*/_jsxs("nav", {
      className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-6",
      children: [/*#__PURE__*/_jsxs(Link, {
        to: "/",
        className: "flex items-center text-lg font-bold tracking-tight text-white hover:opacity-90 transition-opacity",
        children: [/*#__PURE__*/_jsx("span", {
          className: "bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent",
          children: "Web"
        }), /*#__PURE__*/_jsx("span", {
          className: "text-white",
          children: "Craft"
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex items-center gap-3",
        children: [!isSignedIn && /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx(Button, {
            variant: "outline",
            size: "sm",
            className: "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-xs",
            asChild: true,
            children: /*#__PURE__*/_jsx(Link, {
              to: "/login",
              children: "Log in"
            })
          }), /*#__PURE__*/_jsx(Button, {
            size: "sm",
            className: "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 text-xs border-0",
            asChild: true,
            children: /*#__PURE__*/_jsx(Link, {
              to: "/register",
              children: "Get started"
            })
          })]
        }), isSignedIn && /*#__PURE__*/_jsx(Button, {
          size: "sm",
          className: "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 text-xs border-0",
          asChild: true,
          children: /*#__PURE__*/_jsx(Link, {
            to: "/dashboard",
            children: "Dashboard"
          })
        })]
      })]
    })
  });
}
