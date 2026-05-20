# #region genui - Apartment data tool: queries the shared SQLite database at db/apartments.db
from __future__ import annotations

import sqlite3
from pathlib import Path

from langchain.tools import tool

# Resolve the shared DB path: db/apartments.db at the repo root.
# This file lives at apps/openui-copilotkit/agent/src/get_apartments.py, so the
# repo root is four parents up.
_DB_PATH = Path(__file__).resolve().parents[3] / "db" / "apartments.db"


def _format_rent(rent: int) -> str:
    return f"${rent:,}/mo"


def _format_available(available_from: str) -> str:
    """Convert ISO date (YYYY-MM-DD) to a human label like 'June 2026'."""
    try:
        year, month, _ = available_from.split("-")
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ]
        return f"{month_names[int(month) - 1]} {year}"
    except (ValueError, IndexError):
        return available_from


def _load_apartments(
    neighborhood: str | None = None,
    min_bedrooms: int | None = None,
    max_bedrooms: int | None = None,
    max_rent: int | None = None,
    pet_friendly: bool | None = None,
) -> list[dict]:
    """Run the query against the shared SQLite database with the given filters."""
    conn = sqlite3.connect(f"file:{_DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        clauses: list[str] = []
        params: list[object] = []

        if neighborhood:
            clauses.append("LOWER(neighborhood) LIKE ?")
            params.append(f"%{neighborhood.lower()}%")
        if min_bedrooms is not None:
            clauses.append("bedrooms >= ?")
            params.append(min_bedrooms)
        if max_bedrooms is not None:
            clauses.append("bedrooms <= ?")
            params.append(max_bedrooms)
        if max_rent is not None:
            clauses.append("rent <= ?")
            params.append(max_rent)
        if pet_friendly:
            clauses.append("LOWER(pet_policy) != 'no pets'")

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = conn.execute(
            f"""
            SELECT id, title, neighborhood, rent, bedrooms, bathrooms, sqft,
                   description, image_url, available_from, pet_policy
            FROM apartments
            {where}
            ORDER BY id
            """,
            params,
        ).fetchall()

        if not rows:
            return []

        ids = [row["id"] for row in rows]
        placeholders = ",".join("?" for _ in ids)

        amenity_rows = conn.execute(
            f"SELECT apartment_id, amenity FROM apartment_amenities WHERE apartment_id IN ({placeholders})",
            ids,
        ).fetchall()
        transit_rows = conn.execute(
            f"SELECT apartment_id, transit FROM apartment_transit WHERE apartment_id IN ({placeholders})",
            ids,
        ).fetchall()

        amenities_by_apt: dict[str, list[str]] = {}
        for row in amenity_rows:
            amenities_by_apt.setdefault(row["apartment_id"], []).append(row["amenity"])

        transit_by_apt: dict[str, list[str]] = {}
        for row in transit_rows:
            transit_by_apt.setdefault(row["apartment_id"], []).append(row["transit"])

        return [
            {
                "id": row["id"],
                "title": row["title"],
                "neighborhood": row["neighborhood"],
                "rent": _format_rent(row["rent"]),
                "bedrooms": row["bedrooms"],
                "bathrooms": row["bathrooms"],
                "sqft": row["sqft"],
                "description": row["description"],
                "imageUrl": row["image_url"],
                "petPolicy": row["pet_policy"],
                "availableFrom": _format_available(row["available_from"]),
                "amenities": amenities_by_apt.get(row["id"], []),
                "nearbyTransit": transit_by_apt.get(row["id"], []),
            }
            for row in rows
        ]
    finally:
        conn.close()


@tool()
def get_apartments(
    neighborhood: str | None = None,
    min_bedrooms: int | None = None,
    max_bedrooms: int | None = None,
    max_rent: int | None = None,
    pet_friendly: bool | None = None,
) -> list[dict]:
    """Search available apartments with optional filters.

    Args:
        neighborhood: Filter by neighborhood name (case-insensitive partial match).
        min_bedrooms: Minimum number of bedrooms (0 = studio).
        max_bedrooms: Maximum number of bedrooms.
        max_rent: Maximum monthly rent in dollars.
        pet_friendly: If true, exclude "No pets" listings.
    """
    return _load_apartments(
        neighborhood=neighborhood,
        min_bedrooms=min_bedrooms,
        max_bedrooms=max_bedrooms,
        max_rent=max_rent,
        pet_friendly=pet_friendly,
    )
# #endregion genui
