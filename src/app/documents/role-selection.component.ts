import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './role-selection.component.html',
  styleUrls: ['./role-selection.component.css']
})
export class RoleSelectionComponent implements OnInit, OnDestroy {

  // Detect browser environment (in case of SSR)
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  private originalFooterDisplay: string | null = null;

  constructor() {}

  /* ------------------------------------------------------------------ */
  /* Hide global footer while this component is active                   */
  /* ------------------------------------------------------------------ */

  ngOnInit(): void {
    if (this.isBrowser) {
      const footerEl = document.querySelector('footer.footer') as HTMLElement | null;
      if (footerEl) {
        this.originalFooterDisplay = footerEl.style.display;
        footerEl.style.display = 'none';
      }
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      const footerEl = document.querySelector('footer.footer') as HTMLElement | null;
      if (footerEl) {
        footerEl.style.display = this.originalFooterDisplay ?? '';
      }
    }
  }
} 