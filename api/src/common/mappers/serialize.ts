export function toId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if ('toHexString' in value && typeof (value as { toHexString: () => string }).toHexString === 'function') {
      return (value as { toHexString: () => string }).toHexString();
    }
    if ('_id' in value) {
      return toId((value as { _id: unknown })._id);
    }
  }
  return String(value);
}

export function mapRef(ref: unknown): Record<string, unknown> | null {
  if (!ref || typeof ref !== 'object') return null;
  const obj = ref as Record<string, unknown>;
  return { ...obj, id: toId(obj._id ?? ref) };
}

export function asRecord(doc: { toObject: () => object }): Record<string, unknown> {
  return doc.toObject() as unknown as Record<string, unknown>;
}

export function serializeVehicle(doc: Record<string, unknown>) {
  const brand = mapRef(doc.brandId);
  const model = mapRef(doc.modelId);
  const dealer = mapRef(doc.dealerId);
  const seller = mapRef(doc.sellerId);

  return {
    id: toId(doc._id),
    title: doc.title,
    description: doc.description,
    price: doc.price,
    currency: doc.currency,
    year: doc.year,
    mileage: doc.mileage,
    fuelType: doc.fuelType,
    transmission: doc.transmission,
    bodyType: doc.bodyType,
    powerHp: doc.powerHp,
    powerKw: doc.powerKw,
    doors: doc.doors,
    seats: doc.seats,
    color: doc.color,
    interiorColor: doc.interiorColor,
    condition: doc.condition,
    country: doc.country,
    city: doc.city,
    postalCode: doc.postalCode,
    features: doc.features || [],
    images: doc.images || [],
    categoryTags: doc.categoryTags || [],
    hasServiceBook: doc.hasServiceBook,
    hasWarranty: doc.hasWarranty,
    accidentFree: doc.accidentFree,
    sellersType: doc.sellersType,
    electricRangeKm: doc.electricRangeKm,
    co2Emissions: doc.co2Emissions,
    consumption: doc.consumption,
    vatDeductible: doc.vatDeductible,
    published: doc.published,
    moderationReason: doc.moderationReason,
    views: doc.views,
    brandId: brand ? String(brand.id) : toId(doc.brandId),
    modelId: model ? String(model.id) : toId(doc.modelId),
    sellerId: seller ? String(seller.id) : toId(doc.sellerId),
    dealerId: dealer ? String(dealer.id) : toId(doc.dealerId),
    brand,
    model,
    dealer,
    seller,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function serializeEntity(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc;
  return { id: toId(_id), ...rest };
}
