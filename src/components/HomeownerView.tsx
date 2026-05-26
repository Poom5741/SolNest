import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sun,
  Zap,
  Thermometer,
  Activity,
  BarChart3,
  DollarSign,
  Calendar,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Gauge,
} from "lucide-react";
import type { LoanDetails, EnergyTelemetry, InverterData, Language } from "../types";
import { translations } from "../translations";
import { useToast } from "./Toast";
import { useFormatCurrency } from "../hooks/useFormatCurrency";

interface HomeownerViewProps {
  loan: LoanDetails | null;
  telemetry: EnergyTelemetry | null;
  inverter: InverterData | null;
  lang: Language;
  onRepayment: () => Promise<boolean>;
}

export default function HomeownerView({
  loan,
  telemetry,
  inverter,
  lang,
  onRepayment,
}: HomeownerViewProps) {
  const t = translations[lang];
  const { addToast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const [energyView, setEnergyView] = useState<"daily" | "weekly" | "monthly">("daily");
  const formatCurrency = useFormatCurrency(lang, 2);

  const handleRepayment = async () => {
    setIsPaying(true);
    const ok = await onRepayment();
    setIsPaying(false);
    if (ok) addToast("success", t.hoPaymentSuccess);
  };

  const chartData = telemetry
    ? energyView === "daily"
      ? telemetry.daily.map(d => ({ label: d.day, value: d.kwh }))
      : energyView === "weekly"
      ? telemetry.weekly.map(w => ({ label: w.week, value: w.kwh }))
      : telemetry.monthly.map(m => ({ label: m.month, value: m.kwh }))
    : [];

  const maxKwh = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">{t.hoTitle}</h1>
        <p className="text-[var(--t-2)] mt-2">{t.hoDesc}</p>
      </div>

      {loan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: t.hoTotalLoan, value: `$${formatCurrency(loan.totalLoanAmount)}`, icon: DollarSign, color: "text-white" },
            { label: t.hoRemaining, value: `$${formatCurrency(loan.remainingBalance)}`, icon: BarChart3, color: "text-amber-400" },
            { label: t.hoMonthlyPayment, value: `$${formatCurrency(loan.monthlyPayment)}`, icon: TrendingUp, color: "text-emerald-400" },
            { label: t.hoNextPayment, value: loan.nextPaymentDate, icon: Calendar, color: "text-blue-400" },
            { label: t.hoPaymentsMade, value: `${loan.paymentsMade}/${loan.totalPayments}`, icon: CheckCircle2, color: "text-green-400" },
          ].map(item => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-2 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-[10px] bg-[var(--acc-soft)] flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[var(--acc)]" />
                </div>
                <span className="text-[var(--t-3)] text-xs leading-tight">{item.label}</span>
              </div>
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      {loan && (
        <div className="glass-2 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-semibold">{t.hoMakePayment}</span>
            </div>
            <span className="text-2xl font-bold text-white">${formatCurrency(loan.monthlyPayment)}</span>
          </div>
          <div className="progress-glass mb-4">
            <div style={{ width: `${(loan.paymentsMade / loan.totalPayments) * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[var(--t-3)] mb-4">
            <span>{loan.paymentsMade} of {loan.totalPayments} payments</span>
            <span>${formatCurrency(loan.remainingBalance)} remaining</span>
          </div>
          <button
            onClick={handleRepayment}
            disabled={isPaying}
            className="w-full py-3 bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04140b] shadow-[0_0_0_1px_var(--acc-glow),0_10px_24px_-8px_var(--acc-glow)] hover:brightness-110 disabled:opacity-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            {isPaying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isPaying ? t.loading : t.hoMakePayment}
          </button>
        </div>
      )}

      <div className="glass-2 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">{t.hoEnergyTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-1">
            {(["daily", "weekly", "monthly"] as const).map(v => (
              <button
                key={v}
                onClick={() => setEnergyView(v)}
                className={`h-[34px] px-3.5 rounded-full text-xs font-medium transition-all border ${
                  energyView === v
                    ? "bg-[var(--acc-soft)] text-[var(--acc)] border-[var(--acc-glow)] shadow-[0_0_16px_-4px_var(--acc-glow)]"
                    : "bg-white/[0.04] text-[var(--t-2)] border-white/[0.08]"
                }`}
              >
                {v === "daily" ? t.hoDaily : v === "weekly" ? t.hoWeekly : t.hoMonthly}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2 h-36 sm:h-48">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.value / maxKwh) * 100}%` }}
                transition={{ delay: i * 0.03, duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[40px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-[8px]"
              />
              <span className="text-[10px] text-[var(--t-3)] mt-1">{d.label}</span>
              <span className="text-[10px] text-[var(--t-2)] font-mono">{d.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {inverter && (
        <div className="glass-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">{t.hoInverterTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: t.hoInverterStatus, value: inverter.status, icon: Gauge, color: "text-emerald-400" },
              { label: t.hoDailyYield, value: `${inverter.dailyYield} kWh`, icon: Zap, color: "text-amber-400" },
              { label: t.hoTotalYield, value: `${inverter.totalYield} kWh`, icon: TrendingUp, color: "text-blue-400" },
              { label: t.hoTemperature, value: `${inverter.temperature}°C`, icon: Thermometer, color: "text-red-400" },
              { label: t.hoEfficiency, value: `${inverter.efficiency}%`, icon: Activity, color: "text-emerald-400" },
            ].map(item => (
              <div key={item.label} className="glass-1 p-3 rounded-[var(--radius)]">
                <div className="flex items-center gap-1.5 text-[var(--t-3)] text-[10px] mb-1">
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </div>
                <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
