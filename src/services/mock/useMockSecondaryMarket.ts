import { useState, useCallback } from "react";
import type { SecondaryListing } from "../../types";
import { mockSecondaryListings } from "./mockData";

interface UseMockSecondaryMarketReturn {
  data: SecondaryListing[];
  myListings: SecondaryListing[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  buyListing: (listingId: string) => Promise<boolean>;
  createListing: (projectId: string, projectName: string, amount: number, price: number, seller: string) => void;
}

export function useMockSecondaryMarket(walletAddress: string): UseMockSecondaryMarketReturn {
  const [listings, setListings] = useState<SecondaryListing[]>([...mockSecondaryListings]);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const myListings = listings.filter(l => l.seller === walletAddress);

  const buyListing = useCallback(async (listingId: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setListings(prev => prev.filter(l => l.id !== listingId));
    setIsLoading(false);
    return true;
  }, []);

  const createListing = useCallback(
    (projectId: string, projectName: string, amount: number, price: number, seller: string) => {
      const newListing: SecondaryListing = {
        id: `LST-${String(listings.length + 1).padStart(3, "0")}`,
        projectId,
        projectName,
        amount,
        price,
        seller,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setListings(prev => [...prev, newListing]);
    },
    [listings.length]
  );

  const mutate = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return { data: listings, myListings, isLoading, error, mutate, buyListing, createListing };
}
