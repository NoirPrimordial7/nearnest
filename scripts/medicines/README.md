# Medifind Medicine Demo Seed Pipeline

These scripts create demo medicine documents from public openFDA drug label data.
They are intended for development/demo discovery testing only. The data needs
India-specific pharmacy review before any launch use.

## Fetch Sample Data

```powershell
python scripts/medicines/fetch_openfda_medicines.py --limit 1000
```

Default output:

```txt
scripts/medicines/out/medicines.openfda.sample.json
```

The normalized records include medicine names, brand/generic fields,
manufacturer, composition, category hints, prescription flag, source metadata,
warnings, and search tokens. The script does not scrape medicine images from
random websites. The app should render generated pack placeholders when
`imageUrl` is empty.

By default the fetch script uses openFDA human prescription labels. Pass
`--search` with another openFDA search expression to sample a different public
label subset.

## Dry-Run Import

Dry-run is the default and does not initialize Firebase Admin or write data.

```powershell
node scripts/medicines/import_medicines_to_firestore.cjs --project nearnest-platform --file scripts/medicines/out/medicines.openfda.sample.json --limit 100 --dry-run
```

## Apply Import

Apply mode writes only to the top-level `medicines` collection. It never writes
users, roles, stores, orders, inventory, or permissions.

```powershell
node scripts/medicines/import_medicines_to_firestore.cjs --project nearnest-platform --file scripts/medicines/out/medicines.openfda.sample.json --limit 100 --apply
```

Existing medicine documents are skipped unless `--overwrite` is also passed.

```powershell
node scripts/medicines/import_medicines_to_firestore.cjs --project nearnest-platform --file scripts/medicines/out/medicines.openfda.sample.json --limit 100 --apply --overwrite
```

## Notes

- openFDA/DailyMed-style labels are public drug labeling data, not a curated
  Indian retail pharmacy catalog.
- Prescription flags are inferred from source metadata and must be reviewed.
- Strength/form/category fields are best-effort normalized for demo search.
- Production medicine data should come from an approved India-specific source.
