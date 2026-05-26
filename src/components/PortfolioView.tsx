import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Wallet,
  TrendingUp,
  BarChart3,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  ExternalLink,
  Activity,
  Leaf,
  PiggyBank,
  Download,
  Plus,
  Calendar,
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

/* ── Inline SVG Donut ─────────────────────────────────────────── */
function Donut({ data, size = 130, thickness = 18 }: { data: { label: string; pct: number; color: string }[]; size?: number; thickness?: number }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      {data.map((d) => {
        const dash = (d.pct / 100) * c;
        const seg = (
          <circle
            key={d.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${d.color}66)` }}
          />
        );
        offset += dash;
        return seg;
      })}
    </svg>
  );
}

/* ── Bar chart ────────────────────────────────────────────────── */
function BarChart({ data, height = 140 }: { data: number[]; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[6px]" style={{ height }}>
      {data.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
          className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-[4px] min-w-0"
          style={{ opacity: 0.7 + (v / max) * 0.3 }}
        />
      ))}
    </div>
  );
}

/* ── Mock enrichment data ─────────────────────────────────────── */
const MONTHLY_EARNINGS = [62, 78, 96, 102, 118, 134, 148, 156, 168, 182, 194, 218];

const ALLOCATION = [
  { label: "Residential", pct: 38, color: "#34d399" },
  { label: "Commercial", pct: 27, color: "#22d3ee" },
  { label: "Microgrid", pct: 22, color: "#fbbf24" },
  { label: "Agrivoltaic", pct: 13, color: "#a78bfa" },
];

const MOCK_TRANSACTIONS = [
  { id: "tx1", kind: "payout" as const, project: "Chiang Mai Solar Farm", amount: 40.42, date: "2026-05-12", tx: "0x8a4f...d2e1" },
  { id: "tx2", kind: "invest" as const, project: "Phuket Resort Solar", amount: -4200, date: "2026-05-09", tx: "0x12b9...a85c" },
  { id: "tx3", kind: "payout" as const, project: "Pattaya Residential Solar", amount: 25.20, date: "2026-05-04", tx: "0xfe34...19a7" },
  { id: "tx4", kind: "sell" as const, project: "Khon Kaen University Solar", amount: 612.00, date: "2026-05-01", tx: "0x771e...4bd0" },
  { id: "tx5", kind: "payout" as const, project: "Bangkok Solar Community", amount: 24.50, date: "2026-04-28", tx: "0x33ab...8e91" },
  { id: "tx6", kind: "invest" as const, project: "Chiang Mai Solar Farm", amount: -5000, date: "2026-04-20", tx: "0x9c0d...f521" },
  { id: "tx7", kind: "payout" as const, project: "Chiang Mai Solar Farm", amount: 40.42, date: "2026-04-12", tx: "0xa12c...0e74" },
];

const POSITION_META: Record<string, { term: number; monthsLeft: number; nextPayout: string; location: string }> = {
  "SOL-001": { term: 24, monthsLeft: 18, nextPayout: "2026-06-08", location: "Bangkok, Thailand" },
  "SOL-002": { term: 36, monthsLeft: 30, nextPayout: "2026-06-12", location: "Chiang Mai, Thailand" },
  "SOL-003": { term: 18, monthsLeft: 12, nextPayout: "2026-06-15", location: "Phuket, Thailand" },
  "SOL-005": { term: 12, monthsLeft: 6, nextPayout: "2026-06-04", location: "Pattaya, Thailand" },
  "SOL-006": { term: 36, monthsLeft: 28, nextPayout: "2026-06-22", location: "Khon Kaen, Thailand" },
};

const TX_META: Record<string, { label: string; color: string }> = {
  invest: { label: "Invest", color: "#60a5fa" },
  payout: { label: "Payout", color: "var(--acc)" },
  sell: { label: "Sell", color: "var(--warm)" },
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
  const [tab, setTab] = useState<"positions" | "transactions" | "payouts">("positions");

  const handleClaim = async (pos: LendingPosition) => {
    setActionLoading(`c-${pos.projectId}`);
    const ok = await onClaimRewards(pos.projectId);
    setActionLoading(null);
    if (ok) addToast("success", `${t.pfClaimSuccess} ${pos.projectName}`);
  };

  const derived = useMemo(() => {
    const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
    const totalEarned = positions.reduce((s, p) => s + p.earnedYield, 0);
    const realized = totalEarned * 0.31;
    const unrealized = totalEarned * 0.69;
    const dailyChange = totalValue * 0.0007;
    const avgApy = positions.length > 0 ? positions.reduce((s, p) => s + p.apy, 0) / positions.length : 0;
    return { totalValue, totalEarned, realized, unrealized, dailyChange, avgApy };
  }, [positions]);

  const fmtUsd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="pb-20" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* ── TOP: Portfolio summary + Allocation ────────────────── */}
      <section className="grid gap-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        {/* Left — Value + bar chart */}
        <div className="glass-2" style={{ padding: 32 }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="label">Portfolio value</div>
              <div className="flex items-baseline gap-2.5" style={{ marginTop: 8 }}>
                <div className="mono" style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--t-1)" }}>
                  ${fmtUsd(derived.totalValue)}
                </div>
                <span className="pill pill-acc">
                  <TrendingUp className="w-3 h-3" />
                  <span className="mono">+${fmtUsd(derived.dailyChange)}</span> today
                </span>
              </div>
              <div className="flex items-center gap-5" style={{ marginTop: 12, color: "var(--t-3)", fontSize: 13 }}>
                <span>Invested <span className="mono" style={{ color: "var(--t-1)" }}>${fmtUsd(summary.totalInvested)}</span></span>
                <span>Realized <span className="mono" style={{ color: "var(--acc)" }}>+${fmtUsd(derived.realized)}</span></span>
                <span>Unrealized <span className="mono" style={{ color: "var(--warm)" }}>+${fmtUsd(derived.unrealized)}</span></span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-glass btn-sm"><Download className="w-3.5 h-3.5" /> Export</button>
              <button className="btn btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Invest</button>
            </div>
          </div>

          {/* Monthly earnings bar chart */}
          <div style={{ marginTop: 32 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="label">Monthly earnings · last 12 months</div>
              <div className="flex gap-1">
                {["1M", "3M", "1Y", "All"].map((r, i) => (
                  <button key={r} className="filter-pill" data-active={i === 2 ? "true" : "false"}
                    style={{ height: 26, padding: "0 10px", fontSize: 11 }}>{r}</button>
                ))}
              </div>
            </div>
            <BarChart data={MONTHLY_EARNINGS} height={140} />
          </div>
        </div>

        {/* Right — Allocation donut + stats */}
        <div className="glass-2 flex flex-col" style={{ padding: 32, gap: 24 }}>
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="label">Allocation by type</div>
              <span className="pill pill-warm mono">{derived.avgApy.toFixed(1)}% APY</span>
            </div>
            <div className="flex items-center gap-5">
              <Donut data={ALLOCATION} size={130} thickness={18} />
              <div className="flex flex-col gap-2 flex-1">
                {ALLOCATION.map((a) => (
                  <div key={a.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: a.color, boxShadow: `0 0 6px ${a.color}99` }} />
                      {a.label}
                    </div>
                    <span className="mono" style={{ color: "var(--t-2)", fontSize: 13 }}>{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">Active positions</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{positions.length}</div>
            </div>
            <div>
              <div className="label">CO₂ offset</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: "var(--acc)" }}>2.4t/yr</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI Strip ──────────────────────────────────────────── */}
      <section className="grid grid-cols-4 gap-4">
        {[
          { icon: PiggyBank, label: "Total invested", value: `$${fmtUsd(summary.totalInvested)}`, change: 12, color: "text-emerald-400" },
          { icon: TrendingUp, label: "Total earnings", value: `$${fmtUsd(derived.totalEarned)}`, change: 8, color: "text-amber-400" },
          { icon: Activity, label: "Avg yield", value: `${derived.avgApy.toFixed(1)}%`, change: 2, color: "text-blue-400" },
          { icon: Leaf, label: "Tonnes CO₂/yr", value: "2.4", change: 18, color: "text-emerald-400" },
        ].map((item) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-2 p-5">
            <div className="w-9 h-9 rounded-[10px] bg-[var(--acc-soft)] text-[var(--acc)] flex items-center justify-center mb-3">
              <item.icon className="w-[18px] h-[18px]" />
            </div>
            <div className="label mb-1">{item.label}</div>
            <div className="flex items-baseline gap-2">
              <div className={`text-xl font-bold mono ${item.color}`}>{item.value}</div>
              <span className="text-emerald-400 text-xs font-medium">+{item.change}%</span>
            </div>
            <div className="text-[var(--t-3)] text-[11px] mt-0.5">vs last 30d</div>
          </motion.div>
        ))}
      </section>

      {/* ── Tabbed section ─────────────────────────────────────── */}
      <section className="glass-2">
        <div style={{ padding: "20px 24px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div className="flex gap-0.5">
            {([
              ["positions", "Active positions", positions.length] as const,
              ["transactions", "Transactions", MOCK_TRANSACTIONS.length] as const,
              ["payouts", "Upcoming payouts", positions.length] as const,
            ]).map(([k, label, count]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="bg-transparent border-0 px-4 cursor-pointer inline-flex items-center gap-2"
                style={{
                  padding: "12px 16px 16px",
                  fontSize: 13.5, fontWeight: 500,
                  color: tab === k ? "var(--t-1)" : "var(--t-3)",
                  borderBottom: `2px solid ${tab === k ? "var(--acc)" : "transparent"}`,
                  marginBottom: -1,
                  boxShadow: tab === k ? "0 6px 16px -6px var(--acc-glow)" : "none",
                }}
              >
                {label}
                <span style={{
                  fontSize: 11, padding: "2px 7px", borderRadius: 999,
                  background: tab === k ? "var(--acc-soft)" : "rgba(255,255,255,0.06)",
                  color: tab === k ? "var(--acc)" : "var(--t-3)",
                }}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 4 }}>
          {/* Positions table */}
          {tab === "positions" && (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Project</th>
                  <th style={{ textAlign: "right" }}>Invested</th>
                  <th style={{ textAlign: "right" }}>Value</th>
                  <th style={{ textAlign: "right" }}>Earnings</th>
                  <th style={{ textAlign: "right" }}>APY</th>
                  <th style={{ textAlign: "left" }}>Term</th>
                  <th style={{ textAlign: "right" }}>Next payout</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const meta = POSITION_META[pos.projectId] || { term: 24, monthsLeft: 18, nextPayout: "2026-06-15", location: "" };
                  const progress = ((meta.term - meta.monthsLeft) / meta.term) * 100;
                  return (
                    <tr key={pos.projectId}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-[38px] h-[38px] rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-emerald-600/30 to-cyan-600/30 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-emerald-400/60" />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-white">{pos.projectName}</div>
                            <div className="text-[11px] text-[var(--t-3)]">{meta.location}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}><span className="mono text-[13px]">${fmtUsd(pos.amountInvested)}</span></td>
                      <td style={{ textAlign: "right" }}><span className="mono text-[13px]">${fmtUsd(pos.currentValue)}</span></td>
                      <td style={{ textAlign: "right" }}><span className="mono text-[13px]" style={{ color: "var(--acc)" }}>+${fmtUsd(pos.earnedYield)}</span></td>
                      <td style={{ textAlign: "right" }}><span className="mono text-[13px]" style={{ color: "var(--warm)" }}>{pos.apy}%</span></td>
                      <td>
                        <div style={{ minWidth: 120 }}>
                          <div className="progress-glass" style={{ height: 4 }}>
                            <div style={{ width: `${progress}%` }} />
                          </div>
                          <div className="text-[11px] text-[var(--t-3)]" style={{ marginTop: 4 }}>
                            <span className="mono">{meta.monthsLeft}</span>/{meta.term}mo left
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="mono text-[13px]" style={{ color: "var(--t-2)" }}>
                          {new Date(meta.nextPayout).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-glass btn-xs">Manage</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Transactions table */}
          {tab === "transactions" && (
            <table className="tbl">
              <thead>
                <tr>
                  <th></th>
                  <th style={{ textAlign: "left" }}>Type</th>
                  <th style={{ textAlign: "left" }}>Project</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "left" }}>Date</th>
                  <th style={{ textAlign: "left" }}>Tx hash</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TRANSACTIONS.map((tx) => {
                  const meta = TX_META[tx.kind];
                  return (
                    <tr key={tx.id}>
                      <td style={{ width: 44 }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${meta.color}20`, color: meta.color }}>
                          {tx.kind === "invest" ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                           tx.kind === "payout" ? <ArrowDownLeft className="w-3.5 h-3.5" /> :
                           <Coins className="w-3.5 h-3.5" />}
                        </div>
                      </td>
                      <td><span className="text-[13px]">{meta.label}</span></td>
                      <td><span className="text-[13px] font-semibold text-white">{tx.project}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <span className="mono text-[13px]" style={{ color: tx.amount < 0 ? "var(--t-1)" : "var(--acc)" }}>
                          {tx.amount > 0 ? "+" : ""}${fmtUsd(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td><span className="text-[13px]" style={{ color: "var(--t-3)" }}>
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span></td>
                      <td><span className="mono text-[13px]" style={{ color: "var(--t-3)" }}>{tx.tx}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost btn-xs"><ExternalLink className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Payouts table */}
          {tab === "payouts" && (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Project</th>
                  <th style={{ textAlign: "left" }}>Date</th>
                  <th style={{ textAlign: "right" }}>Estimated amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const meta = POSITION_META[pos.projectId] || { term: 24, monthsLeft: 18, nextPayout: "2026-06-15", location: "" };
                  const est = (pos.amountInvested * pos.apy / 100) / 12;
                  return (
                    <tr key={pos.projectId}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-emerald-600/30 to-cyan-600/30 flex items-center justify-center">
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-400/60" />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-white">{pos.projectName}</div>
                            <div className="text-[11px] text-[var(--t-3)]">{meta.location}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-[13px]">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(meta.nextPayout).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="mono text-[13px]" style={{ color: "var(--acc)" }}>+${fmtUsd(est)}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="pill pill-acc"><span className="dot" />Scheduled</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
