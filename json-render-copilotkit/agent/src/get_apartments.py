# #region genui - Query the same enriched records as the standalone application.
from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from langchain.tools import tool

_DB_PATH = Path(__file__).resolve().parents[3] / "db" / "apartments.db"


def _load_apartments(neighborhood=None, min_bedrooms=None, max_bedrooms=None,
                     max_rent=None, pet_friendly=None, apartment_ids=None):
    with sqlite3.connect(f"file:{_DB_PATH}?mode=ro", uri=True) as conn:
        records = [json.loads(row[0]) for row in conn.execute(
            "SELECT payload FROM apartments ORDER BY CAST(id AS INTEGER)"
        )]
    return [
        row for row in records
        if (not apartment_ids or row["id"] in apartment_ids)
        and (not neighborhood or neighborhood.lower() in row["neighborhood"].lower())
        and (min_bedrooms is None or row["bedrooms"] >= min_bedrooms)
        and (max_bedrooms is None or row["bedrooms"] <= max_bedrooms)
        and (max_rent is None or row["rent"] <= max_rent)
        and (not pet_friendly or row["petRules"]["cats"] is True or row["petRules"]["dogs"] is True)
    ]


@tool()
def get_apartments(
    neighborhood: str | None = None,
    min_bedrooms: int | None = None,
    max_bedrooms: int | None = None,
    max_rent: int | None = None,
    pet_friendly: bool | None = None,
    apartment_ids: list[str] | None = None,
) -> list[dict]:
    """Fetch synthetic listing facts, galleries, fees and computed fixed costs.

    apartment_ids: Exact IDs for details/comparisons.
    min_bedrooms/max_bedrooms: Inclusive limits; use equal values for an exact count.
    max_rent: Inclusive base-rent ceiling, excluding fees.
    pet_friendly: Require confirmed permission for at least one pet type.
    """
    return _load_apartments(neighborhood, min_bedrooms, max_bedrooms, max_rent,
                            pet_friendly, apartment_ids)
# #endregion genui
