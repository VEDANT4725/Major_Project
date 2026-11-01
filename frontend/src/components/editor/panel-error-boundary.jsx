import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props for the PanelErrorBoundary component.
 *
 * @property name - Display name for the panel (e.g., "Preview", "Code Editor")
 * @property children - The panel content to wrap
 */

/**
 * State for the error boundary.
 *
 * @property hasError - Whether an error has been caught
 * @property error - The caught error (for display)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PanelErrorBoundary wraps editor panels to catch rendering errors.
 * When an error occurs, it shows an inline error message instead
 * of crashing the entire editor. The user can click "Try again"
 * to attempt re-rendering the panel.
 */
export class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * Called when a child component throws an error during rendering.
   * Updates state to show the error UI on the next render.
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Called after an error is caught. Logs the error for debugging.
   */
  componentDidCatch(error, errorInfo) {
    console.error(`[${this.props.name}] Panel error:`, error, errorInfo);
  }

  /**
   * Resets the error state so the panel re-renders.
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };
  render() {
    if (this.state.hasError) {
      return /*#__PURE__*/_jsxs("div", {
        className: "flex h-full flex-col items-center justify-center gap-3 text-center p-4",
        children: [/*#__PURE__*/_jsx(AlertTriangle, {
          className: "size-6 text-destructive"
        }), /*#__PURE__*/_jsxs("div", {
          className: "space-y-1",
          children: [/*#__PURE__*/_jsxs("p", {
            className: "text-sm font-medium",
            children: ["Something went wrong in ", this.props.name]
          }), /*#__PURE__*/_jsx("p", {
            className: "text-xs text-muted-foreground",
            children: this.state.error?.message
          })]
        }), /*#__PURE__*/_jsxs(Button, {
          variant: "outline",
          size: "sm",
          onClick: this.handleReset,
          className: "gap-1.5",
          children: [/*#__PURE__*/_jsx(RotateCcw, {
            className: "size-3.5"
          }), "Try again"]
        })]
      });
    }
    return this.props.children;
  }
}
