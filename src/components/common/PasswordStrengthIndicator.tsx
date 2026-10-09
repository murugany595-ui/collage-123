import React, { useMemo } from "react";
import { Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

export interface PasswordCriterion {
  id: string;
  label: string;
  met: boolean;
}

export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  level: "very-weak" | "weak" | "fair" | "good" | "strong";
  label: string;
  color: string;
  bgLight: string;
  criteria: PasswordCriterion[];
} {
  const p = password || "";

  const criteria: PasswordCriterion[] = [
    {
      id: "length",
      label: "At least 8 characters",
      met: p.length >= 8,
    },
    {
      id: "lowercase",
      label: "Lowercase letter (a-z)",
      met: /[a-z]/.test(p),
    },
    {
      id: "uppercase",
      label: "Uppercase letter (A-Z)",
      met: /[A-Z]/.test(p),
    },
    {
      id: "number",
      label: "Number (0-9)",
      met: /[0-9]/.test(p),
    },
    {
      id: "special",
      label: "Special character (!@#$%^&*)",
      met: /[^A-Za-z0-9]/.test(p),
    },
  ];

  if (!p) {
    return {
      score: 0,
      level: "very-weak",
      label: "Enter a password",
      color: "bg-slate-200 text-slate-400",
      bgLight: "bg-slate-50",
      criteria,
    };
  }

  const metCount = criteria.filter((c) => c.met).length;

  // Compute score 1 to 4
  let score = 1;
  let level: "very-weak" | "weak" | "fair" | "good" | "strong" = "weak";
  let label = "Weak";
  let color = "bg-rose-500 text-rose-600";
  let bgLight = "bg-rose-50 text-rose-700 border-rose-100";

  if (p.length < 6) {
    score = 1;
    level = "weak";
    label = "Too short (min 6 chars)";
    color = "bg-rose-500 text-rose-600";
    bgLight = "bg-rose-50 text-rose-700 border-rose-100";
  } else if (metCount <= 2) {
    score = 1;
    level = "weak";
    label = "Weak password";
    color = "bg-rose-500 text-rose-600";
    bgLight = "bg-rose-50 text-rose-700 border-rose-100";
  } else if (metCount === 3) {
    score = 2;
    level = "fair";
    label = "Fair complexity";
    color = "bg-amber-500 text-amber-600";
    bgLight = "bg-amber-50 text-amber-700 border-amber-100";
  } else if (metCount === 4) {
    score = 3;
    level = "good";
    label = "Good password";
    color = "bg-sky-500 text-sky-600";
    bgLight = "bg-sky-50 text-sky-700 border-sky-100";
  } else {
    score = 4;
    level = "strong";
    label = "Strong & secure";
    color = "bg-emerald-500 text-emerald-600";
    bgLight = "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  return {
    score,
    level,
    label,
    color,
    bgLight,
    criteria,
  };
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showCriteria = true,
  className = "",
}) => {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-2 mt-2 pt-1 transition-all duration-200 ${className}`}>
      {/* Strength meter bar with 4 segments */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isActive = result.score >= step;
          let segmentColor = "bg-slate-100";
          if (isActive) {
            if (result.score === 1) segmentColor = "bg-rose-500";
            else if (result.score === 2) segmentColor = "bg-amber-500";
            else if (result.score === 3) segmentColor = "bg-sky-500";
            else segmentColor = "bg-emerald-500";
          }
          return (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${segmentColor}`}
            />
          );
        })}
      </div>

      {/* Strength score and badge */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 font-semibold">
          {result.score >= 3 ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : result.score === 2 ? (
            <Shield className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span
            className={
              result.score === 4
                ? "text-emerald-700"
                : result.score === 3
                ? "text-sky-700"
                : result.score === 2
                ? "text-amber-700"
                : "text-rose-600"
            }
          >
            {result.label}
          </span>
        </div>
        <span className="text-slate-400 font-medium">
          {result.score}/4 Strength
        </span>
      </div>

      {/* Criteria checklist */}
      {showCriteria && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-slate-100">
          {result.criteria.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-1.5 text-[10px] transition-colors ${
                item.met ? "text-emerald-700 font-medium" : "text-slate-400"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                  item.met
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {item.met ? (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : (
                  <X className="w-2.5 h-2.5" />
                )}
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
