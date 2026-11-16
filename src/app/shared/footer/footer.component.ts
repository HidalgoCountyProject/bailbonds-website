import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../services/language.service';
import { TranslationSet, translations } from '../i18n/translations';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {
  currentYear: number = 0;
  translations: TranslationSet = {};

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.currentYear = new Date().getFullYear();
    this.languageService.currentLanguage$.subscribe(language => {
      this.translations = translations[language];
    });
  }
}
