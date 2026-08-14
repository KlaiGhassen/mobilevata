/**
 * Download missing brand logos into web/public/brands.
 * Source: filippofilip95/car-logos-dataset (thumbs).
 *
 * Usage: node scripts/download-brand-logos.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'web', 'public', 'brands');
const BASE =
  'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb';

/** brand display name → preferred filename slug(s) to try */
const BRANDS = {
  'Mercedes-Benz': ['mercedes-benz'],
  BMW: ['bmw'],
  Audi: ['audi'],
  Volkswagen: ['volkswagen'],
  Porsche: ['porsche'],
  Ford: ['ford'],
  Skoda: ['skoda'],
  Opel: ['opel'],
  Toyota: ['toyota'],
  Volvo: ['volvo'],
  Renault: ['renault'],
  Peugeot: ['peugeot'],
  Tesla: ['tesla'],
  Hyundai: ['hyundai'],
  Kia: ['kia'],
  Citroen: ['citroen'],
  Fiat: ['fiat'],
  Seat: ['seat'],
  Cupra: ['cupra'],
  Mini: ['mini'],
  'Land Rover': ['land-rover'],
  Jaguar: ['jaguar'],
  Mazda: ['mazda'],
  Honda: ['honda'],
  Nissan: ['nissan'],
  Mitsubishi: ['mitsubishi'],
  Suzuki: ['suzuki'],
  Dacia: ['dacia'],
  'Alfa Romeo': ['alfa-romeo'],
  Jeep: ['jeep'],
  Lexus: ['lexus'],
  Subaru: ['subaru'],
  Chevrolet: ['chevrolet'],
  Smart: ['smart'],
  DS: ['ds', 'ds-automobiles'],
  MG: ['mg'],
  Polestar: ['polestar'],
  BYD: ['byd'],
  Dodge: ['dodge'],
  Infiniti: ['infiniti'],
  Genesis: ['genesis'],
  Bentley: ['bentley'],
  'Aston Martin': ['aston-martin'],
  Ferrari: ['ferrari'],
  Lamborghini: ['lamborghini'],
  Maserati: ['maserati'],
  McLaren: ['mclaren'],
  'Rolls-Royce': ['rolls-royce'],
  Iveco: ['iveco'],
  Isuzu: ['isuzu'],
  SsangYong: ['ssangyong', 'ssang-yong'],
  Daihatsu: ['daihatsu'],
  Lancia: ['lancia'],
  Saab: ['saab'],
  Cadillac: ['cadillac'],
  Abarth: ['abarth'],
  Chrysler: ['chrysler'],
};

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const existing = new Set(
    fs.readdirSync(OUT_DIR).map((f) => f.replace(/\.png$/i, '').toLowerCase()),
  );

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const [name, slugs] of Object.entries(BRANDS)) {
    const primary = slugs[0];
    const dest = path.join(OUT_DIR, `${primary}.png`);
    if (existing.has(primary) && fs.existsSync(dest)) {
      skip += 1;
      console.log(`skip  ${primary}.png (${name})`);
      continue;
    }

    let buf = null;
    let used = null;
    for (const slug of slugs) {
      buf = await download(`${BASE}/${slug}.png`);
      if (buf) {
        used = slug;
        break;
      }
    }

    if (!buf) {
      fail += 1;
      console.error(`FAIL  ${primary}.png (${name})`);
      continue;
    }

    fs.writeFileSync(dest, buf);
    ok += 1;
    console.log(`ok    ${primary}.png ← ${used}.png (${name}, ${buf.length}b)`);
  }

  console.log(`\nDone. downloaded=${ok} skipped=${skip} failed=${fail}`);
  console.log(`Folder: ${OUT_DIR}`);
  console.log(`Total files: ${fs.readdirSync(OUT_DIR).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
