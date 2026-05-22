import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ShoppingCart,
  Plus,
  X,
  TrendingUp,
  Users,
  ArrowUpRight,
  Wallet,
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
  onBuy: (listingId: string) => Promise<boolean>;
  onCreateListing: (projectId: string, projectName: string, amount: number, price: number, seller: string) => void;
}

export default function SecondaryMarketView({
  listings,
  myListings,
  projects,
  lang,
  walletAddress,
  onBuy,
  onCreateListing,
}: SecondaryMarketViewProps) {
  const t = translations[lang];
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [newListing, setNewListing] = useState({
    projectId: "",
    amount: 100,
    price: 1.0,
  });

  const formatCurrency = useFormatCurrency(lang, 2);

  const handleBuy = async (listing: SecondaryListing) => {
    setBuyLoading(listing.id);
    const ok = await onBuy(listing.id);
    setBuyLoading(null);
    if (ok) addToast("success", t.smBuySuccess);
  };

  const handleCreateListing = () => {
    if (!newListing.projectId || newListing.amount <= 0 || newListing.price <= 0) return;
    const project = projects.find(p => p.id === newListing.projectId);
    if (!project) return;
    onCreateListing(newListing.projectId, project.name, newListing.amount, newListing.price, walletAddress);
    addToast("success", t.smCreateListing);
    setShowCreate(false);
    setNewListing({ projectId: "", amount: 100, price: 1.0 });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <label className="text-xs text-white/40 block mb-1">{t.smPrice} (USDC / LP)</label>
              <input
                type="number"
                value={newListing.price}
                onChange={e => setNewListing(p => ({ ...p, price: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                min={0.01}
                step={0.01}
              />
            </div>
          </div>
          <button
            onClick={handleCreateListing}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t.smCreateListing}
          </button>
        </motion.div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{t.smList} ({listings.length})</h2>
          {listings.length === 0 ? (
            <p className="text-white/40 text-sm">{t.smNoListings}</p>
          ) : (
            <div className="space-y-2">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{listing.projectName}</div>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>{formatCurrency(listing.amount)} LP</span>
                      <span>{formatCurrency(listing.price)} USDC / LP</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {listing.seller}
                      </span>
                    </div>
                    <div className="text-xs text-white/30 mt-1">
                      Total: {formatCurrency(listing.amount * listing.price)} USDC
                    </div>
                  </div>
                  {listing.seller !== walletAddress && (
                    <button
                      onClick={() => handleBuy(listing)}
                      disabled={buyLoading === listing.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {t.smBuy}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{t.smMyListings} ({myListings.length})</h2>
          {myListings.length === 0 ? (
            <p className="text-white/40 text-sm">{t.smNoMyListings}</p>
          ) : (
            <div className="space-y-2">
              {myListings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white/5 border border-white/5 rounded-xl p-4"
                >
                  <div className="font-semibold text-white mb-1">{listing.projectName}</div>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>{formatCurrency(listing.amount)} LP</span>
                    <span>{formatCurrency(listing.price)} USDC / LP</span>
                    <span>Total: {formatCurrency(listing.amount * listing.price)} USDC</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
