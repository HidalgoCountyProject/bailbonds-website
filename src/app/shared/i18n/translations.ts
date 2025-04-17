import { Language } from '../services/language.service';

export interface TranslationSet {
  [key: string]: string;
}

export const translations: Record<Language, TranslationSet> = {
  en: {
    // Header
    'language_toggle': 'Español',
    'home': 'Home',
    'services': 'Services',
    'location': 'Location',
    'testimonials': 'Testimonials',
    'faq': 'FAQ',
    'contact': 'Contact Us',
    'call_now': 'Call Now - 24/7',
    'payments': 'Payments',
    'missed_court': 'Missed Court',
    'careers': 'Careers',
    'blog': 'Blog',
  },
  es: {
    // Header
    'language_toggle': 'English',
    'home': 'Inicio',
    'services': 'Servicios',
    'location': 'Ubicación',
    'testimonials': 'Testimonios',
    'faq': 'Preguntas Frecuentes',
    'contact': 'Contáctenos',
    'call_now': 'Llame ahora - 24/7',
    'payments': 'Pagos',
    'missed_court': 'Corte Perdida',
    'careers': 'Carreras',
    'blog': 'Blog',
  }
}; 