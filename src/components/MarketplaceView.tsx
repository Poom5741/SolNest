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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t.mpTitle}</h1>
        <p className="text-white/60 mt-2">{t.mpDesc}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.mpSearch}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Funding", "Active", "Repaid"] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === f
                  ? "bg-emerald-600 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {f === "All" ? t.mpFilterAll : f === "Funding" ? t.mpFilterFunding : f === "Active" ? t.mpFilterActive : t.mpFilterRepaid}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
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
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-emerald-900/40 to-slate-900">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedProject.status]}`}>
                    {selectedProject.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${riskColors[selectedProject.risk]}`}>
                    {selectedProject.risk}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProject.name}</h2>
                <div className="flex items-center gap-1 text-white/60 text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedProject.location}
                </div>
                <p className="text-white/70 leading-relaxed">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t.mpSystemSize, value: `${selectedProject.systemSize} kW`, icon: Sun },
                  { label: t.mpAPY, value: `${selectedProject.apy}%`, icon: TrendingUp },
                  { label: t.mpDuration, value: `${selectedProject.duration}m`, icon: Clock },
                  { label: t.mpInvestors, value: String(selectedProject.investorCount), icon: Users },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <div className="text-lg font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">{t.mpFundingProgress}</span>
                  <span className="text-emerald-400 font-bold">{selectedProject.fundingProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${selectedProject.fundingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{formatCurrency(selectedProject.fundingProgress * selectedProject.targetAmount / 100)} USDC</span>
                  <span>{formatCurrency(selectedProject.targetAmount)} USDC</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  {t.mpInstallers}
                </div>
                <span className="text-white font-medium">{selectedProject.installerName}</span>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white/5 rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-2">{t.mpDepositTitle}</h3>
                <p className="text-sm text-white/50 mb-6">{t.mpDepositDesc} {selectedProject.name}</p>

                <div className="text-3xl font-bold text-emerald-400 mb-1">{depositAmount} USDC</div>
                <input
                  type="range"
                  min={10}
                  max={10000}
                  step={10}
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full accent-emerald-500 mb-4"
                />
                <div className="flex justify-between text-xs text-white/40 mb-6">
                  <span>10 USDC</span>
                  <span>10,000 USDC</span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">APY</span>
                    <span className="text-emerald-400 font-bold">{selectedProject.apy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Est. Monthly Yield</span>
                    <span className="text-white font-bold">{(depositAmount * selectedProject.apy / 100 / 12).toFixed(2)} USDC</span>
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
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
            <div className="text-center py-20 text-white/40">{t.mpNoProjects}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project, i) => (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedProject(project)}
                  className="text-left bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl overflow-hidden transition-all group"
                >
                  <div className="h-40 bg-gradient-to-br from-emerald-900/30 to-slate-900 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[project.status]}`}>
                        {project.status}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${riskColors[project.risk]}`}>
                        {project.risk}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1 text-white/40 text-xs mb-3">
                      <MapPin className="w-3 h-3" />
                      {project.location}
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white/50">{project.systemSize} kW</span>
                      <span className="text-emerald-400 font-bold">{project.apy}% APY</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${project.fundingProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{project.fundingProgress}% {t.mpFundingProgress}</span>
                      <span>{formatCurrency(project.targetAmount)} USDC</span>
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
              className="bg-[#0f1d35] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{t.mpDepositTitle}</h3>
                <button onClick={() => setShowDepositModal(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/50 mb-4">{t.mpDepositDesc} {selectedProject.name}</p>
              <div className="text-4xl font-bold text-emerald-400 mb-2">{depositAmount} USDC</div>
              <input
                type="range"
                min={10}
                max={10000}
                step={10}
                value={depositAmount}
                onChange={e => setDepositAmount(Number(e.target.value))}
                className="w-full accent-emerald-500 mb-6"
              />
              <button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
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
