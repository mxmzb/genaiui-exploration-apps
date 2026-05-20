import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
  availableFrom: string;
  petPolicy: string;
  amenities: string[];
  nearbyTransit: string[];
  reviews: { author: string; rating: number; text: string }[];
}

interface ApartmentRow {
  id: string;
  title: string;
  neighborhood: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: string;
  description: string;
  image_url: string;
  available_from: string;
  pet_policy: string;
}

interface ReviewRow {
  apartment_id: string;
  author: string;
  rating: number;
  text: string;
}

interface JoinRow {
  apartment_id: string;
  value: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "apartments.db");

let cached: Apartment[] | null = null;

function loadApartmentsFromDb(): Apartment[] {
  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  try {
    const apartmentRows = db
      .prepare(
        `SELECT id, title, neighborhood, rent, bedrooms, bathrooms, sqft,
                address, description, image_url, available_from, pet_policy
         FROM apartments
         ORDER BY id`,
      )
      .all() as ApartmentRow[];

    const amenityRows = db
      .prepare(`SELECT apartment_id, amenity AS value FROM apartment_amenities`)
      .all() as JoinRow[];

    const transitRows = db
      .prepare(`SELECT apartment_id, transit AS value FROM apartment_transit`)
      .all() as JoinRow[];

    const reviewRows = db
      .prepare(
        `SELECT apartment_id, author, rating, text
         FROM reviews
         ORDER BY id`,
      )
      .all() as ReviewRow[];

    const amenitiesByApt = new Map<string, string[]>();
    for (const row of amenityRows) {
      let list = amenitiesByApt.get(row.apartment_id);
      if (!list) {
        list = [];
        amenitiesByApt.set(row.apartment_id, list);
      }
      list.push(row.value);
    }

    const transitByApt = new Map<string, string[]>();
    for (const row of transitRows) {
      let list = transitByApt.get(row.apartment_id);
      if (!list) {
        list = [];
        transitByApt.set(row.apartment_id, list);
      }
      list.push(row.value);
    }

    const reviewsByApt = new Map<
      string,
      { author: string; rating: number; text: string }[]
    >();
    for (const row of reviewRows) {
      let list = reviewsByApt.get(row.apartment_id);
      if (!list) {
        list = [];
        reviewsByApt.set(row.apartment_id, list);
      }
      list.push({ author: row.author, rating: row.rating, text: row.text });
    }

    return apartmentRows.map((row) => ({
      id: row.id,
      title: row.title,
      neighborhood: row.neighborhood,
      rent: row.rent,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      sqft: row.sqft,
      address: row.address,
      description: row.description,
      imageUrl: row.image_url,
      availableFrom: row.available_from,
      petPolicy: row.pet_policy,
      amenities: amenitiesByApt.get(row.id) ?? [],
      nearbyTransit: transitByApt.get(row.id) ?? [],
      reviews: reviewsByApt.get(row.id) ?? [],
    }));
  } finally {
    db.close();
  }
}

/**
 * Returns all apartments from the shared SQLite database, with amenities,
 * transit, and reviews joined in. The result is cached for the lifetime of the
 * process — call `clearApartmentCache()` to force a re-read (useful in tests).
 *
 * Must run on the server: better-sqlite3 is a native Node module and cannot be
 * bundled for the browser.
 */
export function getAllApartments(): Apartment[] {
  if (cached === null) {
    cached = loadApartmentsFromDb();
  }
  return cached;
}

export function clearApartmentCache(): void {
  cached = null;
}
