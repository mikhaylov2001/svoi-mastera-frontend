import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  FAVORITES_CHANGED_EVENT,
  readFavorites,
  toggleListingFavorite as storageToggleListing,
  toggleJobRequestFavorite as storageToggleJobRequest,
  isListingFavorite as storageIsListingFavorite,
  isJobRequestFavorite as storageIsJobRequestFavorite,
  favoritesCount as storageFavoritesCount,
} from '../utils/favoritesStorage';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { userId } = useAuth();
  const [tick, setTick] = useState(0);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const on = () => bump();
    window.addEventListener(FAVORITES_CHANGED_EVENT, on);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, on);
  }, [bump]);

  const snapshot = useMemo(() => readFavorites(userId), [userId, tick]);

  const toggleListing = useCallback(
    (listingId) => {
      storageToggleListing(userId, listingId);
    },
    [userId],
  );

  const toggleJobRequest = useCallback(
    (jobRequestId) => {
      storageToggleJobRequest(userId, jobRequestId);
    },
    [userId],
  );

  const isListingFavorite = useCallback(
    (listingId) => storageIsListingFavorite(userId, listingId),
    [userId, tick],
  );

  const isJobRequestFavorite = useCallback(
    (jobRequestId) => storageIsJobRequestFavorite(userId, jobRequestId),
    [userId, tick],
  );

  const count = useMemo(() => storageFavoritesCount(userId), [userId, tick]);

  const value = useMemo(
    () => ({
      listingIds: snapshot.listings,
      jobRequestIds: snapshot.jobRequests,
      toggleListing,
      toggleJobRequest,
      isListingFavorite,
      isJobRequestFavorite,
      count,
    }),
    [
      snapshot.listings,
      snapshot.jobRequests,
      toggleListing,
      toggleJobRequest,
      isListingFavorite,
      isJobRequestFavorite,
      count,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
