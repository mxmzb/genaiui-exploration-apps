// Re-exports from the shared SQLite-backed query module so all apps stay in
// sync with `db/apartments.db`. Keep this file's exports identical to the
// previous hardcoded shape (`Apartment` type and `apartments` array).
//
// Server-only: better-sqlite3 is a native module. This file is consumed by
// server route handlers and SSR-rendered system prompts; never import it from
// browser-only client code.
export type { Apartment } from "../../../db/query";
import { getAllApartments } from "../../../db/query";
import { resolve } from "node:path";

// Use the app working directory, which stays stable when Nitro bundles the server.
export const apartments = getAllApartments(
  resolve(
    process.cwd(),
    process.env.APARTMENTS_DB_PATH ?? "../db/apartments.db",
  ),
);
