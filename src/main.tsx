import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "sans-serif", padding: "20px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", fontSize: "28px" }}>
            🎓
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>College ERP System</h2>
          <p style={{ color: "#94a3b8", maxWidth: "500px", fontSize: "14px", marginBottom: "24px" }}>
            An unexpected error occurred while loading the portal: {this.state.error?.message || "Unknown error"}
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              Reset Session & Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: "#334155", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

