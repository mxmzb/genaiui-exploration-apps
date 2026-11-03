import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { calculateCosts } from "./pricing";

const dbPath = fileURLToPath(new URL("./apartments.db", import.meta.url));
const source = JSON.parse(
  readFileSync(new URL("./listings.json", import.meta.url), "utf8"),
);
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Keep the original relational columns/tables for the other example apps.
// payload is the common rich record, with derived costs calculated once here.
db.transaction(() => {
  db.exec(`
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS apartment_amenities;
    DROP TABLE IF EXISTS apartment_transit;
    DROP TABLE IF EXISTS apartments;
    CREATE TABLE apartments (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, neighborhood TEXT NOT NULL,
      rent INTEGER NOT NULL, bedrooms INTEGER NOT NULL, bathrooms REAL NOT NULL,
      sqft INTEGER NOT NULL, address TEXT NOT NULL, description TEXT NOT NULL,
      image_url TEXT NOT NULL, available_from TEXT NOT NULL, pet_policy TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE apartment_amenities (
      apartment_id TEXT REFERENCES apartments(id), amenity TEXT NOT NULL,
      PRIMARY KEY (apartment_id, amenity)
    );
    CREATE TABLE apartment_transit (
      apartment_id TEXT REFERENCES apartments(id), transit TEXT NOT NULL,
      PRIMARY KEY (apartment_id, transit)
    );
    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT, apartment_id TEXT REFERENCES apartments(id),
      author TEXT NOT NULL, rating INTEGER NOT NULL, text TEXT NOT NULL
    );
  `);
  const apartment = db.prepare(
    "INSERT INTO apartments VALUES (@id, @title, @neighborhood, @rent, @bedrooms, @bathrooms, @sqft, @address, @description, @imageUrl, @available, @petPolicy, @payload)",
  );
  const amenity = db.prepare("INSERT INTO apartment_amenities VALUES (?, ?)");
  const transit = db.prepare("INSERT INTO apartment_transit VALUES (?, ?)");
  const review = db.prepare(
    "INSERT INTO reviews (apartment_id, author, rating, text) VALUES (?, ?, ?, ?)",
  );
  for (const row of source.records) {
    const record = { ...row, costs: calculateCosts(row.rent, row.fees) };
    apartment.run({
      ...row,
      available: row.availableFrom ?? "Not supplied",
      payload: JSON.stringify(record),
    });
    for (const value of row.amenities) amenity.run(row.id, value);
    for (const value of row.nearbyTransit) transit.run(row.id, value);
    for (const value of row.reviews)
      review.run(row.id, value.author, value.rating, value.text);
  }
})();
db.close();
console.log(
  `Seeded ${source.records.length} synthetic apartments into ${dbPath}`,
);
