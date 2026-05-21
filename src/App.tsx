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
import { useMockProjects } from "./services/mock/useMockProjects";
import { useMockWallet } from "./services/mock/useMockWallet";
import { useMockLending } from "./services/mock/useMockLending";
import { useMockPortfolio } from "./services/mock/useMockPortfolio";
import { useMockHomeowner } from "./services/mock/useMockHomeowner";
import { useMockAdmin } from "./services/mock/useMockAdmin";
import { useMockSecondaryMarket } from "./services/mock/useMockSecondaryMarket";
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

const navItems: { id: ViewType; labelKey: string; icon: React.ElementType }[] = [
  { id: "marketplace", labelKey: "navMarketplace", icon: BarChart3 },
  { id: "portfolio", labelKey: "navPortfolio", icon: Wallet },
  { id: "homeowner", labelKey: "navHomeowner", icon: Home },
  { id: "admin", labelKey: "navAdmin", icon: Settings },
  { id: "secondary", labelKey: "navSecondary", icon: ShoppingCart },
];

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
  const { data: projects, updateProjectStatus, addProject } = useMockProjects();
  const { data: wallet, connect, disconnect, updateBalance } = useMockWallet();
  const { data: positions, deposit, withdraw, claimRewards } = useMockLending();
  const { data: portfolioSummary } = useMockPortfolio(positions);
  const { loan, telemetry, inverter, makeRepayment } = useMockHomeowner();
  const { createProject } = useMockAdmin(addProject, updateProjectStatus);
  const { data: listings, myListings, buyListing, createListing } = useMockSecondaryMarket(wallet.address);

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
    if (ok) updateBalance(-amount);
    return ok;
  };

  const handleWithdraw = async (projectId: string, amount: number) => {
    const ok = await withdraw(projectId, amount);
    if (ok) updateBalance(amount);
    return ok;
  };

  const handleClaimRewards = async (projectId: string) => {
    return await claimRewards(projectId);
  };

  const handleCreateProject = (form: AdminProjectForm) => {
    createProject(form);
  };

  const handleUpdateProjectStatus = (id: string, status: ProjectStatus) => {
    updateProjectStatus(id, status);
  };

  const handleBuyListing = async (listingId: string) => {
    return await buyListing(listingId);
  };

  const handleCreateListing = (projectId: string, projectName: string, amount: number, price: number) => {
    createListing(projectId, projectName, amount, price, wallet.address);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex flex-col font-sans antialiased">
      <header className="sticky top-0 z-40 bg-[#0a1628]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
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
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {(t as Record<string, string>)[item.labelKey]}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {wallet.isConnected ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-white/60">{wallet.address}</span>
                  <span className="text-xs font-bold text-emerald-400">{wallet.usdcBalance.toLocaleString()} USDC</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
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
          <div className="md:hidden border-t border-white/5 bg-[#0f1d35]">
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
              walletConnected={wallet.isConnected}
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
              walletAddress={wallet.address}
              onBuy={handleBuyListing}
              onCreateListing={handleCreateListing}
            />
          )}
        </ErrorBoundary>
      </main>

      <footer className="border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold text-white">{t.brandName}</span>
            </div>
            <p className="text-xs text-white/40 text-center">{t.footerDesc}</p>
            <p className="text-xs text-white/30">{t.rightsReserved}</p>
          </div>
        </div>
      </footer>

      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0f1d35] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t.walletModalTitle}</h3>
              <button onClick={() => setShowWalletModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-6">{t.walletModalDesc}</p>
            <button
              onClick={finalizeWalletConnection}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors mb-3"
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
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
