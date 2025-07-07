import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './role-selection.component.html',
  styleUrls: ['./role-selection.component.css']
})
export class RoleSelectionComponent implements OnInit, OnDestroy {
  step: 'role' | 'language' = 'role';
  selectedRole?: 'defendant' | 'indemnitor';

  // Detect browser environment (in case of SSR)
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  private originalFooterDisplay: string | null = null;

  constructor(private router: Router) {}

  onRoleSelect(role: 'defendant' | 'indemnitor') {
    this.selectedRole = role;
    this.step = 'language';
  }

  onLanguageSelect(lang: 'en' | 'es') {
    if (this.selectedRole) {
      // List all possible roles here
      const roles = ['defendant', 'indemnitor'];
      const roleKey = `${this.selectedRole}_field_values`;
      let foundRoleKey = null;
      // Check if any role key exists in localStorage
      for (const role of roles) {
        if (localStorage.getItem(`${role}_field_values`)) {
          foundRoleKey = `${role}_field_values`;
          break;
        }
      }
      // If the stored role is different from the selected role, clear all role-related data
      if (foundRoleKey && foundRoleKey !== roleKey) {
        for (const role of roles) {
          localStorage.removeItem(`${role}_field_values`);
          localStorage.removeItem(`${role}_signature`);
        }
      }
      this.router.navigate(['/wizard', this.selectedRole, lang]);
    }
  }

  backToRole() {
    this.step = 'role';
    this.selectedRole = undefined;
  }

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