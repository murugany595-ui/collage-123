import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Trash2, Bot } from "lucide-react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChatbotErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ChatbotErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleHardReset = () => {
    try {
      // Clear any corrupted chat cache from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("chat_history_") || key.startsWith("chat_conversations_")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    this.handleReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-red-100 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">College AI Assistant Encountered an Issue</h3>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected interface error occurred. You can restore the chat assistant without losing your session.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Chat Assistant
              </button>
              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                Reset Chat Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
