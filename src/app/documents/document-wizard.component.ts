import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { SignatureModalComponent } from '../shared/signature-modal/signature-modal.component';
import { PDFDocument } from 'pdf-lib';

@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule, SignatureModalComponent],
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

  // Hold captured signature (PNG Data URL)
  capturedSignature?: string;

  /** Controls white overlay to smooth PDF reloads */
  isLoading = false;

  /** Holds the original PDF bytes so we can modify them after a signature is captured */
  private originalPdfBytes?: Uint8Array;

  @ViewChild('signatureModal') signatureModal?: SignatureModalComponent;

  constructor(private router: Router) {
    // Configure PDF.js paths for S3 deployment
    this.configurePdfPaths();
  }

  private configurePdfPaths(): void {
    // Set correct paths for S3 deployment
    // Use absolute paths (leading slash) so they resolve when the viewer is running from a blob: URL
    pdfDefaultOptions.assetsFolder = '/assets';
    pdfDefaultOptions.workerSrc = () => '/assets/pdf.worker-4.10.728.min.mjs';
    pdfDefaultOptions.sandboxBundleSrc = () => '/assets/pdf.sandbox-4.10.728.min.mjs';
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

    // Fade overlay out shortly after pages are rendered
    setTimeout(() => {
      this.isLoading = false;
    }, 300);
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

  /* ---------------------------------------------------------------------- */
  /* Signature modal helpers                                                */
  /* ---------------------------------------------------------------------- */

  openSignature() {
    this.signatureModal?.open();
  }

  onSignatureSaved(dataUrl: string) {
    this.capturedSignature = dataUrl;
    // Later you can embed this into the PDF or preview it
    console.log('Signature captured', dataUrl.substring(0, 50) + '...');

    // Show overlay
    this.isLoading = true;

    // Final hard-coded placement (page 4)
    const target = {
      page: 4,
      x: 300, // move further right (PDF points)
      y: 122,
      width: 120,
      height: 48,
    };

    this.injectSignatureIntoPdf(dataUrl, target).catch((err) =>
      console.error('Failed to inject signature', err)
    );
  }

  /**
   * Embeds the given base64 PNG into the provided page & bounding box and reloads the viewer.
   */
  private async injectSignatureIntoPdf(
    dataUrl: string,
    options: { page: number; x: number; y: number; width: number; height: number }
  ): Promise<void> {
    try {
      // 1) Load PDF
      const existingPdfBytes = await this.ensureOriginalPdfBytes();
      const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });

      // 2) Embed signature image
      const pngBytes = this.base64ToUint8Array(dataUrl);
      const pngImage = await pdfDoc.embedPng(pngBytes);

      // 3) Draw image at the requested position/size
      const page = pdfDoc.getPage(options.page - 1); // zero-based index
      const pageHeight = page.getHeight();

      // PDFLib uses bottom-left origin. Caller provides y from bottom, so we can use it directly.
      // If you prefer supplying y from top-left (like screen coords), convert: y = pageHeight - topY - height
      page.drawImage(pngImage, {
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
      });

      // 4) Save the document
      const modifiedBytes = await pdfDoc.save();

      // 5) Reload viewer with the updated PDF
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);

      // Revoke old object URL if we generated one previously
      if (this.pdfSrc.startsWith('blob:')) {
        URL.revokeObjectURL(this.pdfSrc);
      }

      this.pdfSrc = objectUrl;
      // Force ngx-extended-pdf-viewer to reload
      this.originalPdfBytes = modifiedBytes;

      this.logDebug('Injecting signature', { options, pageHeight });
    } catch (error) {
      console.error('Error while inserting signature into PDF', error);
    }
  }

  /** Converts a Data URL (base64 PNG) to Uint8Array */
  private base64ToUint8Array(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Downloads the current pdfSrc (either the remote URL or the previously generated object URL)
   * and keeps the bytes in memory so we can re-save the document later.
   */
  private async ensureOriginalPdfBytes(): Promise<Uint8Array> {
    if (this.originalPdfBytes) {
      return this.originalPdfBytes;
    }

    const response = await fetch(this.pdfSrc);
    const arrayBuffer = await response.arrayBuffer();
    this.originalPdfBytes = new Uint8Array(arrayBuffer);
    return this.originalPdfBytes;
  }

  /** Verbose logging helper */
  private logDebug(message: string, data?: any) {
    // eslint-disable-next-line no-console
    console.log('[SignatureDebug] ' + message, data ?? '');
  }
}
