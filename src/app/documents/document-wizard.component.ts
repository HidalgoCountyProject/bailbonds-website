import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  templateUrl: './document-wizard.component.html',
  styleUrls: ['./document-wizard.component.css']
})
export class DocumentWizardComponent implements OnInit, OnDestroy {
  pdfSrc = 'assets/pdfs/indemnitor/indemnitor-application-and-agreement-en.pdf';
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  originalHeaderHeight: string | null = null;
  
  // Zoom limits for mobile optimization
  minZoom = 0.5;  // 50% - minimum zoom (can't zoom out beyond initial fit)
  maxZoom = 3.0;  // 300% - maximum zoom (reasonable limit for mobile)
  currentZoom = 1.0;
  initialScale = 1.0;

  constructor(private router: Router) {
    // Configure PDF.js paths for S3 deployment
    this.configurePdfPaths();
  }

  private configurePdfPaths(): void {
    // Set correct paths for S3 deployment
    pdfDefaultOptions.assetsFolder = 'assets';
    pdfDefaultOptions.workerSrc = () => 'assets/pdf.worker-4.10.728.min.mjs';
    pdfDefaultOptions.sandboxBundleSrc = () => 'assets/pdf.sandbox-4.10.728.min.mjs';
  }

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

  close() {
    this.router.navigateByUrl('/');
  }

  downloadPdf() {
    // The ngx-extended-pdf-viewer will handle the download
    const downloadLink = document.createElement('a');
    downloadLink.href = this.pdfSrc;
    downloadLink.download = 'indemnitor-application-form.pdf';
    downloadLink.click();
  }

  onPdfLoaded(pdf: any) {
    // Set initial zoom limits when PDF loads
    setTimeout(() => {
      this.setupZoomLimits();
    }, 1000);
  }

  onZoomChange(zoom: string | number) {
    this.currentZoom = typeof zoom === 'string' ? parseFloat(zoom) : zoom;
    // Throttle zoom limit enforcement to avoid performance issues
    setTimeout(() => {
      this.enforceZoomLimits();
    }, 100);
  }

  private setupZoomLimits() {
    if (this.isBrowser && typeof window !== 'undefined') {
      const viewer = (window as any).PDFViewerApplication;
      if (viewer && viewer.pdfViewer) {
        // Store initial scale as baseline for zoom out limit
        this.initialScale = viewer.pdfViewer.currentScale;
        this.minZoom = Math.max(0.5, this.initialScale * 0.7); // Allow 30% zoom out from initial
        
        // Set mobile-specific limits
        if (window.innerWidth <= 768) {
          this.maxZoom = 2.5; // Limit max zoom on mobile for better performance
        }
        
        this.enforceZoomLimits();
      }
    }
  }

  private enforceZoomLimits() {
    if (this.isBrowser && typeof window !== 'undefined') {
      const viewer = (window as any).PDFViewerApplication;
      if (viewer && viewer.pdfViewer) {
        const currentScale = viewer.pdfViewer.currentScale;
        
        // Enforce minimum zoom (can't zoom out too much from initial fit)
        if (currentScale < this.minZoom) {
          viewer.pdfViewer.currentScale = this.minZoom;
        }
        
        // Enforce maximum zoom (can't zoom in too much)
        if (currentScale > this.maxZoom) {
          viewer.pdfViewer.currentScale = this.maxZoom;
        }
      }
    }
  }
}
