import { ShieldCheck, AlertTriangle, Info } from "lucide-react";
import type { Language, RiskLevel } from "../types";
import { translations } from "../translations";

interface RiskBadgeProps {
  risk: RiskLevel;
  lang: Language;
  score?: number;
  showDetail?: boolean;
}

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; icon: typeof ShieldCheck }> = {
  Low: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: ShieldCheck },
  Moderate: { bg: "bg-amber-500/10", text: "text-amber-400", icon: Info },
  High: { bg: "bg-red-500/10", text: "text-red-400", icon: AlertTriangle },
};

export function RiskBadge({ risk, lang, score, showDetail }: RiskBadgeProps) {
  const t = translations[lang];
  const colors = RISK_COLORS[risk];
  const Icon = colors.icon;

  const label = (() => {
    if (risk === "Low") return t.mpRiskLow;
    if (risk === "Moderate") return t.mpRiskModerate;
    return t.mpRiskHigh;
  })();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} text-xs font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {score != null && <span className="opacity-60">({score}/10)</span>}
      {showDetail && score != null && (
        <div className="ml-1 text-[10px] opacity-50">
          Score: {score}
        </div>
      )}
    </div>
  );
}
