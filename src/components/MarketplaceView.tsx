import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  MapPin,
  Zap,
  Clock,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  X,
  BarChart3,
  Sun,
} from "lucide-react";
import type { Project, Language } from "../types";
import { translations } from "../translations";
import { useToast } from "./Toast";
import { useProjectFilters } from "../hooks/useProjectFilters";
import { useFormatCurrency } from "../hooks/useFormatCurrency";

interface MarketplaceViewProps {
  projects: Project[];
  lang: Language;
  onDeposit: (projectId: string, projectName: string, amount: number) => Promise<boolean>;
  walletConnected: boolean;
  onConnectWallet: () => void;
}

type FilterStatus = "All" | "Funding" | "Active" | "Repaid";
type SortKey = "apy" | "progress" | "newest";

const riskColors = {
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Moderate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  High: "text-red-400 bg-red-500/10 border-red-500/20",
};

const statusColors: Record<string, string> = {
  Created: "bg-slate-500/20 text-slate-300",
  Funding: "bg-emerald-500/20 text-emerald-300",
  Active: "bg-blue-500/20 text-blue-300",
  Repaid: "bg-green-500/20 text-green-300",
  Defaulted: "bg-red-500/20 text-red-300",
};

export default function MarketplaceView({
  projects,
  lang,
  onDeposit,
  walletConnected,
  onConnectWallet,
}: MarketplaceViewProps) {
  const t = translations[lang];
  const { addToast } = useToast();
  const { filterStatus, setFilterStatus, sortKey, setSortKey, search, setSearch, filtered } =
    useProjectFilters(projects);
  const formatCurrency = useFormatCurrency(lang);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(100);
  const [isDepositing, setIsDepositing] = useState(false);

  const handleDeposit = async () => {
    if (!walletConnected) {
      onConnectWallet();
      return;
    }
    if (!selectedProject || depositAmount <= 0) return;
    setIsDepositing(true);
    const ok = await onDeposit(selectedProject.id, selectedProject.name, depositAmount);
    setIsDepositing(false);
    if (ok) {
      addToast("success", `${t.mpDepositSuccess} ${selectedProject.name}`);
      setShowDepositModal(false);
      setDepositAmount(100);
    }
  };

  return (
    <div className="pb-20">
      {!selectedProject && (
        <>
          {/* Hero */}
          <section className="glass-2 p-8 md:p-12 mb-8 mt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--acc-soft)] border border-[var(--acc-glow)] text-[var(--acc)] text-xs font-semibold mb-6">
                  <Zap className="w-3.5 h-3.5" />
                  {t.tagline || "Decentralized Solar Lending"}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.02] mb-4">
                  <span className="gradient-text">{t.mpTitle}</span>
                </h1>
                <p className="text-[17px] text-[var(--t-2)] max-w-[520px] leading-relaxed mb-8">{t.mpDesc}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => document.getElementById('project-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="h-12 px-6 rounded-[14px] bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04140b] font-semibold text-[15px] shadow-[0_0_0_1px_var(--acc-glow),0_10px_24px_-8px_var(--acc-glow),0_1px_0_rgba(255,255,255,0.4)_inset] hover:brightness-110 transition-all active:translate-y-px flex items-center gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Explore Projects
                  </button>
                  <button className="h-12 px-6 rounded-[14px] bg-white/[0.05] border border-white/[0.1] backdrop-blur-xl text-white font-semibold text-[15px] hover:bg-white/[0.09] hover:border-white/[0.18] transition-all flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Learn More
                  </button>
                </div>
              </div>
              <div className="hidden lg:flex justify-center">
                <div className="solar-visual" style={{ maxWidth: 360 }}>
                  <div className="core" />
                  <div className="ring ring-1" />
                  <div className="ring ring-2" />
                  <div className="ring ring-3" />
                  <div className="solar-overlay" style={{ top: '8%', left: '-8%' }}>
                    <div className="stat-value">{projects.length}</div>
                    <div className="stat-label">Active Projects</div>
                  </div>
                  <div className="solar-overlay" style={{ bottom: '10%', right: '-4%' }}>
                    <div className="stat-value">{(projects.reduce((s, p) => s + p.apy, 0) / Math.max(projects.length, 1)).toFixed(1)}%</div>
                    <div className="stat-label">Avg APY</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Ribbon */}
          <section className="glass-1 stats-ribbon mb-8">
            {[
              { icon: TrendingUp, value: `$${(projects.reduce((s, p) => s + p.targetAmount, 0) / 1000).toFixed(0)}K`, label: "Total Value" },
              { icon: Sun, value: `${projects.filter(p => p.status === 'Active' || p.status === 'Funding').length}`, label: "Active Projects" },
              { icon: Users, value: `${projects.reduce((s, p) => s + p.investorCount, 0)}`, label: "Investors" },
              { icon: Zap, value: `${(projects.reduce((s, p) => s + p.systemSize, 0) / 1000).toFixed(1)} MW`, label: "Total Capacity" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="w-9 h-9 rounded-[10px] bg-[var(--acc-soft)] text-[var(--acc)] flex items-center justify-center mb-3">
                  <stat.icon className="w-4.5 h-4.5" />
                </div>
                <div className="font-mono text-[28px] font-semibold tracking-tight">{stat.value}</div>
                <div className="text-xs text-[var(--t-3)] uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </section>
        </>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6" id="project-grid">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t-3)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.mpSearch}
            className="w-full h-11 bg-white/[0.04] border border-white/[0.1] rounded-xl pl-11 pr-4 text-sm text-white placeholder-[var(--t-3)] outline-none focus:border-[var(--acc)] focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_var(--acc-soft)] transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Funding", "Active", "Repaid"] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`h-[34px] px-3.5 rounded-full text-[13px] font-medium border transition-all ${
                filterStatus === f
                  ? "bg-[var(--acc-soft)] text-[var(--acc)] border-[var(--acc-glow)] shadow-[0_0_16px_-4px_var(--acc-glow)]"
                  : "bg-white/[0.04] text-[var(--t-2)] border-white/[0.08] hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {f === "All" ? t.mpFilterAll : f === "Funding" ? t.mpFilterFunding : f === "Active" ? t.mpFilterActive : t.mpFilterRepaid}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="h-11 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 text-sm text-white outline-none"
        >
          <option value="apy">{t.mpSortApy}</option>
          <option value="progress">{t.mpSortProgress}</option>
          <option value="newest">{t.mpSortNewest}</option>
        </select>
      </div>

      {selectedProject ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 text-[var(--t-2)] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-[22px] overflow-hidden h-64 bg-[var(--bg-1)]">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedProject.status]}`}>
                    {selectedProject.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${riskColors[selectedProject.risk]}`}>
                    {selectedProject.risk}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProject.name}</h2>
                <div className="flex items-center gap-1.5 text-[var(--t-3)] text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedProject.location}
                </div>
                <p className="text-[var(--t-2)] leading-relaxed">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t.mpSystemSize, value: `${selectedProject.systemSize} kW`, icon: Sun },
                  { label: t.mpAPY, value: `${selectedProject.apy}%`, icon: TrendingUp },
                  { label: t.mpDuration, value: `${selectedProject.duration}m`, icon: Clock },
                  { label: t.mpInvestors, value: String(selectedProject.investorCount), icon: Users },
                ].map(item => (
                  <div key={item.label} className="glass-1 p-4">
                    <div className="flex items-center gap-2 text-[var(--t-3)] text-xs mb-2">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <div className="text-lg font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="glass-2 p-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--t-3)]">{t.mpFundingProgress}</span>
                  <span className="text-[var(--acc)] font-bold">{selectedProject.fundingProgress}%</span>
                </div>
                <div className="progress-glass">
                  <div style={{ width: `${selectedProject.fundingProgress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-[var(--t-3)] mt-2">
                  <span>{formatCurrency(selectedProject.fundingProgress * selectedProject.targetAmount / 100)} USDC</span>
                  <span>{formatCurrency(selectedProject.targetAmount)} USDC</span>
                </div>
              </div>

              <div className="glass-1 p-4">
                <div className="flex items-center gap-2 text-[var(--t-3)] text-sm mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  {t.mpInstallers}
                </div>
                <span className="text-white font-medium">{selectedProject.installerName}</span>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="glass-2 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-2">{t.mpDepositTitle}</h3>
                <p className="text-sm text-[var(--t-3)] mb-6">{t.mpDepositDesc} {selectedProject.name}</p>

                <div className="font-mono text-3xl font-bold text-[var(--acc)] mb-1">{depositAmount} USDC</div>
                <input
                  type="range"
                  min={10}
                  max={10000}
                  step={10}
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full mb-4"
                />
                <div className="flex justify-between text-xs text-[var(--t-3)] mb-6">
                  <span>10 USDC</span>
                  <span>10,000 USDC</span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--t-3)]">APY</span>
                    <span className="text-[var(--acc)] font-bold">{selectedProject.apy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--t-3)]">Est. Monthly Yield</span>
                    <span className="text-white font-bold">{(depositAmount * selectedProject.apy / 100 / 12).toFixed(2)} USDC</span>
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="w-full h-12 rounded-[14px] bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04140b] font-semibold text-[15px] shadow-[0_0_0_1px_var(--acc-glow),0_10px_24px_-8px_var(--acc-glow),0_1px_0_rgba(255,255,255,0.4)_inset] hover:brightness-110 disabled:opacity-50 transition-all active:translate-y-px flex items-center justify-center gap-2"
                >
                  {isDepositing ? (
                    <span className="animate-pulse">{t.loading}</span>
                  ) : walletConnected ? (
                    <>
                      <Zap className="w-4 h-4" />
                      {t.mpDepositBtn}
                    </>
                  ) : (
                    t.connectWallet
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[var(--t-3)]">{t.mpNoProjects}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project, i) => (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedProject(project)}
                  className="text-left glass-2 lift cursor-pointer flex flex-col"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-t-[22px] bg-[var(--bg-1)]">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col gap-3.5 relative">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[project.status]}`}>
                        {project.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${riskColors[project.risk]}`}>
                        {project.risk}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[17px] text-white tracking-tight mb-1">{project.name}</h3>
                      <div className="flex items-center gap-1.5 text-[var(--t-3)] text-xs">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-0 pt-3 border-t border-white/[0.06]">
                      <div className="pr-2.5">
                        <div className="font-mono text-base font-semibold text-white">{project.systemSize}<small className="text-[var(--t-3)] text-xs ml-0.5">kW</small></div>
                        <div className="text-[10.5px] text-[var(--t-3)] uppercase tracking-wider mt-0.5">Size</div>
                      </div>
                      <div className="px-2.5 border-l border-white/[0.08]">
                        <div className="font-mono text-base font-semibold text-[var(--warm)]">{project.apy}%</div>
                        <div className="text-[10.5px] text-[var(--t-3)] uppercase tracking-wider mt-0.5">APY</div>
                      </div>
                      <div className="pl-2.5 border-l border-white/[0.08]">
                        <div className="font-mono text-base font-semibold text-white">{project.duration}<small className="text-[var(--t-3)] text-xs ml-0.5">mo</small></div>
                        <div className="text-[10.5px] text-[var(--t-3)] uppercase tracking-wider mt-0.5">Term</div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-[var(--t-3)] mb-1.5">
                        <span>{project.fundingProgress}% funded</span>
                        <span className="font-mono font-semibold text-white">{formatCurrency(project.targetAmount)} USDC</span>
                      </div>
                      <div className="progress-glass">
                        <div style={{ width: `${project.fundingProgress}%` }} />
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showDepositModal && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-3 p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{t.mpDepositTitle}</h3>
                <button onClick={() => setShowDepositModal(false)} className="text-[var(--t-3)] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[var(--t-3)] mb-4">{t.mpDepositDesc} {selectedProject.name}</p>
              <div className="font-mono text-4xl font-bold text-[var(--acc)] mb-2">{depositAmount} USDC</div>
              <input
                type="range"
                min={10}
                max={10000}
                step={10}
                value={depositAmount}
                onChange={e => setDepositAmount(Number(e.target.value))}
                className="w-full mb-6"
              />
              <button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="w-full h-12 rounded-[14px] bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04140b] font-semibold text-[15px] shadow-[0_0_0_1px_var(--acc-glow),0_10px_24px_-8px_var(--acc-glow),0_1px_0_rgba(255,255,255,0.4)_inset] hover:brightness-110 disabled:opacity-50 transition-all active:translate-y-px"
              >
                {isDepositing ? t.loading : t.mpDepositBtn}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
