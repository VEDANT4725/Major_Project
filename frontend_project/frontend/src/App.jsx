import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import PreviewPage from "./pages/PreviewPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import GitHubCallbackPage from "./pages/GitHubCallbackPage";
import AppLayout from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export default function App() {
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(Toaster, {
      position: "top-right",
      richColors: true
    }), /*#__PURE__*/_jsxs(Routes, {
      children: [/*#__PURE__*/_jsx(Route, {
        path: "/",
        element: /*#__PURE__*/_jsx(LandingPage, {})
      }), /*#__PURE__*/_jsx(Route, {
        path: "/login",
        element: /*#__PURE__*/_jsx(LoginPage, {})
      }), /*#__PURE__*/_jsx(Route, {
        path: "/register",
        element: /*#__PURE__*/_jsx(RegisterPage, {})
      }), /*#__PURE__*/_jsxs(Route, {
        element: /*#__PURE__*/_jsx(ProtectedRoute, {
          children: /*#__PURE__*/_jsx(AppLayout, {})
        }),
        children: [/*#__PURE__*/_jsx(Route, {
          path: "/dashboard",
          element: /*#__PURE__*/_jsx(DashboardPage, {})
        }), /*#__PURE__*/_jsx(Route, {
          path: "/analytics",
          element: /*#__PURE__*/_jsx(AnalyticsPage, {})
        }), /*#__PURE__*/_jsx(Route, {
          path: "/settings",
          element: /*#__PURE__*/_jsx(SettingsPage, {})
        }), /*#__PURE__*/_jsx(Route, {
          path: "/project/:projectId",
          element: /*#__PURE__*/_jsx(EditorPage, {})
        }), /*#__PURE__*/_jsx(Route, {
          path: "/preview/:projectId",
          element: /*#__PURE__*/_jsx(PreviewPage, {})
        })]
      }), /*#__PURE__*/_jsx(Route, {
        path: "/auth/github/callback",
        element: /*#__PURE__*/_jsx(GitHubCallbackPage, {})
      }), /*#__PURE__*/_jsx(Route, {
        path: "*",
        element: /*#__PURE__*/_jsx(Navigate, {
          to: "/",
          replace: true
        })
      })]
    })]
  });
}
