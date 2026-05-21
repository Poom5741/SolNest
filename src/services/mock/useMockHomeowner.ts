import { useState, useCallback, useEffect } from "react";
import type { LoanDetails, EnergyTelemetry, InverterData } from "../../types";

interface UseMockHomeownerReturn {
  loan: LoanDetails | null;
  telemetry: EnergyTelemetry | null;
  inverter: InverterData | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  makeRepayment: () => Promise<boolean>;
}

function generateTelemetry(): EnergyTelemetry {
  const daily = Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    kwh: Math.round((20 + Math.random() * 30) * 10) / 10,
  }));
  const weekly = Array.from({ length: 4 }, (_, i) => ({
    week: `W${i + 1}`,
    kwh: Math.round((140 + Math.random() * 100) * 10) / 10,
  }));
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5 + i);
    return {
      month: d.toLocaleString("en", { month: "short" }),
      kwh: Math.round((600 + Math.random() * 400) * 10) / 10,
    };
  });
  return { daily, weekly, monthly };
}

function generateInverter(): InverterData {
  return {
    status: "Online",
    dailyYield: Math.round((8 + Math.random() * 12) * 10) / 10,
    totalYield: Math.round((1500 + Math.random() * 500) * 10) / 10,
    temperature: Math.round((35 + Math.random() * 10) * 10) / 10,
    efficiency: Math.round((94 + Math.random() * 5) * 10) / 10,
  };
}

export function useMockHomeowner(): UseMockHomeownerReturn {
  const [loan] = useState<LoanDetails>({
    totalLoanAmount: 24000,
    remainingBalance: 18500,
    nextPaymentDate: "2026-04-15",
    paymentsMade: 4,
    totalPayments: 48,
    monthlyPayment: 550,
  });

  const [telemetry, setTelemetry] = useState<EnergyTelemetry>(generateTelemetry);
  const [inverter, setInverter] = useState<InverterData>(generateInverter);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(generateTelemetry());
      setInverter(generateInverter());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const makeRepayment = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    return true;
  }, []);

  const mutate = useCallback(() => {
    setTelemetry(generateTelemetry());
    setInverter(generateInverter());
  }, []);

  return { loan, telemetry, inverter, isLoading, error, mutate, makeRepayment };
}
