// Hashbrown's tool handlers run client-side, so we cannot import the native
// `better-sqlite3` module here. Instead, this file fetches apartments from a
// server route (`/api/apartments`) that reads from the shared SQLite database
// at `db/apartments.db`. The data is cached after the first fetch.
//
// `Apartment` mirrors the shape returned by `db/query.ts`.
export type { Apartment } from "../../../db/query";
import type { Apartment } from "../../../db/query";

let cache: Promise<Apartment[]> | null = null;

/**
 * Fetch all apartments from the shared SQLite-backed API. Cached for the
 * lifetime of the page.
 */
export function loadApartments(): Promise<Apartment[]> {
  if (!cache) {
    cache = fetch("/api/apartments")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load apartments: ${res.status}`);
        }
        return res.json() as Promise<Apartment[]>;
      })
      .catch((err) => {
        // Reset the cache on failure so a later call can retry.
        cache = null;
        throw err;
      });
  }
  return cache;
}
