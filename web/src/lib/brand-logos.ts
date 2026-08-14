/** Fallback paths when API logoUrl is missing (matches /public/brands). */
const SLUGS: Record<string, string> = {
  'Mercedes-Benz': 'mercedes-benz',
  BMW: 'bmw',
  Audi: 'audi',
  Volkswagen: 'volkswagen',
  Porsche: 'porsche',
  Ford: 'ford',
  Skoda: 'skoda',
  Opel: 'opel',
  Toyota: 'toyota',
  Volvo: 'volvo',
  Renault: 'renault',
  Peugeot: 'peugeot',
  Tesla: 'tesla',
  Hyundai: 'hyundai',
  Kia: 'kia',
  Citroen: 'citroen',
  'Citroën': 'citroen',
  Fiat: 'fiat',
  Seat: 'seat',
  Cupra: 'cupra',
  Mini: 'mini',
  'Land Rover': 'land-rover',
  Jaguar: 'jaguar',
  Mazda: 'mazda',
  Honda: 'honda',
  Nissan: 'nissan',
  Mitsubishi: 'mitsubishi',
  Suzuki: 'suzuki',
  Dacia: 'dacia',
  'Alfa Romeo': 'alfa-romeo',
  Jeep: 'jeep',
  Lexus: 'lexus',
  Subaru: 'subaru',
  Chevrolet: 'chevrolet',
  Smart: 'smart',
  DS: 'ds',
  MG: 'mg',
  Polestar: 'polestar',
  BYD: 'byd',
  Dodge: 'dodge',
  Chrysler: 'chrysler',
  Infiniti: 'infiniti',
  Genesis: 'genesis',
  Bentley: 'bentley',
  'Aston Martin': 'aston-martin',
  Ferrari: 'ferrari',
  Lamborghini: 'lamborghini',
  Maserati: 'maserati',
  McLaren: 'mclaren',
  'Rolls-Royce': 'rolls-royce',
  Iveco: 'iveco',
  Isuzu: 'isuzu',
  SsangYong: 'ssangyong',
  Daihatsu: 'daihatsu',
  Lancia: 'lancia',
  Saab: 'saab',
  Cadillac: 'cadillac',
  Abarth: 'abarth',
};

export function brandSlug(name: string): string {
  return (
    SLUGS[name] ||
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export function brandLogoSrc(
  name: string,
  logoUrl?: string | null,
): string | null {
  if (logoUrl) return logoUrl;
  const slug = brandSlug(name);
  return slug ? `/brands/${slug}.png` : null;
}
