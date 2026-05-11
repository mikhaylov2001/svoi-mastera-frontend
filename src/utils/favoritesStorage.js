const STORAGE_KEY = 'svoi_mastera_favorites_v1';
export const FAVORITES_CHANGED_EVENT = 'svoi-favorites-changed';

function storageUserId(userId) {
  if (userId != null && String(userId).trim() !== '') return String(userId);
  return 'guest';
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

/** @returns {{ listings: string[], jobRequests: string[] }} */
export function readFavorites(userId) {
  const uid = storageUserId(userId);
  const all = readAll();
  const b = all[uid];
  if (!b || typeof b !== 'object') return { listings: [], jobRequests: [] };
  return {
    listings: Array.isArray(b.listings) ? b.listings.map(String) : [],
    jobRequests: Array.isArray(b.jobRequests) ? b.jobRequests.map(String) : [],
  };
}

function writeBucket(userId, bucket) {
  const uid = storageUserId(userId);
  const all = readAll();
  all[uid] = {
    listings: [...new Set((bucket.listings || []).map(String))],
    jobRequests: [...new Set((bucket.jobRequests || []).map(String))],
  };
  writeAll(all);
}

export function setFavorites(userId, bucket) {
  writeBucket(userId, bucket);
}

export function toggleListingFavorite(userId, listingId) {
  const id = String(listingId);
  const cur = readFavorites(userId);
  const set = new Set(cur.listings);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  writeBucket(userId, { ...cur, listings: [...set] });
  return set.has(id);
}

export function toggleJobRequestFavorite(userId, jobRequestId) {
  const id = String(jobRequestId);
  const cur = readFavorites(userId);
  const set = new Set(cur.jobRequests);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  writeBucket(userId, { ...cur, jobRequests: [...set] });
  return set.has(id);
}

export function isListingFavorite(userId, listingId) {
  return readFavorites(userId).listings.includes(String(listingId));
}

export function isJobRequestFavorite(userId, jobRequestId) {
  return readFavorites(userId).jobRequests.includes(String(jobRequestId));
}

export function favoritesCount(userId) {
  const { listings, jobRequests } = readFavorites(userId);
  return listings.length + jobRequests.length;
}
