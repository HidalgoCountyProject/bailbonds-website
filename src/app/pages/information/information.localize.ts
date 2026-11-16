import { Language } from '../../shared/services/language.service';

const STAFF_ROLE_ES: Record<string, string> = {
  'County Clerk': 'Secretario del condado (County Clerk)',
  'District Clerk': 'Secretario distrital (District Clerk)',
  'Judge': 'Juez (Judge)',
  'Judge Court of Law': 'Juez de corte de lo civil (Judge Court of Law)',
  'Judge Court at Law': 'Juez de corte de lo civil (Judge Court at Law)',
  'Probate Judge': 'Jueza de sucesiones (Probate Judge)',
  'Court Coordinator': 'Coordinador de la corte (Court Coordinator)',
  'Assistant Court Coordinator': 'Coordinador asistente de la corte (Assistant Court Coordinator)',
  'Court Reporter': 'Reportero judicial (Court Reporter)',
  'Bailiff': 'Alguacil (Bailiff)'
};

const FLOOR_ES: Record<string, string> = {
  '1st Floor': '1.er piso (1st Floor)',
  '2nd Floor': '2.º piso (2nd Floor)',
  '3rd Floor': '3.er piso (3rd Floor)',
  '4th Floor': '4.º piso (4th Floor)',
  '5th Floor': '5.º piso (5th Floor)',
  'Not listed': 'No indicado en el directorio',
  'Room 3A-100': 'Room 3A-100'
};

const VISIT_LOCATION_ES: Record<string, string> = {
  'Main Lobby': 'Vestíbulo principal (Main Lobby)'
};

const VISIT_ITEM_ES: Record<string, string> = {
  'Protective Custody Inmates': 'Detenidos en custodia protectora (Protective Custody Inmates)',
  'Infirmary Females Only': 'Enfermería — solo mujeres (Infirmary Females Only)',
  'Infirmary Males': 'Enfermería — hombres (Infirmary Males)',
  'Bravo General Population': 'Bravo población general (Bravo General Population)',
  'Charlie General Population': 'Charlie población general (Charlie General Population)',
  'Gulf Section': 'Sección Gulf (Gulf Section)',
  'Foxtrot Section': 'Sección Foxtrot (Foxtrot Section)',
  'Delta Section': 'Sección Delta (Delta Section)',
  'Echo (Non P/C or Disciplinary)': 'Echo (no P/C o disciplina) (Echo (Non P/C or Disciplinary))',
  'Gulf Section; Charlie 13 thru 30 (Ex-Gang/Sex Off Only); Hotel 2 (Ex-Gang Only)':
    'Sección Gulf; Charlie 13 thru 30 (solo ex pandillas/delitos sexuales); Hotel 2 (solo ex pandillas) ' +
    '(Gulf Section; Charlie 13 thru 30 (Ex-Gang/Sex Off Only); Hotel 2 (Ex-Gang Only))'
};

const DAY_KEYS = [
  'info.day.monday',
  'info.day.tuesday',
  'info.day.wednesday',
  'info.day.thursday',
  'info.day.friday',
  'info.day.saturday',
  'info.day.sunday'
] as const;

export function localizeStaffRole(lang: Language, role: string): string {
  if (lang === 'en' || !role) return role;
  return STAFF_ROLE_ES[role] ?? role;
}

export function localizeFloor(lang: Language, floor: string): string {
  if (lang === 'en') return floor;
  return FLOOR_ES[floor] ?? floor;
}

export function localizeVisitLocation(lang: Language, location: string): string {
  if (lang === 'en') return location;
  return VISIT_LOCATION_ES[location] ?? location;
}

export function localizeVisitLocationHeading(lang: Language, location: string): string {
  if (lang === 'en') return `${location} Visitation`;
  return `${localizeVisitLocation(lang, location)} — Visitación`;
}

export function localizeVisitItem(lang: Language, item: string): string {
  if (lang === 'en') return item;
  return VISIT_ITEM_ES[item] ?? item;
}

export function localizeOfficeHours(lang: Language, hours: string): string {
  if (lang === 'en' || !hours) return hours;
  return hours
    .replace(/Monday–Friday/g, 'Lunes–viernes')
    .replace(/Monday-Friday/g, 'Lunes–viernes');
}

export function dayTranslationKeys(): readonly string[] {
  return DAY_KEYS;
}