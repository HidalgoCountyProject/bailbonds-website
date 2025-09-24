import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-language-gate',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './language-gate.component.html',
  styleUrls: ['./language-gate.component.css']
})
export class LanguageGateComponent {
  role: 'defendant' | 'indemnitor' | undefined;
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  constructor(private router: Router, private route: ActivatedRoute) {
    const paramRole = (this.route.snapshot.paramMap.get('role') || '') as
      | 'defendant'
      | 'indemnitor'
      | '';
    this.role = paramRole === 'defendant' || paramRole === 'indemnitor' ? paramRole : undefined;
  }

  close() {
    this.router.navigate(['/wizard']);
  }

  choose(lang: 'en' | 'es') {
    if (!this.role) {
      this.router.navigate(['/wizard']);
      return;
    }

    if (this.isBrowser) {
      const roles = ['defendant', 'indemnitor'];
      const roleKey = `${this.role}_field_values`;
      let foundRoleKey: string | null = null;
      for (const r of roles) {
        if (localStorage.getItem(`${r}_field_values`)) {
          foundRoleKey = `${r}_field_values`;
          break;
        }
      }
      if (foundRoleKey && foundRoleKey !== roleKey) {
        for (const r of roles) {
          localStorage.removeItem(`${r}_field_values`);
          localStorage.removeItem(`${r}_signature`);
        }
      }
    }

    // Preserve prior behavior: indemnitor -> defendant-info, defendant -> documents
    if (this.role === 'indemnitor') {
      this.router.navigate(['/wizard/indemnitor', lang, 'defendant-info']);
    } else {
      this.router.navigate(['/wizard', this.role, lang]);
    }
  }
}


