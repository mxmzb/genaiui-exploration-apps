import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import type { Fee, calculateCosts } from "./pricing";

export interface Apartment {
  id: string;
  title: string;
  neighborhood: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: string;
  description: string;
  imageUrl: string;
  availableFrom: string | null;
  petPolicy: string;
  amenities: string[];
  nearbyTransit: string[];
  reviews: { author: string; rating: number; text: string }[];
  floor: number | null;
  elevator: boolean | null;
  leaseMonths: number[];
  utilitiesIncluded: string[];
  petRules: {
    cats: boolean | null;
    dogs: boolean | null;
    maxWeightLbs: number | null;
  };
  fees: Fee[];
  photos: { url: string; alt: string; caption: string }[];
  transit: { name: string; walkMinutes: number }[];
  costs: ReturnType<typeof calculateCosts>;
}

const DB_PATH = fileURLToPath(new URL("./apartments.db", import.meta.url));
const cache = new Map<string, Apartment[]>();

/** Server-only, shared by the examples. Run the db seed after changing listings. */
export function getAllApartments(databasePath = DB_PATH): Apartment[] {
  if (!cache.has(databasePath)) {
    const db = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      const rows = db
        .prepare("SELECT payload FROM apartments ORDER BY CAST(id AS INTEGER)")
        .all() as { payload: string }[];
      cache.set(
        databasePath,
        rows.map((row) => JSON.parse(row.payload) as Apartment),
      );
    } finally {
      db.close();
    }
  }
  return cache.get(databasePath)!;
}

export function clearApartmentCache(): void {
  cache.clear();
}
