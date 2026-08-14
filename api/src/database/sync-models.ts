/**
 * Upsert vehicle models for every brand in MongoDB.
 * Merges local European catalog + NHTSA vPIC scrape (when reachable).
 *
 * Usage: npm run sync:models
 */
import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import {
  CAR_MODELS_CATALOG,
  NHTSA_MAKE_ALIASES,
} from './car-models.catalog';

loadEnv({ path: resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI?.trim();
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required. Set it in api/.env');
  process.exit(1);
}

type BrandDoc = { _id: mongoose.Types.ObjectId; name: string };

async function fetchNhtsaModels(make: string): Promise<string[]> {
  const q = encodeURIComponent(make);
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${q}?format=json`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      Results?: Array<{ Model_Name?: string }>;
    };
    const names = (data.Results || [])
      .map((r) => (r.Model_Name || '').trim())
      .filter(Boolean);
    return [...new Set(names)];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function normalizeModelName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db!;
  console.log('Connected to MongoDB');

  const brands = (await db
    .collection('brands')
    .find({})
    .project({ name: 1 })
    .sort({ name: 1 })
    .toArray()) as BrandDoc[];

  if (!brands.length) {
    console.error('No brands found. Run npm run seed first, or create brands in admin.');
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;
  let scrapedBrands = 0;

  for (const brand of brands) {
    const catalog = CAR_MODELS_CATALOG[brand.name] || [];
    const nhtsaKey = NHTSA_MAKE_ALIASES[brand.name] || brand.name;
    const remote =
      nhtsaKey === '__catalog_only__' ? [] : await fetchNhtsaModels(nhtsaKey);
    if (remote.length) scrapedBrands += 1;

    const merged = [
      ...new Set(
        [...catalog, ...remote]
          .map(normalizeModelName)
          .filter((n) => n.length >= 1 && n.length <= 80),
      ),
    ].sort((a, b) => a.localeCompare(b));

    if (!merged.length) {
      console.log(`· ${brand.name}: no models (catalog/NHTSA empty)`);
      await sleep(120);
      continue;
    }

    let brandInserted = 0;
    for (const modelName of merged) {
      const existing = await db.collection('models').findOne({
        brandId: brand._id,
        name: modelName,
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      await db.collection('models').insertOne({
        name: modelName,
        brandId: brand._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      inserted += 1;
      brandInserted += 1;
    }

    console.log(
      `· ${brand.name}: +${brandInserted} new / ${merged.length} total candidates` +
        (remote.length ? ` (NHTSA ${remote.length})` : ' (catalog only)'),
    );
    await sleep(150);
  }

  console.log(
    `\nDone. Inserted ${inserted}, already present ${skipped}. Scraped NHTSA for ${scrapedBrands}/${brands.length} brands.`,
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
