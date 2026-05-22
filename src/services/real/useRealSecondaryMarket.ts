import { useState, useCallback } from "react";
import type { SecondaryListing, Project } from "../../types";

export default function useRealSecondaryMarket(walletAddress: string | undefined) {
  const [listings, setListings] = useState<SecondaryListing[]>(mockListings);
  const [myListings, setMyListings] = useState<SecondaryListing[]>([]);

  const buyListing = useCallback(async (listingId: string) => {
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    return true;
  }, []);

  const createListing = useCallback(
    (projectId: string, projectName: string, amount: number, price: number, seller: string) => {
      const newListing: SecondaryListing = {
        id: `LST-${Date.now()}`,
        projectId,
        projectName,
        amount,
        price,
        seller,
        createdAt: new Date().toISOString(),
      };
      setMyListings((prev) => [...prev, newListing]);
      setListings((prev) => [...prev, newListing]);
    },
    [],
  );

  return {
    data: listings,
    myListings,
    isLoading: false,
    error: null,
    mutate: () => {},
    buyListing,
    createListing,
  };
}

const mockListings: SecondaryListing[] = [
  {
    id: "LST-001",
    projectId: "SOL-001",
    projectName: "Bangkok Solar Community",
    amount: 1000,
    price: 1050,
    seller: "0x1234...5678",
    createdAt: "2026-05-15T10:30:00Z",
  },
  {
    id: "LST-002",
    projectId: "SOL-002",
    projectName: "Chiang Mai Solar Farm",
    amount: 2500,
    price: 2725,
    seller: "0x8765...4321",
    createdAt: "2026-05-16T14:00:00Z",
  },
  {
    id: "LST-003",
    projectId: "SOL-003",
    projectName: "Phuket Solar Initiative",
    amount: 500,
    price: 520,
    seller: "0xabcd...ef01",
    createdAt: "2026-05-17T09:15:00Z",
  },
];
