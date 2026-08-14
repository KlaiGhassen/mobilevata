/**
 * Shared make → models catalog (European marketplace focused).
 * Used by seed + sync-models (merged with NHTSA scrape results).
 */
export const CAR_MODELS_CATALOG: Record<string, string[]> = {
  'Mercedes-Benz': [
    'A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'S-Class',
    'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS',
    'AMG GT', 'SL', 'V-Class', 'Sprinter', 'Vito',
  ],
  BMW: [
    '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series',
    'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM',
    'Z4', 'i3', 'i4', 'i5', 'i7', 'iX', 'iX1', 'iX3',
  ],
  Audi: [
    'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8',
    'e-tron', 'e-tron GT', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'SQ5', 'SQ7',
  ],
  Volkswagen: [
    'up!', 'Polo', 'Golf', 'Golf Plus', 'Golf Sportsvan', 'Jetta', 'Passat', 'Arteon',
    'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran', 'Sharan', 'Caddy', 'Transporter',
    'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz', 'Multivan', 'California',
  ],
  Porsche: ['911', '718 Boxster', '718 Cayman', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Ford: [
    'Fiesta', 'Focus', 'Mondeo', 'Mustang', 'Puma', 'Kuga', 'Explorer', 'Edge', 'EcoSport',
    'S-Max', 'Galaxy', 'Tourneo', 'Transit', 'Ranger', 'Mustang Mach-E',
  ],
  Skoda: [
    'Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Citigo', 'Rapid',
  ],
  Opel: [
    'Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Zafira', 'Vivaro',
  ],
  Toyota: [
    'Aygo', 'Aygo X', 'Yaris', 'Yaris Cross', 'Corolla', 'Camry', 'Prius', 'C-HR', 'RAV4',
    'Highlander', 'Land Cruiser', 'Hilux', 'Proace', 'bZ4X', 'Supra',
  ],
  Volvo: ['C40', 'XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'V90', 'EX30', 'EX90'],
  Renault: [
    'Twingo', 'Clio', 'Captur', 'Megane', 'Austral', 'Arkana', 'Scenic', 'Espace', 'Kadjar',
    'Koleos', 'Zoe', 'Megane E-Tech', 'Trafic', 'Master', 'Kangoo',
  ],
  Peugeot: [
    '108', '208', '308', '408', '508', '2008', '3008', '5008', 'Rifter', 'Traveller', 'Partner', 'e-208', 'e-2008',
  ],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  Hyundai: [
    'i10', 'i20', 'i30', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Tucson', 'Santa Fe', 'Bayon', 'Staria',
  ],
  Kia: [
    'Picanto', 'Rio', 'Ceed', 'Proceed', 'XCeed', 'Sportage', 'Sorento', 'Niro', 'EV6', 'EV9', 'Stonic', 'Soul',
  ],
  Citroen: [
    'C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'SpaceTourer', 'Ami', 'e-C4',
  ],
  Fiat: ['500', '500e', '500X', '500L', 'Panda', 'Tipo', 'Doblo', 'Ducato', 'Punto'],
  Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Mii', 'Alhambra'],
  Cupra: ['Formentor', 'Leon', 'Ateca', 'Born', 'Tavascan', 'Terramar'],
  Mini: ['Cooper', 'Cooper S', 'Countryman', 'Clubman', 'Paceman', 'Cabrio', 'John Cooper Works'],
  'Land Rover': [
    'Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport',
    'Range Rover Evoque', 'Range Rover Velar',
  ],
  Jaguar: ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type'],
  Mazda: ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-80', 'MX-5', 'MX-30'],
  Honda: ['Civic', 'Jazz', 'CR-V', 'HR-V', 'e', 'e:Ny1', 'ZR-V', 'Accord'],
  Nissan: [
    'Micra', 'Leaf', 'Juke', 'Qashqai', 'X-Trail', 'Ariya', 'Townstar', 'Navara', 'Note', 'Pulsar',
  ],
  Mitsubishi: ['ASX', 'Outlander', 'Eclipse Cross', 'Space Star', 'L200', 'Colt'],
  Suzuki: ['Swift', 'Ignis', 'Jimny', 'Vitara', 'S-Cross', 'Across', 'Swace'],
  Dacia: ['Sandero', 'Logan', 'Duster', 'Jogger', 'Spring', 'Bigster'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale', 'Giulietta', 'MiTo', 'Junior'],
  Jeep: ['Renegade', 'Compass', 'Wrangler', 'Avenger', 'Grand Cherokee', 'Cherokee', 'Gladiator'],
  Lexus: ['UX', 'NX', 'RX', 'RZ', 'IS', 'ES', 'LS', 'LC', 'LBX'],
  Subaru: ['Impreza', 'XV', 'Forester', 'Outback', 'Solterra', 'BRZ', 'Levorg'],
  Chevrolet: ['Spark', 'Cruze', 'Captiva', 'Camaro', 'Corvette', 'Trax', 'Tahoeoe', 'Silverado'],
  Smart: ['Fortwo', 'Forfour', '#1', '#3'],
  DS: ['DS 3', 'DS 4', 'DS 7', 'DS 9'],
  MG: ['MG3', 'MG4', 'MG5', 'ZS', 'HS', 'Marvel R', 'Cyberster'],
  Polestar: ['2', '3', '4'],
  BYD: ['Atto 3', 'Seal', 'Seal U', 'Dolphin', 'Han', 'Tang'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Hornet'],
  Infiniti: ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'],
  Genesis: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  Bentley: ['Continental', 'Bentayga', 'Flying Spur'],
  'Aston Martin': ['DB11', 'DB12', 'Vantage', 'DBX', 'DBS'],
  Ferrari: ['Roma', 'F8', 'SF90', '296', 'Portofino', 'Purosangue', '812'],
  Lamborghini: ['Huracan', 'Urus', 'Revuelto', 'Temerario'],
  Maserati: ['Ghibli', 'Quattroporte', 'Levante', 'Grecale', 'MC20', 'GranTurismo'],
  'Rolls-Royce': ['Ghost', 'Phantom', 'Cullinan', 'Spectre'],
  Abarth: ['595', '695', '124 Spider', '500e'],
  Lancia: ['Ypsilon'],
  Saab: ['9-3', '9-5'],
  Cadillac: ['CT4', 'CT5', 'Escalade', 'XT4', 'XT5', 'XT6', 'Lyriq'],
  Isuzu: ['D-Max'],
  SsangYong: ['Tivoli', 'Korando', 'Rexton', 'Musso'],
  Iveco: ['Daily', 'Eurocargo'],
  MAN: ['TGX', 'TGS', 'TGM', 'TGL'],
  Scania: ['R-Series', 'S-Series', 'G-Series'],
  'Mercedes-AMG': ['A 35', 'A 45', 'C 63', 'E 63', 'GT', 'GLE 63'],
};

/** NHTSA make query aliases when the marketplace name differs. */
export const NHTSA_MAKE_ALIASES: Record<string, string> = {
  'Mercedes-Benz': 'mercedes',
  'Land Rover': 'land rover',
  'Alfa Romeo': 'alfa romeo',
  'Aston Martin': 'aston martin',
  'Rolls-Royce': 'rolls royce',
  Skoda: 'skoda',
  Citroen: 'citroen',
  Seat: 'seat',
  Cupra: 'cupra',
  Dacia: 'dacia',
  Opel: 'opel',
  Peugeot: 'peugeot',
  Renault: 'renault',
  Smart: 'smart',
  /** Prefer catalog — short "ds" matches too many unrelated NHTSA makes. */
  DS: '__catalog_only__',
  MG: 'mg',
  Polestar: 'polestar',
  BYD: 'byd',
  SsangYong: 'ssangyong',
  Mini: 'mini',
  Volkswagen: 'volkswagen',
};
