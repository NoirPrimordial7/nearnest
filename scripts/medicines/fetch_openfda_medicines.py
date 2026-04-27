#!/usr/bin/env python3
"""Fetch and normalize public openFDA drug labels for Medifind demo seed data."""

import argparse
import hashlib
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


API_URL = "https://api.fda.gov/drug/label.json"
DEFAULT_OUT = Path("scripts/medicines/out/medicines.openfda.sample.json")
MAX_BATCH = 100


def first_string(value):
    if isinstance(value, list):
        for item in value:
            result = first_string(item)
            if result:
                return result
    if isinstance(value, str):
        cleaned = re.sub(r"\s+", " ", value).strip()
        return cleaned
    return ""


def trim_text(value, limit):
    cleaned = first_string(value)
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 1].rstrip() + "."


def list_strings(value, limit=8):
    if not isinstance(value, list):
        value = [value] if value else []
    rows = []
    for item in value:
        cleaned = first_string(item)
        if cleaned and cleaned not in rows:
            rows.append(cleaned)
        if len(rows) >= limit:
            break
    return rows


def slugify(value, fallback):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if slug:
        return slug[:90]
    return fallback


def tokenize(*values):
    tokens = set()
    for value in values:
        if isinstance(value, list):
            for item in value:
                tokens.update(tokenize(item))
            continue
        text = first_string(value).lower()
        for token in re.findall(r"[a-z0-9]+", text):
            if len(token) >= 2:
                tokens.add(token)
    return sorted(tokens)


def infer_form(record):
    dosage = list_strings(record.get("openfda", {}).get("dosage_form"))
    if dosage:
        value = dosage[0].lower()
        if "capsule" in value:
            return "capsule"
        if "injection" in value:
            return "injection"
        if "cream" in value:
            return "cream"
        if "ointment" in value:
            return "ointment"
        if "solution" in value or "syrup" in value:
            return "syrup"
        if "tablet" in value:
            return "tablet"
    return "tablet"


def infer_categories(record):
    text = " ".join(
        list_strings(record.get("indications_and_usage"), 3) +
        list_strings(record.get("purpose"), 3) +
        list_strings(record.get("openfda", {}).get("pharm_class_epc"), 3)
    ).lower()
    categories = []
    keyword_map = {
        "pain": "pain-relief",
        "analgesic": "pain-relief",
        "fever": "fever",
        "antibiotic": "antibiotic",
        "antihistamine": "allergy",
        "allergy": "allergy",
        "cough": "cough-cold",
        "cold": "cough-cold",
        "antacid": "digestion",
        "diabetes": "diabetes",
        "hypertension": "cardiac",
        "blood pressure": "cardiac",
        "vitamin": "vitamins",
    }
    for needle, category in keyword_map.items():
        if needle in text and category not in categories:
            categories.append(category)
    return categories or ["general"]


def normalize_record(record):
    openfda = record.get("openfda", {})
    brand = first_string(openfda.get("brand_name"))
    generic = first_string(openfda.get("generic_name"))
    name = trim_text(brand or generic or first_string(record.get("spl_product_data_elements")), 96)
    source_id = first_string(record.get("id")) or first_string(record.get("set_id"))
    fallback_id = hashlib.sha1(json.dumps(record, sort_keys=True).encode()).hexdigest()[:16]
    medicine_id = slugify(name or source_id, fallback_id)
    manufacturer = first_string(openfda.get("manufacturer_name")) or "Unknown manufacturer"
    composition = trim_text(generic or first_string(record.get("active_ingredient")), 220)
    description = first_string(record.get("indications_and_usage")) or first_string(record.get("purpose"))
    warnings = list_strings(record.get("boxed_warning"), 2) + list_strings(record.get("warnings"), 3)
    product_type = " ".join(list_strings(openfda.get("product_type"), 3)).lower()
    route = first_string(openfda.get("route"))
    form = infer_form(record)
    categories = infer_categories(record)
    strength = first_string(record.get("dosage_and_administration"))
    aliases = [trim_text(value, 96) for value in [brand, generic, name] if value]

    return {
        "id": medicine_id,
        "name": name or "Unnamed medicine",
        "brandName": trim_text(brand, 96),
        "genericName": trim_text(generic, 120),
        "manufacturer": manufacturer,
        "composition": composition,
        "strength": strength[:180],
        "form": form,
        "route": route,
        "categories": categories,
        "categoryIds": categories,
        "requiresPrescription": "otc" not in product_type,
        "description": description[:700],
        "warnings": warnings[:5],
        "source": "openFDA drug label",
        "sourceId": source_id,
        "sourceUrl": f"{API_URL}?search=id:{urllib.parse.quote(source_id)}" if source_id else API_URL,
        "imageUrl": "",
        "imageSource": "",
        "aliases": sorted(set(aliases)),
        "searchKeywords": tokenize(name, brand, generic, manufacturer, composition, categories),
        "searchTokens": tokenize(name, brand, generic, manufacturer, composition, categories),
        "isActive": True,
    }


def fetch_batch(limit, skip, search):
    query = {"limit": limit, "skip": skip}
    if search:
        query["search"] = search
    params = urllib.parse.urlencode(query)
    with urllib.request.urlopen(f"{API_URL}?{params}", timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--search",
        default='openfda.product_type:"HUMAN PRESCRIPTION DRUG"',
        help="openFDA search expression. Defaults to human prescription labels.",
    )
    args = parser.parse_args()

    target = max(1, min(args.limit, 1000))
    medicines = []
    seen = set()

    for skip in range(0, target, MAX_BATCH):
        batch_limit = min(MAX_BATCH, target - len(medicines))
        if batch_limit <= 0:
            break
        payload = fetch_batch(batch_limit, skip, args.search)
        for record in payload.get("results", []):
            medicine = normalize_record(record)
            if medicine["id"] in seen:
                continue
            seen.add(medicine["id"])
            medicines.append(medicine)
            if len(medicines) >= target:
                break

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(medicines, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(medicines)} medicines to {args.out}")


if __name__ == "__main__":
    main()
