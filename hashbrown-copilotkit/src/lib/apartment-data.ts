export type { Apartment } from "../../../db/query";
import type { Apartment } from "../../../db/query";

let cache: Promise<Apartment[]> | null = null;

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
        cache = null;
        throw err;
      });
  }
  return cache;
}
