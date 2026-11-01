import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    login,
    isSignedIn
  } = useAuth();
  const navigate = useNavigate();
  if (isSignedIn) {
    navigate("/dashboard", {
      replace: true
    });
    return null;
  }
  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/_jsx("div", {
    className: "flex min-h-screen items-center justify-center bg-background p-4",
    children: /*#__PURE__*/_jsxs(Card, {
      className: "w-full max-w-md",
      children: [/*#__PURE__*/_jsxs(CardHeader, {
        className: "text-center",
        children: [/*#__PURE__*/_jsx(CardTitle, {
          className: "text-2xl font-bold",
          children: "Welcome Back"
        }), /*#__PURE__*/_jsx(CardDescription, {
          children: "Sign in to your account"
        })]
      }), /*#__PURE__*/_jsxs("form", {
        onSubmit: handleSubmit,
        children: [/*#__PURE__*/_jsxs(CardContent, {
          className: "space-y-4",
          children: [error && /*#__PURE__*/_jsx("div", {
            className: "rounded-md bg-destructive/10 p-3 text-sm text-destructive",
            children: error
          }), /*#__PURE__*/_jsxs("div", {
            className: "space-y-2",
            children: [/*#__PURE__*/_jsx(Label, {
              htmlFor: "email",
              children: "Email"
            }), /*#__PURE__*/_jsx(Input, {
              id: "email",
              type: "email",
              placeholder: "you@example.com",
              value: email,
              onChange: e => setEmail(e.target.value),
              required: true
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "space-y-2",
            children: [/*#__PURE__*/_jsx(Label, {
              htmlFor: "password",
              children: "Password"
            }), /*#__PURE__*/_jsx(Input, {
              id: "password",
              type: "password",
              placeholder: "••••••••",
              value: password,
              onChange: e => setPassword(e.target.value),
              required: true
            })]
          })]
        }), /*#__PURE__*/_jsxs(CardFooter, {
          className: "flex flex-col gap-4",
          children: [/*#__PURE__*/_jsx(Button, {
            type: "submit",
            className: "w-full",
            disabled: loading,
            children: loading ? "Signing in..." : "Sign In"
          }), /*#__PURE__*/_jsxs("p", {
            className: "text-sm text-muted-foreground",
            children: ["Don't have an account?", " ", /*#__PURE__*/_jsx(Link, {
              to: "/register",
              className: "text-primary hover:underline",
              children: "Sign up"
            })]
          })]
        })]
      })]
    })
  });
}
