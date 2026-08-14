export const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid'] as const;
export const TRANSMISSIONS = ['manual', 'automatic', 'semi_automatic'] as const;
export const BODY_TYPES = [
  'sedan',
  'estate',
  'suv',
  'convertible',
  'coupe',
  'mpv',
  'city',
] as const;

export const COLORS = [
  'black',
  'white',
  'silver',
  'grey',
  'blue',
  'red',
  'green',
  'yellow',
  'orange',
  'brown',
  'beige',
] as const;

export type FuelType = (typeof FUEL_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type BodyType = (typeof BODY_TYPES)[number];
