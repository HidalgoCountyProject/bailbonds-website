import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { SignatureModalComponent } from '../shared/signature-modal/signature-modal.component';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts } from 'pdf-lib';

@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule, SignatureModalComponent, ReactiveFormsModule],
  templateUrl: './document-wizard.component.html',
  styleUrls: ['./document-wizard.component.css']
})
export class DocumentWizardComponent implements OnInit, OnDestroy {
  pdfSrc = '';
  docs: string[] = [];
  currentIndex = 0;
  role: 'defendant' | 'indemnitor' = 'indemnitor';
  lang: 'en' | 'es' = 'en';
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  originalHeaderHeight: string | null = null;
  originalFooterDisplay: string | null = null;
  
  // Added missing properties for compile-time safety
  inIdPhotoStep = false;                        // Tracks whether the wizard is currently showing the ID-photo step
  currentForm!: FormGroup;                      // Reactive form used in the ID-photo step (initialised in ngOnInit)
  idPhotoQuestion: string = 'idPhoto';          // Identifier used when persisting the ID-photo answer
  
  // Hold captured signature (PNG Data URL)
  capturedSignature?: string;

  /** Holds temporarily the field values extracted from the viewer */
  private currentFieldValues: Record<string, any> = {};

  /** Controls white overlay to smooth PDF reloads */
  isLoading = false;

  /** Holds the original PDF bytes so we can modify them after a signature is captured */
  private originalPdfBytes?: Uint8Array;

  minZoom = .495;
  // Minimum zoom scale (set to page-fit after PDF loads)

  @ViewChild('signatureModal') signatureModal?: SignatureModalComponent;

  private originalViewportContent: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private meta: Meta
  ) {
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
    // Persist the current viewport meta so we can restore it later
    const viewportTag = this.meta.getTag('name="viewport"');
    this.originalViewportContent = viewportTag?.content ?? null;
    // Disable browser zoom for the whole page while the wizard is active
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' });

    // Determine role and language from route params
    const paramRole = this.route.snapshot.paramMap.get('role');
    const paramLang = this.route.snapshot.paramMap.get('lang');
    this.role = (paramRole === 'defendant' ? 'defendant' : 'indemnitor');
    this.lang = (paramLang === 'es' ? 'es' : 'en');
    this.initializeDocs();

    if (this.isBrowser) {
      // Hide global header
      const headerEl = document.querySelector('header.header') as HTMLElement | null;
      if (headerEl) {
        headerEl.style.display = 'none';
      }

      // Store and override CSS variable so <main> loses top padding
      this.originalHeaderHeight = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
      document.documentElement.style.setProperty('--header-height', '0px');

      // Hide global footer
      const footerEl = document.querySelector('footer.footer') as HTMLElement | null;
      if (footerEl) {
        this.originalFooterDisplay = footerEl.style.display;
        footerEl.style.display = 'none';
      }
    }

    // Initialise reactive form for ID photo step
    this.currentForm = this.fb.group({
      idPhoto: this.fb.control({ front: null, back: null }, [Validators.required, this.requireBothSides])
    });
  }

  private initializeDocs() {
    // Static manifests (English and Spanish)
    const DEFENDANT_DOCS_EN = [
      'assets/pdfs/defendant/defendant-application-and-agreement-en.pdf',
      'assets/pdfs/defendant/texas-addendum-en.pdf'
    ];
    const DEFENDANT_DOCS_ES = [
      'assets/pdfs/defendant/defendant-application-and-agreement-es.pdf',
      'assets/pdfs/defendant/texas-addendum-es.pdf'
    ];

    const INDEMNITOR_DOCS_EN = [
      'assets/pdfs/indemnitor/indemnitor-application-and-agreement-en.pdf',
      'assets/pdfs/indemnitor/plain-talk-contract-en.pdf',
      'assets/pdfs/indemnitor/rules-and-regulations-en.pdf',
      'assets/pdfs/indemnitor/supreme-court-opinion-en.pdf'
    ];
    const INDEMNITOR_DOCS_ES = [
      'assets/pdfs/indemnitor/indemnitor-application-and-agreement-es.pdf',
      'assets/pdfs/indemnitor/plain-talk-contract-es.pdf',
      'assets/pdfs/indemnitor/rules-and-regulations-es.pdf',
      'assets/pdfs/indemnitor/supreme-court-opinion-es.pdf'
    ];

    if (this.role === 'defendant') {
      this.docs = this.lang === 'es' ? DEFENDANT_DOCS_ES : DEFENDANT_DOCS_EN;
    } else {
      this.docs = this.lang === 'es' ? INDEMNITOR_DOCS_ES : INDEMNITOR_DOCS_EN;
    }
    this.currentIndex = 0;
    this.updatePdfSrc();
  }

  private updatePdfSrc() {
    this.pdfSrc = this.docs[this.currentIndex];
  }

  get isFirstDoc() {
    return this.currentIndex === 0;
  }

  get isLastDoc() {
    return this.currentIndex === this.docs.length - 1;
  }

  prevDoc() {
    if (this.inIdPhotoStep) {
      // Going back from ID-photo step returns to the last PDF viewed
      this.inIdPhotoStep = false;
      // currentIndex already points to last document, simply refresh src
      this.updatePdfSrc();
      return;
    }

    if (!this.isFirstDoc) {
      this.currentIndex -= 1;
      this.updatePdfSrc();
    }
  }

  nextDoc() {
    if (this.inIdPhotoStep) {
      return; // No-op while in photo step
    }
    if (!this.isLastDoc) {
      this.currentIndex += 1;
      this.updatePdfSrc();
    } else {
      // Reached last PDF – switch to ID photo step
      this.inIdPhotoStep = true;
    }
  }

  completeWizard() {
    window.alert('La información del formulario fue guardada exitosamente');
    this.router.navigateByUrl('/wizard');
  }

  ngOnDestroy(): void {
    // Restore original viewport settings
    if (this.originalViewportContent !== null) {
      this.meta.updateTag({ name: 'viewport', content: this.originalViewportContent });
    } else {
      // If there was no viewport tag originally, remove the one we added
      this.meta.removeTag('name="viewport"');
    }

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

      // Restore global footer
      const footerEl = document.querySelector('footer.footer') as HTMLElement | null;
      if (footerEl) {
        footerEl.style.display = this.originalFooterDisplay ?? '';
      }
    }
  }

  close() {
    // Consistent with document steps: return to documents route
    this.router.navigateByUrl('/documents');
  }

  downloadPdf() {
    // The ngx-extended-pdf-viewer will handle the download
    const downloadLink = document.createElement('a');
    downloadLink.href = this.pdfSrc;
    const filename = this.pdfSrc.split('/').pop() || 'document.pdf';
    downloadLink.download = filename;
    downloadLink.click();
  }

  /*onPdfLoaded(pdf: any) {
    // Capture the scale used by 'page-fit' after render settles (give 300 ms)
    console.log('onPdfLoaded');
    console.log(this.isBrowser);
    if (this.isBrowser) {
      setTimeout(() => {
        const viewer = (window as any).PDFViewerApplication;
        if (viewer && viewer.pdfViewer) {
          const fitScale = viewer.pdfViewer.currentScale || 1;
          console.log('fitScale', fitScale);
          // Apply a small tolerance so user can return smoothly to fit
          //this.minZoom = fitScale * 0.98;
          console.log('minZoom', this.minZoom);
        }
      }, 1000);
    }

    // Fade overlay out shortly after pages are rendered
    setTimeout(() => {
      this.isLoading = false;
    }, 300);
  }*/

  /* ---------------------------------------------------------------------- */
  /* Signature modal helpers                                                */
  /* ---------------------------------------------------------------------- */

  openSignature() {
    if (this.inIdPhotoStep) { return; } // Disable signature during photo step
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

      // Hide loading overlay after the viewer has had a moment to refresh
      setTimeout(() => (this.isLoading = false), 300);
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

  /* ---------------------------------------------------------------------- */
  /* ID-photo helpers                                                       */
  /* ---------------------------------------------------------------------- */

  /** Validator that requires both front & back images to be present */
  private requireBothSides(control: AbstractControl): ValidationErrors | null {
    const val: any = control.value || {};
    return val.front && val.back ? null : { required: true };
  }

  /** Handles file selection for either side of the ID photo */
  onPhotoSelected(event: Event, side: 'front' | 'back', questionId: string): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) { return; }

    const control = this.currentForm.get(questionId);
    if (!control) { return; }

    // Read the image as data-URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64  = dataUrl.split(',')[1] || '';

      const prev = { ...(control.value ?? {}) } as any;
      prev[side]             = file;     // original File object
      prev[`${side}Preview`] = dataUrl;  // for <img [src]="">
      prev[`${side}Base64`]  = base64;   // for API payload
      control.setValue(prev);
      control.markAsTouched();
      control.updateValueAndValidity();
    };
    reader.readAsDataURL(file);
  }

  /** Resets one side of the ID photo */
  resetPhoto(side: 'front' | 'back', questionId: string): void {
    const control = this.currentForm.get(questionId);
    if (!control) { return; }

    const prev = { ...(control.value ?? {}) } as any;
    prev[side]             = null;
    prev[`${side}Preview`] = null;
    prev[`${side}Base64`]  = null;
    control.setValue(prev);
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  /** Persists the ID photo answer and completes the wizard */
  saveIdPhoto() {
    if (this.currentForm.invalid) { return; }
    const value = this.currentForm.value.idPhoto;
    this.saveAnswer('id-photo-section', this.idPhotoQuestion, value);

    window.alert('La información del formulario fue guardada exitosamente');
    this.router.navigateByUrl('/wizard');
  }

  /** Mock implementation that logs the payload – replace with real API call */
  private saveAnswer(sectionId: string, question: any, value: any): void {
    const payload = {
      answer_value: {
        type: 'photo',
        front: value.frontBase64 ?? '',
        back:  value.backBase64  ?? ''
      },
      section_id: sectionId
    };
    console.log('💾 Saving answer (payload)', payload);
    // TODO: Integrate with backend API service here
  }

  /* Convenience getter */
  get idPhotoControl() {
    return this.currentForm.get('idPhoto');
  }
}
