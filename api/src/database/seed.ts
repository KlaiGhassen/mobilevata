import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { CAR_MODELS_CATALOG } from './car-models.catalog';

loadEnv({ path: resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI?.trim();
if (!MONGODB_URI) {
  console.error(
    'MONGODB_URI is required. Set it in api/.env (see api/.env.example).',
  );
  process.exit(1);
}
const mongoUri: string = MONGODB_URI;

const BRANDS = CAR_MODELS_CATALOG;

function brandLogoPath(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `/brands/${slug}.png`;
}

/** Served by the Next.js app from /public/brands (letter fallback if missing). */
const BRAND_LOGOS: Record<string, string> = Object.fromEntries(
  Object.keys(BRANDS).map((name) => [name, brandLogoPath(name)]),
);

const IMAGES = [
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80',
  'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=900&q=80',
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&q=80',
];

const BODY_TYPES = ['sedan', 'estate', 'suv', 'convertible', 'coupe', 'mpv', 'city'];
const FUELS = ['petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid'];
const TRANSMISSIONS = ['manual', 'automatic', 'semi_automatic'];
const COLORS = ['black', 'white', 'grey', 'blue', 'red', 'silver', 'green'];
const COUNTRIES = ['Germany', 'France', 'Belgium', 'Netherlands', 'Austria', 'Spain'];
const CITIES = ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Paris', 'Lyon', 'Amsterdam', 'Brussels'];
const FEATURES = [
  'climate_control',
  'gps',
  'parking_camera',
  'heated_seats',
  'panoramic_roof',
  'adaptive_cruise',
  'bluetooth',
  'led',
  'parking_assist',
  'apple_carplay',
  'android_auto',
  'alloy_wheels',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run seed in production (demo/admin accounts).');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db!;
  console.log('Connected to MongoDB');

  for (const name of [
    'users',
    'dealers',
    'brands',
    'models',
    'vehicles',
    'favorites',
    'comparisons',
    'messages',
    'conversations',
    'chat_messages',
    'reclamations',
  ]) {
    await db.collection(name).deleteMany({});
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('AdminPass123!', 10);

  await db.collection('users').insertOne({
    email: 'admin@autovia.local',
    passwordHash: adminHash,
    firstName: 'Admin',
    lastName: 'Autovia',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const buyer = (
    await db.collection('users').insertOne({
      email: 'buyer@mobile.de',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Martin',
      phone: '+33 6 12 34 56 78',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  ).insertedId;

  const dealerDefs = [
    { email: 'auto.berlin@mobile.de', first: 'Hans', last: 'Weber', name: 'Auto Berlin Premium', city: 'Berlin', country: 'Germany' },
    { email: 'munich.cars@mobile.de', first: 'Klaus', last: 'Muller', name: 'Munich Cars GmbH', city: 'Munich', country: 'Germany' },
    { email: 'paris.auto@mobile.de', first: 'Jean', last: 'Dupont', name: 'Paris Auto Occasion', city: 'Paris', country: 'France' },
  ];

  const dealers: { userId: mongoose.Types.ObjectId; dealerId: mongoose.Types.ObjectId }[] = [];
  for (const d of dealerDefs) {
    const userId = (
      await db.collection('users').insertOne({
        email: d.email,
        passwordHash,
        firstName: d.first,
        lastName: d.last,
        phone: '+49 30 123456',
        role: 'DEALER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).insertedId;
    const dealerId = (
      await db.collection('dealers').insertOne({
        userId,
        name: d.name,
        description:
          'Professional dealer specializing in new and used vehicles. Over 15 years of experience.',
        address: '12 Autobahn Strasse',
        city: d.city,
        country: d.country,
        postalCode: '10115',
        phone: '+49 30 123456',
        website: 'https://www.mobile.de',
        rating: 4.2 + Math.random() * 0.7,
        reviewCount: 40 + Math.floor(Math.random() * 200),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).insertedId;
    dealers.push({ userId, dealerId });
  }

  const popular = [
    'Mercedes-Benz',
    'BMW',
    'Audi',
    'Volkswagen',
    'Porsche',
    'Ford',
    'Skoda',
    'Opel',
    'Toyota',
    'Volvo',
  ];

  const brandMap: Record<
    string,
    { id: mongoose.Types.ObjectId; models: Record<string, mongoose.Types.ObjectId> }
  > = {};

  for (const [brandName, models] of Object.entries(BRANDS)) {
    const brandId = (
      await db.collection('brands').insertOne({
        name: brandName,
        logoUrl: BRAND_LOGOS[brandName] || null,
        popular: popular.includes(brandName),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).insertedId;
    const modelIds: Record<string, mongoose.Types.ObjectId> = {};
    for (const modelName of models) {
      modelIds[modelName] = (
        await db.collection('models').insertOne({
          name: modelName,
          brandId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).insertedId;
    }
    brandMap[brandName] = { id: brandId, models: modelIds };
  }

  let count = 0;
  for (let i = 0; i < 80; i++) {
    const brandName = pick(Object.keys(BRANDS));
    const modelName = pick(BRANDS[brandName]);
    const brand = brandMap[brandName];
    const dealer = pick(dealers);
    const year = 2012 + Math.floor(Math.random() * 14);
    const mileage = Math.floor(Math.random() * 180000) + 5000;
    const fuel = brandName === 'Tesla' ? 'electric' : pick(FUELS);
    const bodyType = pick(BODY_TYPES);
    const priceBase =
      brandName === 'Porsche' || brandName === 'Tesla'
        ? 35000
        : ['Mercedes-Benz', 'BMW', 'Audi'].includes(brandName)
          ? 18000
          : 8000;
    const price = Math.max(
      1500,
      priceBase + Math.floor(Math.random() * 40000) - Math.floor(mileage / 20),
    );
    const tags: string[] = [];
    if (year >= 2016 && mileage <= 150000 && price <= 50000) tags.push('family');
    if (year >= 2010 && price <= 7000) tags.push('first-car');
    if (year >= 2018 && price >= 35000 && mileage <= 80000) tags.push('luxury');
    if (['electric', 'hybrid', 'plugin_hybrid'].includes(fuel)) tags.push('eco');
    if (price >= 10000 && price <= 25000) tags.push('commute');
    if (bodyType === 'city' || price <= 15000) tags.push('city');

    const powerHp =
      fuel === 'electric'
        ? 150 + Math.floor(Math.random() * 250)
        : 90 + Math.floor(Math.random() * 250);

    await db.collection('vehicles').insertOne({
      title: `${brandName} ${modelName} ${year}`,
      description: `Excellent ${brandName} ${modelName} from ${year}. Well maintained vehicle with full service history available. Ideal for daily use.`,
      price,
      currency: 'EUR',
      year,
      mileage,
      fuelType: fuel,
      transmission: fuel === 'electric' ? 'automatic' : pick(TRANSMISSIONS),
      bodyType,
      powerHp,
      powerKw: Math.round(powerHp * 0.735),
      doors: bodyType === 'city' ? 3 : 5,
      seats: bodyType === 'mpv' ? 7 : 5,
      color: pick(COLORS),
      interiorColor: pick(['black', 'beige', 'grey']),
      condition: year >= 2025 && mileage < 1000 ? 'new' : 'used',
      country: pick(COUNTRIES),
      city: pick(CITIES),
      postalCode: String(10000 + Math.floor(Math.random() * 80000)),
      features: pickN(FEATURES, 5 + Math.floor(Math.random() * 5)),
      images: pickN(IMAGES, 3),
      categoryTags: tags,
      hasServiceBook: Math.random() > 0.3,
      hasWarranty: Math.random() > 0.5,
      accidentFree: Math.random() > 0.15,
      sellersType: 'PRO',
      electricRangeKm: fuel === 'electric' ? 250 + Math.floor(Math.random() * 300) : undefined,
      co2Emissions: fuel === 'electric' ? 0 : 90 + Math.floor(Math.random() * 100),
      consumption: fuel === 'electric' ? undefined : Number((4 + Math.random() * 6).toFixed(1)),
      vatDeductible: Math.random() > 0.4,
      published: true,
      views: Math.floor(Math.random() * 500),
      brandId: brand.id,
      modelId: brand.models[modelName],
      sellerId: dealer.userId,
      dealerId: dealer.dealerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    count++;
  }

  const vw = brandMap['Volkswagen'];
  await db.collection('vehicles').insertOne({
    title: 'Volkswagen Golf 2020 - Private',
    description: 'Sold by private owner, excellent condition, non-smoker.',
    price: 16500,
    currency: 'EUR',
    year: 2020,
    mileage: 62000,
    fuelType: 'petrol',
    transmission: 'manual',
    bodyType: 'sedan',
    powerHp: 130,
    powerKw: 96,
    doors: 5,
    seats: 5,
    color: 'white',
    condition: 'used',
    country: 'France',
    city: 'Lyon',
    features: ['climate_control', 'bluetooth', 'gps'],
    images: [IMAGES[0], IMAGES[1]],
    categoryTags: ['family', 'commute'],
    hasServiceBook: true,
    hasWarranty: false,
    accidentFree: true,
    sellersType: 'PRIVATE',
    published: true,
    views: 0,
    brandId: vw.id,
    modelId: vw.models['Golf'],
    sellerId: buyer,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  count++;

  console.log(`Seeded ${count} vehicles, ${Object.keys(BRANDS).length} brands`);
  console.log('Demo accounts (local only):');
  console.log('  buyer@mobile.de / password123');
  console.log('  auto.berlin@mobile.de / password123');
  console.log('Admin (reindex / ops — do not expose in UI):');
  console.log('  admin@autovia.local / AdminPass123!');
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
