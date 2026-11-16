import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-modal.component.html',
  styleUrls: ['./loading-modal.component.css']
})
export class LoadingModalComponent {
  /** Controls whether the modal is visible */
  @Input() show = false;

  /** Language coming from parent (defaults to English) */
  @Input() lang: 'en' | 'es' = 'en';

  private readonly i18n: Record<'en' | 'es', string> = {
    en: 'Loading…',
    es: 'Cargando…'
  };

  /** Returns the translated loading text */
  get loadingText(): string {
    return this.i18n[this.lang] || this.i18n.en;
  }
} 