import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PdfViewerComponent } from './components/pdf-viewer.component';

@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [CommonModule, PdfViewerComponent],
  templateUrl: './document-wizard.component.html',
  styleUrls: ['./document-wizard.component.css']
})
export class DocumentWizardComponent implements OnInit, OnDestroy {
  pdfSrc = 'assets/pdfs/defendant/defendant-application-and-agreement-en.pdf';
  currentPage = 1;
  totalPages = 1;
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  originalHeaderHeight: string | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (this.isBrowser) {
      // Hide global header
      const headerEl = document.querySelector('header.header') as HTMLElement | null;
      if (headerEl) {
        headerEl.style.display = 'none';
      }

      // Store and override CSS variable so <main> loses top padding
      this.originalHeaderHeight = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
      document.documentElement.style.setProperty('--header-height', '0px');
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      // Restore global header
      const headerEl = document.querySelector('header.header') as HTMLElement | null;
      if (headerEl) {
        headerEl.style.display = '';
      }

      // Restore original CSS var
      if (this.originalHeaderHeight) {
        document.documentElement.style.setProperty('--header-height', this.originalHeaderHeight);
      }
    }
  }

  onPageUpdate(ev: { current: number; total: number }) {
    this.currentPage = ev.current;
    this.totalPages = ev.total;
  }

  close() {
    this.router.navigateByUrl('/');
  }
}
