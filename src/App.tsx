import React, { useState } from "react";
import { ViewType, Language, AdminProjectForm, ProjectStatus } from "./types";
import { translations } from "./translations";
import MarketplaceView from "./components/MarketplaceView";
import PortfolioView from "./components/PortfolioView";
import HomeownerView from "./components/HomeownerView";
import AdminView from "./components/AdminView";
import SecondaryMarketView from "./components/SecondaryMarketView";
import { ToastProvider, useToast } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { Web3Provider } from "./services/Web3Provider";
import { useMockProjects } from "./services/mock/useMockProjects";
import { useMockWallet } from "./services/mock/useMockWallet";
import { useMockLending } from "./services/mock/useMockLending";
import { useMockPortfolio } from "./services/mock/useMockPortfolio";
import { useMockHomeowner } from "./services/mock/useMockHomeowner";
import { useMockAdmin } from "./services/mock/useMockAdmin";
import { useMockSecondaryMarket } from "./services/mock/useMockSecondaryMarket";
import useRealWallet from "./services/real/useRealWallet";
import useRealProjects from "./services/real/useRealProjects";
import useRealLending from "./services/real/useRealLending";
import useRealPortfolio from "./services/real/useRealPortfolio";
import useRealHomeowner from "./services/real/useRealHomeowner";
import useRealAdmin from "./services/real/useRealAdmin";
import useRealSecondaryMarket from "./services/real/useRealSecondaryMarket";
import {
  Zap,
  Wallet,
  Menu,
  X,
  Globe,
  LogOut,
  ShieldCheck,
  BarChart3,
  Home,
  Settings,
  ShoppingCart,
} from "lucide-react";

const USE_REAL = import.meta.env.VITE_USE_REAL === "true";

const navItems: { id: ViewType; labelKey: string; icon: React.ElementType }[] = [
  { id: "marketplace", labelKey: "navMarketplace", icon: BarChart3 },
  { id: "portfolio", labelKey: "navPortfolio", icon: Wallet },
  { id: "homeowner", labelKey: "navHomeowner", icon: Home },
  { id: "admin", labelKey: "navAdmin", icon: Settings },
  { id: "secondary", labelKey: "navSecondary", icon: ShoppingCart },
];

function Atmosphere() {
  return (
    <div className="atmosphere">
      <div className="orb o1" />
      <div className="orb o2" />
      <div className="orb o3" />
      <div className="dot-grid" />
      <div className="noise" />
      <div className="particles">
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${8 + Math.random() * 12}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const [lang, setLang] = useState<Language>(() => {
    const cached = localStorage.getItem("solnest_lang");
    return cached === "th" || cached === "en" ? cached : "en";
  });
  const [currentView, setCurrentView] = useState<ViewType>("marketplace");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const t = translations[lang];
  const { addToast } = useToast();

  const mockProjects = useMockProjects();
  const mockWallet = useMockWallet();
  const mockLending = useMockLending();
  const mockPf = useMockPortfolio(mockLending.data);
  const mockHomeowner = useMockHomeowner();
  const mockAdmin = useMockAdmin(mockProjects.addProject, mockProjects.updateProjectStatus);
  const mockSM = useMockSecondaryMarket(mockWallet.data?.address);

  const realProjects = useRealProjects();
  const realWallet = useRealWallet();
  const realLending = useRealLending();
  const realPf = useRealPortfolio(realLending.data);
  const realHomeowner = useRealHomeowner();
  const realAdmin = useRealAdmin(realProjects.addProject, realProjects.updateProjectStatus);
  const realSM = useRealSecondaryMarket(realWallet.data?.address);

  const {
    data: projectsRaw,
    addProject,
    updateProjectStatus,
  } = USE_REAL ? realProjects : mockProjects;
  const projects = projectsRaw ?? [];

  const {
    data: walletRaw,
    connect,
    disconnect,
    updateBalance,
  } = USE_REAL ? realWallet : mockWallet;
  const wallet = walletRaw ?? { isConnected: false, address: "", usdcBalance: 0 };

  const {
    data: positionsRaw,
    deposit,
    withdraw,
    claimRewards,
  } = USE_REAL ? realLending : mockLending;
  const positions = positionsRaw ?? [];

  const { data: portfolioSummaryRaw } = USE_REAL ? realPf : mockPf;
  const portfolioSummary = portfolioSummaryRaw ?? { totalInvested: 0, totalEarned: 0, activePositions: 0, totalLpTokens: 0 };

  const { loan, telemetry, inverter, makeRepayment } = USE_REAL ? realHomeowner : mockHomeowner;

  const { createProject, updateStatus: adminUpdateStatus } = USE_REAL ? realAdmin : mockAdmin;

  const { data: listings, myListings, isLoading: smLoading, buyListing, createListing, cancelListing } = USE_REAL ? realSM : mockSM;

  const handleSetLanguage = (choice: Language) => {
    setLang(choice);
    localStorage.setItem("solnest_lang", choice);
  };

  const handleSetView = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finalizeWalletConnection = () => {
    connect();
    setShowWalletModal(false);
  };

  const handleDeposit = async (projectId: string, projectName: string, amount: number) => {
    const ok = await deposit(projectId, projectName, amount);
    if (ok && !USE_REAL) updateBalance(-amount);
    return ok;
  };

  const handleWithdraw = async (projectId: string, amount: number) => {
    const ok = await withdraw(projectId, amount);
    if (ok && !USE_REAL) updateBalance(amount);
    return ok;
  };

  const handleClaimRewards = async (projectId: string) => {
    return await claimRewards(projectId);
  };

  const handleCreateProject = (form: AdminProjectForm) => {
    createProject(form);
  };

  const handleUpdateProjectStatus = (id: string, status: ProjectStatus) => {
    if (USE_REAL) {
      adminUpdateStatus(id, status);
    } else {
      updateProjectStatus(id, status);
    }
  };

  const handleBuyListing = async (listingId: string) => {
    return await buyListing(listingId);
  };

  const handleCreateListing = (projectId: string, projectName: string, amount: number, price: number, _seller: string, durationDays?: number) => {
    createListing(projectId, projectName, amount, price, wallet.address ?? "", durationDays);
  };

  const handleCancelListing = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (listing?.listingId != null) {
      cancelListing(listing.listingId);
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen text-white flex flex-col font-sans antialiased relative z-[1]">
      <Atmosphere />
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[rgba(5,13,26,0.6)] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-[-4px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.35),transparent_65%)] animate-pulse" />
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center relative">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-bold text-lg text-white">{t.brandName}</span>
              <span className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-medium">
                <ShieldCheck className="w-3 h-3" />
                {t.tagline}
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSetView(item.id)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors ${
                      isActive
                        ? "text-white bg-white/[0.04]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {(t as Record<string, string>)[item.labelKey]}
                    {isActive && (
                      <span className="absolute left-3.5 right-3.5 -bottom-[1px] h-[2px] rounded-full bg-[var(--acc)] shadow-[0_0_12px_var(--acc),0_0_24px_var(--acc-glow)]" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {wallet.isConnected ? (
                <div className="hidden sm:flex items-center gap-2.5 h-10 px-3.5 pr-1.5 rounded-full bg-white/[0.04] border border-[var(--acc-glow)] shadow-[0_0_0_1px_var(--acc-soft),0_0_16px_-4px_var(--acc-glow)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_var(--acc)]" />
                  <span className="text-xs text-white/60">{wallet.address}</span>
                  <span className="text-xs font-bold font-mono text-white/70">{wallet.usdcBalance.toLocaleString()} USDC</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-500 border border-white/15" />
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="hidden sm:flex items-center gap-1.5 h-10 px-5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04140b] text-xs font-semibold shadow-[0_0_0_1px_var(--acc-glow),0_10px_24px_-8px_var(--acc-glow),0_1px_0_rgba(255,255,255,0.4)_inset] hover:brightness-110 transition-all active:translate-y-px"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {t.connectWallet}
                </button>
              )}

              <button
                onClick={() => handleSetLanguage(lang === "en" ? "th" : "en")}
                className="flex items-center gap-1 px-2 py-1.5 text-white/50 hover:text-white transition-colors text-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang === "en" ? "TH" : "EN"}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white/60 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[rgba(5,13,26,0.85)] backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSetView(item.id)}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {(t as Record<string, string>)[item.labelKey]}
                  </button>
                );
              })}
              {wallet.isConnected ? (
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t.disconnect} ({wallet.usdcBalance.toLocaleString()} USDC)
                </button>
              ) : (
                <button
                  onClick={() => { setShowWalletModal(true); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  {t.connectWallet}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <ErrorBoundary>
          {currentView === "marketplace" && (
            <MarketplaceView
              projects={projects}
              lang={lang}
              onDeposit={handleDeposit}
              walletConnected={wallet.isConnected ?? false}
              onConnectWallet={() => setShowWalletModal(true)}
            />
          )}
          {currentView === "portfolio" && (
            <PortfolioView
              positions={positions}
              summary={portfolioSummary}
              lang={lang}
              onWithdraw={handleWithdraw}
              onClaimRewards={handleClaimRewards}
            />
          )}
          {currentView === "homeowner" && (
            <HomeownerView
              loan={loan}
              telemetry={telemetry}
              inverter={inverter}
              lang={lang}
              onRepayment={makeRepayment}
            />
          )}
          {currentView === "admin" && (
            <AdminView
              projects={projects}
              lang={lang}
              onCreateProject={handleCreateProject}
              onUpdateStatus={handleUpdateProjectStatus}
            />
          )}
          {currentView === "secondary" && (
            <SecondaryMarketView
              listings={listings}
              myListings={myListings}
              projects={projects}
              lang={lang}
              walletAddress={wallet.address ?? ""}
              isLoading={smLoading}
              onBuy={handleBuyListing}
              onCreateListing={handleCreateListing}
              onCancel={handleCancelListing}
            />
          )}
        </ErrorBoundary>
      </main>

      <footer className="border-t border-white/[0.05] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold text-white">{t.brandName}</span>
            </div>
            <p className="text-xs text-[var(--t-3)] text-center">{t.footerDesc}</p>
            <p className="text-xs text-[var(--t-4)]">{t.rightsReserved}</p>
          </div>
        </div>
      </footer>

      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,14,0.65)] backdrop-blur-lg p-4">
          <div className="glass-3 p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t.walletModalTitle}</h3>
              <button onClick={() => setShowWalletModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-6">{t.walletModalDesc}</p>
            <button
              onClick={finalizeWalletConnection}
              className="w-full py-3 bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04140b] rounded-xl font-semibold shadow-[0_0_0_1px_var(--acc-glow),0_10px_24px_-8px_var(--acc-glow)] hover:brightness-110 transition-all mb-3"
            >
              {t.connectWallet}
            </button>
            <button
              onClick={() => setShowWalletModal(false)}
              className="w-full py-2 text-white/50 hover:text-white text-sm transition-colors"
            >
              {t.cancelConnect}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Web3Provider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </Web3Provider>
    </ErrorBoundary>
  );
}
