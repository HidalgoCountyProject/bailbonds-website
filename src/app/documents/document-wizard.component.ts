import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { SignatureModalComponent } from '../shared/signature-modal/signature-modal.component';
import { PDFDocument, StandardFonts } from 'pdf-lib';

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

  /** Holds temporarily the field values extracted from the viewer */
  private currentFieldValues: Record<string, any> = {};

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

    // 1) Capture the current values the user has entered before we reload the PDF
    if (this.isBrowser) {
      this.currentFieldValues = this.captureCurrentFieldValues();
      // Show the captured JSON in the dev console so we can verify the output
      console.log('[DocumentWizard] Extracted field values', this.currentFieldValues);
    }

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

    this.injectSignatureIntoPdf(dataUrl, target, this.currentFieldValues).catch((err) =>
      console.error('Failed to inject signature', err)
    );
  }

  /**
   * Traverses the PDF viewer DOM and extracts the name/value pairs of every visible form field.
   * Supports <input>, <textarea>, <select>, checkboxes and radio buttons.
   */
  private captureCurrentFieldValues(): Record<string, any> {
    const values: Record<string, any> = {};
    const selector =
      '.textWidgetAnnotation input, .textWidgetAnnotation textarea, ' +
      '.choiceWidgetAnnotation select, .buttonWidgetAnnotation input';

    document.querySelectorAll(selector).forEach((el) => {
      // The PDF.js viewer puts the AcroForm field name into the "name" attribute
      const fieldName = (el as HTMLInputElement).name || '';
      if (!fieldName) {
        return; // skip unnamed nodes
      }

      // Handle by element type
      if (el instanceof HTMLInputElement) {
        const input = el as HTMLInputElement;
        if (input.type === 'checkbox' || input.type === 'radio') {
          values[fieldName] = input.checked;
        } else {
          values[fieldName] = input.value;
        }
      } else if (el instanceof HTMLTextAreaElement) {
        values[fieldName] = (el as HTMLTextAreaElement).value;
      } else if (el instanceof HTMLSelectElement) {
        values[fieldName] = (el as HTMLSelectElement).value;
      }
    });

    return values;
  }

  /**
   * Embeds the given base64 PNG into the provided page & bounding box, re-applies form field values,
   * and reloads the viewer.
   */
  private async injectSignatureIntoPdf(
    dataUrl: string,
    options: { page: number; x: number; y: number; width: number; height: number },
    fieldValues: Record<string, any> = {}
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
      page.drawImage(pngImage, {
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
      });

      // 4) Re-apply previously captured field values so they persist in the final PDF
      this.applyFieldValuesToPdf(pdfDoc, fieldValues);

      // 4b) Ensure visual appearance of widgets (esp. checkboxes) is regenerated
      try {
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        pdfDoc.getForm().updateFieldAppearances(helveticaFont);
      } catch (appearanceErr) {
        console.warn('Could not update field appearances', appearanceErr);
      }

      // 5) Save the document
      const modifiedBytes = await pdfDoc.save();

      // 6) Reload viewer with the updated PDF
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);

      // Revoke old object URL if we generated one previously
      if (this.pdfSrc.startsWith('blob:')) {
        URL.revokeObjectURL(this.pdfSrc);
      }

      this.pdfSrc = objectUrl;
      // Force ngx-extended-pdf-viewer to reload
      this.originalPdfBytes = modifiedBytes;

      this.logDebug('Injecting signature & restoring field values', { options, pageHeight, fieldValues });
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

  /** Writes the key/value pairs into the provided PDF using pdf-lib utilities. */
  private applyFieldValuesToPdf(pdfDoc: PDFDocument, fieldValues: Record<string, any>): void {
    try {
      const form = pdfDoc.getForm();

      // Debug: list all field names present in the PDF once per save cycle
      const allPdfFields = form.getFields().map((f: any) => f.getName());
      this.logDebug('PDF contains the following AcroForm fields', allPdfFields);

      Object.entries(fieldValues).forEach(([fieldName, value]) => {
        try {
          let field: any;

          // 1) Try exact name first
          try {
            field = form.getField(fieldName);
          } catch (e) {
            field = undefined;
          }

          // 2) Fallback: try case-insensitive comparison if exact not found
          if (!field) {
            const alt = allPdfFields.find((n) => n.toLowerCase() === fieldName.toLowerCase());
            if (alt) {
              field = form.getField(alt);
            }
          }

          // 3) Fallback: allow hierarchical names (e.g. 'undefined.defendant_first_name')
          if (!field) {
            const altHier = allPdfFields.find((n) => n.toLowerCase().endsWith(`.${fieldName.toLowerCase()}`) || n.toLowerCase().endsWith(fieldName.toLowerCase()));
            if (altHier) {
              field = form.getField(altHier);
            }
          }


          const ctorName = field?.constructor?.name || '';
          console.log('ctorName', ctorName);

          if (!field) {
            this.logDebug(`Field not found in PDF: ${fieldName}`);
            return;
          }

          if (ctorName.includes('PDFTextField')) {
            field.setText(String(value));
          } else if (ctorName.includes('PDFDropdown') || ctorName.includes('PDFOptionList')) {
            field.select(String(value));
          } else if (ctorName.includes('PDFCheckBox')) {
            console.log('field', field);
            value ? field.check() : field.uncheck();
          } else if (ctorName.includes('PDFRadioGroup')) {
            field.select(String(value));
          } else {
            // Fallback – try to call setText on unknown field types
            if (typeof field.setText === 'function') {
              field.setText(String(value));
            }
          }
        } catch (inner) {
          console.warn(`Unable to set value for field ${fieldName}`, inner);
        }
      });
    } catch (err) {
      console.error('Failed to apply field values to PDF', err);
    }
  }

  /** Verbose logging helper */
  private logDebug(message: string, data?: any) {
    // eslint-disable-next-line no-console
    console.log('[SignatureDebug] ' + message, data ?? '');
  }
}
