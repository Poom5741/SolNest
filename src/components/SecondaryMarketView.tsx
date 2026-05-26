import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ShoppingCart,
  Plus,
  X,
  Users,
  Clock,
  Ban,
  AlertTriangle,
} from "lucide-react";
import type { SecondaryListing, Project, Language } from "../types";
import { translations } from "../translations";
import { useToast } from "./Toast";
import { useFormatCurrency } from "../hooks/useFormatCurrency";

interface SecondaryMarketViewProps {
  listings: SecondaryListing[];
  myListings: SecondaryListing[];
  projects: Project[];
  lang: Language;
  walletAddress: string;
  isLoading?: boolean;
  needsLpApproval?: boolean;
  needsUsdcApproval?: boolean;
  onBuy: (listingId: string) => Promise<boolean>;
  onCreateListing: (projectId: string, projectName: string, amount: number, price: number, seller: string, durationDays?: number) => void;
  onCancel?: (listingId: string) => Promise<boolean>;
  onApproveLp?: () => Promise<boolean>;
  onApproveUsdc?: () => Promise<boolean>;
}

function formatRelativeTime(expirationTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = expirationTimestamp - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `Expires in ${days}d`;
  if (hours > 0) return `Expires in ${hours}h`;
  const minutes = Math.floor(diff / 60);
  return `Expires in ${minutes}m`;
}

function formatExactDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-48 mb-2" />
          <div className="h-3 bg-white/5 rounded w-72" />
        </div>
      ))}
    </div>
  );
}

export default function SecondaryMarketView({
  listings,
  myListings,
  projects,
  lang,
  walletAddress,
  isLoading = false,
  needsLpApproval = false,
  needsUsdcApproval = false,
  onBuy,
  onCreateListing,
  onCancel,
  onApproveLp,
  onApproveUsdc,
}: SecondaryMarketViewProps) {
  const t = translations[lang];
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [newListing, setNewListing] = useState({
    projectId: "",
    amount: 100,
    price: 1.0,
    durationDays: 7,
  });

  const formatCurrency = useFormatCurrency(lang, 2);

  const sortedListings = [...listings].sort((a, b) => (a.listingId ?? 0) - (b.listingId ?? 0));

  const isExpired = (listing: SecondaryListing) =>
    listing.status === "expired" ||
    (listing.expirationDate != null && listing.expirationDate < Math.floor(Date.now() / 1000));

  const handleBuy = async (listing: SecondaryListing) => {
    if (needsUsdcApproval && onApproveUsdc) {
      setApproveLoading(true);
      const approved = await onApproveUsdc();
      setApproveLoading(false);
      if (!approved) return;
    }
    setBuyLoading(listing.id);
    const ok = await onBuy(listing.id);
    setBuyLoading(null);
    if (ok) addToast("success", t.smBuySuccess);
  };

  const handleCancel = async (listing: SecondaryListing) => {
    if (!onCancel) return;
    setCancelLoading(listing.id);
    const ok = await onCancel(listing.id);
    setCancelLoading(null);
    setCancelConfirmId(null);
    if (ok) addToast("success", t.smCancelListing);
  };

  const handleCreateListing = async () => {
    if (!newListing.projectId || newListing.amount <= 0 || newListing.price <= 0) return;
    if (newListing.durationDays < 1 || newListing.durationDays > 30) return;
    const project = projects.find(p => p.id === newListing.projectId);
    if (!project) return;

    if (needsLpApproval && onApproveLp) {
      setApproveLoading(true);
      const approved = await onApproveLp();
      setApproveLoading(false);
      if (!approved) return;
    }

    onCreateListing(newListing.projectId, project.name, newListing.amount, newListing.price, walletAddress, newListing.durationDays);
    addToast("success", t.smCreateListing);
    setShowCreate(false);
    setNewListing({ projectId: "", amount: 100, price: 1.0, durationDays: 7 });
  };

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t.smTitle}</h1>
          <p className="text-white/60 mt-2">{t.smDesc}</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? t.close : t.smCreateListing}
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white/5 border border-white/5 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">{t.smCreateListing}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.smProject}</label>
              <select
                value={newListing.projectId}
                onChange={e => setNewListing(p => ({ ...p, projectId: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">Select project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.smAmount} (LP Tokens)</label>
              <input
                type="number"
                value={newListing.amount}
                onChange={e => setNewListing(p => ({ ...p, amount: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Total {t.smPrice} (USDC)</label>
              <input
                type="number"
                value={newListing.price}
                onChange={e => setNewListing(p => ({ ...p, price: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                min={0.01}
                step={0.01}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.smDurationDays} (1-30 days)</label>
              <input
                type="number"
                value={newListing.durationDays}
                onChange={e => setNewListing(p => ({ ...p, durationDays: Math.min(30, Math.max(1, Number(e.target.value))) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                min={1}
                max={30}
              />
            </div>
          </div>
          {needsLpApproval ? (
            <button
              onClick={handleCreateListing}
              disabled={approveLoading}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {approveLoading ? t.loading : t.smApproveFirst.replace("{symbol}", "LP Tokens")}
            </button>
          ) : (
            <button
              onClick={handleCreateListing}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t.smCreateListing}
            </button>
          )}
        </motion.div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{t.smList} ({listings.length})</h2>
          {isLoading ? (
            <LoadingSkeleton />
          ) : listings.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-8 text-center">
              <p className="text-white/60 text-sm font-medium mb-1">No Listings Available</p>
              <p className="text-white/40 text-xs">No LP tokens are currently listed for sale. Check back later or list your own tokens.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedListings.map((listing, i) => {
                const expired = isExpired(listing);
                const isCancelled = listing.status === "cancelled";
                const isInactive = expired || isCancelled;
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 ${isInactive ? "opacity-50" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{listing.projectName}</span>
                        {expired && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium">
                            {t.smExpired}
                          </span>
                        )}
                        {isCancelled && !expired && (
                          <span className="px-2 py-0.5 bg-white/10 text-white/50 rounded-full text-[10px] font-medium">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>{formatCurrency(listing.amount)} LP</span>
                        <span>{formatCurrency(listing.price)} USDC</span>
                        {listing.fee != null && (
                          <span className="text-white/40">{t.smFee}: {(listing.fee / 100).toFixed(1)}%</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {listing.seller}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/30 mt-1">
                        <span>Total: {formatCurrency(listing.amount * listing.price)} USDC</span>
                        {listing.expirationDate != null && (
                          <span className="flex items-center gap-1" title={formatExactDate(listing.expirationDate)}>
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(listing.expirationDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isInactive && listing.seller !== walletAddress && (
                      needsUsdcApproval ? (
                        <button
                          onClick={() => handleBuy(listing)}
                          disabled={buyLoading === listing.id || approveLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {approveLoading ? t.loading : "Approve USDC"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(listing)}
                          disabled={buyLoading === listing.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {buyLoading === listing.id ? t.loading : t.smBuy}
                        </button>
                      )
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{t.smMyListings} ({myListings.length})</h2>
          {isLoading ? (
            <LoadingSkeleton />
          ) : myListings.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-8 text-center">
              <p className="text-white/40 text-sm">{t.smNoListingsYet}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myListings.map((listing, i) => {
                const expired = isExpired(listing);
                const isCancelled = listing.status === "cancelled";
                const isActive = listing.status === "active" && !expired;
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`bg-white/5 border border-white/5 rounded-xl p-4 ${expired || isCancelled ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{listing.projectName}</span>
                          {expired && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-medium">
                              {t.smExpired}
                            </span>
                          )}
                          {isCancelled && !expired && (
                            <span className="px-2 py-0.5 bg-white/10 text-white/50 rounded-full text-[10px] font-medium">
                              Cancelled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span>{formatCurrency(listing.amount)} LP</span>
                          <span>{formatCurrency(listing.price)} USDC</span>
                          {listing.fee != null && (
                            <span className="text-white/40">{t.smFee}: {(listing.fee / 100).toFixed(1)}%</span>
                          )}
                          <span>Total: {formatCurrency(listing.amount * listing.price)} USDC</span>
                        </div>
                        {listing.expirationDate != null && (
                          <div className="flex items-center gap-1 text-xs text-white/30 mt-1" title={formatExactDate(listing.expirationDate)}>
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(listing.expirationDate)}
                          </div>
                        )}
                      </div>
                      {isActive && onCancel && (
                        cancelConfirmId === listing.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCancel(listing)}
                              disabled={cancelLoading === listing.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {cancelLoading === listing.id ? t.loading : t.confirm}
                            </button>
                            <button
                              onClick={() => setCancelConfirmId(null)}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancelConfirmId(listing.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {t.smCancelListing}
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
