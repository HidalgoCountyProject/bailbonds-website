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