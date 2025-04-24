import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'en' | 'es';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    // Check if language preference is stored in localStorage
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('preferredLanguage') as Language;
      if (storedLang && (storedLang === 'en' || storedLang === 'es')) {
        this.currentLanguageSubject.next(storedLang);
      } else {
        // Auto-detect browser language if no preference is stored
        this.detectBrowserLanguage();
      }
    }
  }

  private detectBrowserLanguage(): void {
    if (typeof window !== 'undefined' && window.navigator) {
      // Get browser language (e.g., 'en-US', 'es-MX', etc.)
      const browserLang = window.navigator.language || (window.navigator as any).userLanguage;
      
      // Check if it starts with 'es' for Spanish
      if (browserLang && browserLang.toLowerCase().startsWith('es')) {
        this.setLanguage('es');
      } else {
        // Default to English for all other languages
        this.setLanguage('en');
      }
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(lang: Language): void {
    this.currentLanguageSubject.next(lang);
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang);
    }
  }

  toggleLanguage(): void {
    const current = this.getCurrentLanguage();
    const newLang: Language = current === 'en' ? 'es' : 'en';
    this.setLanguage(newLang);
  }
} 