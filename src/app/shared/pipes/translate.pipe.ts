import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { translations } from '../i18n/translations';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Mark as impure to update when language changes
})
export class TranslatePipe implements PipeTransform {
  constructor(private languageService: LanguageService) {}

  transform(key: string): string {
    const lang = this.languageService.getCurrentLanguage();
    return translations[lang][key] || key; // Fallback to key if translation not found
  }
} 