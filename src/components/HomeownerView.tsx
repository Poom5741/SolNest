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
        <h1 className="text-3xl font-bold text-white">{t.hoTitle}</h1>
        <p className="text-white/60 mt-2">{t.hoDesc}</p>
      </div>

      {loan && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              className="bg-white/5 border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      {loan && (
        <div className="bg-white/5 border border-white/5 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-semibold">{t.hoMakePayment}</span>
            </div>
            <span className="text-2xl font-bold text-white">${formatCurrency(loan.monthlyPayment)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              style={{ width: `${(loan.paymentsMade / loan.totalPayments) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40 mb-4">
            <span>{loan.paymentsMade} of {loan.totalPayments} payments</span>
            <span>${formatCurrency(loan.remainingBalance)} remaining</span>
          </div>
          <button
            onClick={handleRepayment}
            disabled={isPaying}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
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

      <div className="bg-white/5 border border-white/5 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">{t.hoEnergyTitle}</h2>
          </div>
          <div className="flex gap-1">
            {(["daily", "weekly", "monthly"] as const).map(v => (
              <button
                key={v}
                onClick={() => setEnergyView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  energyView === v
                    ? "bg-amber-600 text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {v === "daily" ? t.hoDaily : v === "weekly" ? t.hoWeekly : t.hoMonthly}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2 h-48">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.value / maxKwh) * 100}%` }}
                transition={{ delay: i * 0.03, duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[40px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg"
              />
              <span className="text-[10px] text-white/40 mt-1">{d.label}</span>
              <span className="text-[10px] text-white/60 font-mono">{d.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {inverter && (
        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">{t.hoInverterTitle}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: t.hoInverterStatus, value: inverter.status, icon: Gauge, color: "text-emerald-400" },
              { label: t.hoDailyYield, value: `${inverter.dailyYield} kWh`, icon: Zap, color: "text-amber-400" },
              { label: t.hoTotalYield, value: `${inverter.totalYield} kWh`, icon: TrendingUp, color: "text-blue-400" },
              { label: t.hoTemperature, value: `${inverter.temperature}°C`, icon: Thermometer, color: "text-red-400" },
              { label: t.hoEfficiency, value: `${inverter.efficiency}%`, icon: Activity, color: "text-emerald-400" },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-white/40 text-[10px] mb-1">
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
