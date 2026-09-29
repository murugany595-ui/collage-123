import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose = () => {} }) => {
  const bgStyles = {
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    error: "bg-rose-50 text-rose-900 border-rose-200",
    info: "bg-blue-50 text-blue-900 border-blue-200",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgStyles[type]} animate-fade-in max-w-md`}>
      {icons[type]}
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-800 transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
