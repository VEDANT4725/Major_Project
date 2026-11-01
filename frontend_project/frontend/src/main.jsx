import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Providers } from "./components/Providers";
import "./index.css";
import { jsx as _jsx } from "react/jsx-runtime";
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/_jsx(React.StrictMode, {
  children: /*#__PURE__*/_jsx(BrowserRouter, {
    children: /*#__PURE__*/_jsx(Providers, {
      children: /*#__PURE__*/_jsx(App, {})
    })
  })
}));
