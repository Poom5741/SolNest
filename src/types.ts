export type ViewType = "marketplace" | "portfolio" | "homeowner" | "admin" | "secondary";
export type Language = "en" | "th";
export type ProjectStatus = "Created" | "Funding" | "Active" | "Repaid" | "Defaulted";
export type RiskLevel = "Low" | "Moderate" | "High";

export interface Project {
  id: string;
  name: string;
  location: string;
  systemSize: number;
  targetAmount: number;
  fundingProgress: number;
  apy: number;
  duration: number;
  risk: RiskLevel;
  status: ProjectStatus;
  description: string;
  image: string;
  installerName: string;
  investorCount: number;
  createdAt: string;
}

export interface LendingPosition {
  projectId: string;
  projectName: string;
  amountInvested: number;
  lpTokens: number;
  currentValue: number;
  earnedYield: number;
  apy: number;
  projectStatus: ProjectStatus;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalEarned: number;
  activePositions: number;
  totalLpTokens: number;
}

export interface LoanDetails {
  totalLoanAmount: number;
  remainingBalance: number;
  nextPaymentDate: string;
  paymentsMade: number;
  totalPayments: number;
  monthlyPayment: number;
}

export interface EnergyTelemetry {
  daily: { day: string; kwh: number }[];
  weekly: { week: string; kwh: number }[];
  monthly: { month: string; kwh: number }[];
}

export interface InverterData {
  status: string;
  dailyYield: number;
  totalYield: number;
  temperature: number;
  efficiency: number;
}

export interface AdminProjectForm {
  name: string;
  location: string;
  systemSize: number;
  targetAmount: number;
  apy: number;
  duration: number;
  risk: RiskLevel;
  description: string;
  installerName: string;
}

export interface SecondaryListing {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  price: number;
  seller: string;
  createdAt: string;
  expirationDate?: number;
  status?: "active" | "expired" | "cancelled" | "pending";
  fee?: number;
  listingId?: number;
  durationDays?: number;
  tokenContract?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string;
  usdcBalance: number;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
