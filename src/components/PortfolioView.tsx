import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Wallet,
  TrendingUp,
  BarChart3,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ExternalLink,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import type { LendingPosition, PortfolioSummary, Language } from "../types";
import { translations } from "../translations";
import { useToast } from "./Toast";
import { useFormatCurrency } from "../hooks/useFormatCurrency";

interface PortfolioViewProps {
  positions: LendingPosition[];
  summary: PortfolioSummary;
  lang: Language;
  onWithdraw: (projectId: string, amount: number) => Promise<boolean>;
  onClaimRewards: (projectId: string) => Promise<boolean>;
}

const statusColors: Record<string, string> = {
  Created: "bg-slate-500/20 text-slate-300",
  Funding: "bg-emerald-500/20 text-emerald-300",
  Active: "bg-blue-500/20 text-blue-300",
  Repaid: "bg-green-500/20 text-green-300",
  Defaulted: "bg-red-500/20 text-red-300",
};

export default function PortfolioView({
  positions,
  summary,
  lang,
  onWithdraw,
  onClaimRewards,
}: PortfolioViewProps) {
  const t = translations[lang];
  const { addToast } = useToast();
  const formatCurrency = useFormatCurrency(lang, 2);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleWithdraw = async (pos: LendingPosition) => {
    setActionLoading(`w-${pos.projectId}`);
    const ok = await onWithdraw(pos.projectId, pos.amountInvested);
    setActionLoading(null);
    if (ok) addToast("success", `${t.pfWithdrawSuccess} ${pos.projectName}`);
  };

  const handleClaim = async (pos: LendingPosition) => {
    setActionLoading(`c-${pos.projectId}`);
    const ok = await onClaimRewards(pos.projectId);
    setActionLoading(null);
    if (ok) addToast("success", `${t.pfClaimSuccess} ${pos.projectName}`);
  };

  return (
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">{t.pfTitle}</span>
        </h1>
        <p className="text-[var(--t-2)] mt-2">{t.pfDesc}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: t.pfTotalInvested, value: `$${formatCurrency(summary.totalInvested)}`, icon: Wallet, color: "text-emerald-400" },
          { label: t.pfTotalEarned, value: `$${formatCurrency(summary.totalEarned)}`, icon: TrendingUp, color: "text-amber-400" },
          { label: t.pfActivePositions, value: String(summary.activePositions), icon: LayoutDashboard, color: "text-blue-400" },
          { label: t.pfTotalLpTokens, value: formatCurrency(summary.totalLpTokens), icon: Coins, color: "text-purple-400" },
        ].map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-2 p-5"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[var(--acc-soft)] text-[var(--acc)] flex items-center justify-center mb-3">
              <item.icon className="w-[18px] h-[18px]" />
            </div>
            <div className="text-xs text-[var(--t-3)] uppercase tracking-widest mb-1">{item.label}</div>
            <div className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</div>
          </motion.div>
        ))}
      </div>

      {positions.length === 0 ? (
        <div className="glass-1 p-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/5">
            <BarChart3 className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40">{t.pfNoPositions}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white tracking-tight mb-4">{t.pfPositions}</h2>
          {positions.map((pos, i) => (
            <motion.div
              key={pos.projectId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-2 lift p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{pos.projectName}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[pos.projectStatus] || ""}`}>
                      {pos.projectStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div>
                      <div className="text-xs text-white/40">{t.pfInvested}</div>
                      <div className="text-sm font-semibold font-mono text-white">{formatCurrency(pos.amountInvested)} USDC</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">{t.pfCurrentValue}</div>
                      <div className="text-sm font-semibold font-mono text-emerald-400">{formatCurrency(pos.currentValue)} USDC</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">{t.pfEarnedYield}</div>
                      <div className="text-sm font-semibold font-mono text-amber-400">
                        {pos.earnedYield > 0 ? `${formatCurrency(pos.earnedYield)} USDC` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">APY</div>
                      <div className="text-sm font-semibold font-mono text-white">{pos.apy}%</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWithdraw(pos)}
                    disabled={actionLoading === `w-${pos.projectId}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.09] hover:border-white/[0.18] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {t.pfWithdrawBtn}
                  </button>
                  <button
                    onClick={() => handleClaim(pos)}
                    disabled={pos.earnedYield <= 0 || actionLoading === `c-${pos.projectId}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-b from-amber-400 to-amber-600 text-[#1a0a00] shadow-[0_0_0_1px_var(--warm-soft),0_8px_20px_-6px_var(--warm-soft)] hover:brightness-110 disabled:opacity-30 rounded-lg text-xs font-medium transition-all"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    {t.pfClaimBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
