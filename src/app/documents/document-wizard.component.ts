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

  /** Hard-coded page numbers (1-based) where the signature debe ir for each PDF filename */
  private readonly SIGN_PAGES: Record<string, number> = {
    'assets/pdfs/defendant/defendant-application-and-agreement-en.pdf': 4,
    'assets/pdfs/defendant/texas-addendum-en.pdf': 1,
    'assets/pdfs/defendant/defendant-application-and-agreement-es.pdf': 5,
    'assets/pdfs/defendant/texas-addendum-es.pdf': 1,
    'assets/pdfs/indemnitor/indemnitor-application-and-agreement-en.pdf': 4,
    'assets/pdfs/indemnitor/plain-talk-contract-en.pdf': 1,
    'assets/pdfs/indemnitor/rules-and-regulations-en.pdf': 1,
    'assets/pdfs/indemnitor/supreme-court-opinion-en.pdf': 1,
    'assets/pdfs/indemnitor/indemnitor-application-and-agreement-es.pdf': 5,
    'assets/pdfs/indemnitor/plain-talk-contract-es.pdf': 1,
    'assets/pdfs/indemnitor/rules-and-regulations-es.pdf': 1,
    'assets/pdfs/indemnitor/supreme-court-opinion-es.pdf': 1,
    // TODO: añade los restantes documentos y su página correspondiente
  };


  /** Return the page (1-based) for the currently cargado PDF; default 1 */
  private getSignaturePageForCurrentDoc(): number {
    // Strip query/hash and blob object URLs
    const cleanSrc = this.pdfSrc.startsWith('blob:') ? this.docs[this.currentIndex] : this.pdfSrc.split(/[?#]/)[0];

    // 1) Try full path match (as provided in SIGN_PAGES)
    if (cleanSrc in this.SIGN_PAGES) {
      return this.SIGN_PAGES[cleanSrc];
    }

    // 2) Fallback to filename only
    const fileName = cleanSrc.split('/').pop() ?? '';
    return this.SIGN_PAGES[fileName] ?? 1;
  }

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
      'assets/pdfs/defendant/texas-addendum-en.pdf',
      'assets/pdfs/indemnitor/supreme-court-opinion-en.pdf'
    ];
    const DEFENDANT_DOCS_ES = [
      'assets/pdfs/defendant/defendant-application-and-agreement-es.pdf',
      'assets/pdfs/defendant/texas-addendum-es.pdf',
      'assets/pdfs/indemnitor/supreme-court-opinion-es.pdf'
    ];

    const INDEMNITOR_DOCS_EN = [
      'assets/pdfs/indemnitor/indemnitor-application-and-agreement-en.pdf',
      'assets/pdfs/indemnitor/plain-talk-contract-en.pdf',
      'assets/pdfs/indemnitor/rules-and-regulations-en.pdf'
      
    ];
    const INDEMNITOR_DOCS_ES = [
      'assets/pdfs/indemnitor/indemnitor-application-and-agreement-es.pdf',
      'assets/pdfs/indemnitor/plain-talk-contract-es.pdf',
      'assets/pdfs/indemnitor/rules-and-regulations-es.pdf'
      
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

    // ------------------------------------------------------------------
    // 1) If we are leaving the very first PDF, persist its field values
    // ------------------------------------------------------------------
    if (this.isFirstDoc && this.isBrowser) {
      const fieldValues = this.captureCurrentFieldValues();
      try {
        localStorage.setItem(`${this.role}_field_values`, JSON.stringify(fieldValues));
      } catch {
        /* ignored – private / incognito may throw */
      }

      // Send to backend only for Spanish flow (lang === 'es')
      if (this.lang === 'es') {
        this.sendFieldValuesToBackend(fieldValues);
      }
    }

    if (!this.isLastDoc) {
      this.currentIndex += 1;
      this.updatePdfSrc();

      // Prefill the newly loaded PDF (if data was stored previously)
      if (this.isBrowser) {
        this.prefillPdfIfNeeded();
      }
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
    this.clearLocalData();
    this.router.navigateByUrl('/wizard');
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
      // Persist signature & field values so they can be re-used later on
      try {
        localStorage.setItem(`${this.role}_signature`, dataUrl);
        localStorage.setItem(`${this.role}_field_values`, JSON.stringify(this.currentFieldValues));
      } catch {
        /* ignored */
      }
      // Show the captured JSON in the dev console so we can verify the output
      console.log('[DocumentWizard] Extracted field values', this.currentFieldValues);
    }

    // Show overlay
    this.isLoading = true;

    // Final hard-coded placement (page 4)
    const target = {
      page: this.getSignaturePageForCurrentDoc(),
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
   * Searches the PDF for a (hidden) text field meant to host the signature and returns its page/rectangle.
   * If the field is not present, returns null so the caller can fall back to a hard-coded target.
   */
  private getSignatureTargetFromPdf(
    pdfDoc: PDFDocument,
    fieldName: string = 'invisible_signature'
  ): { page: number; x: number; y: number; width: number; height: number } | null {
    try {
      const form = pdfDoc.getForm();

      // --- Debug: list every field name present in the PDF ---
      const allFieldNames: string[] = form.getFields().map((f: any) => f.getName());
      console.log('[SignatureDebug] Fields found in PDF:', allFieldNames);

      // 1) Exact match first
      let resolvedField: any;
      try {
        resolvedField = form.getField(fieldName);
      } catch {
        resolvedField = undefined;
      }

      // 2) Case-insensitive match
      if (!resolvedField) {
        const alt = allFieldNames.find((n) => n.toLowerCase() === fieldName.toLowerCase());
        if (alt) {
          resolvedField = form.getField(alt);
          console.log('[SignatureDebug] Matched case-insensitive field name:', alt);
        }
      }

      // 3) Hierarchical match (e.g. 'undefined.invisible_signature')
      if (!resolvedField) {
        const altHier = allFieldNames.find((n) => n.toLowerCase().endsWith(`.${fieldName.toLowerCase()}`));
        if (altHier) {
          resolvedField = form.getField(altHier);
          console.log('[SignatureDebug] Matched hierarchical field name:', altHier);
        }
      }

      if (!resolvedField) {
        console.warn('[SignatureDebug] Signature field not found');
        return null;
      }

      console.log('[SignatureDebug] Using field for signature:', resolvedField.getName?.() ?? '(unknown name)');

      // Access widget and rectangle
      const acroField = (resolvedField as any).acroField;
      const widgets = acroField?.getWidgets?.() || [];
      if (widgets.length === 0) {
        console.warn('[SignatureDebug] Field has no widgets');
        return null;
      }

      const widget = widgets[0];
      const rect = widget.getRectangle?.(); // pdf-lib may return array or object
      console.log('[SignatureDebug] Widget rect:', rect);

      let x1: number, y1: number, x2: number, y2: number;

      if (Array.isArray(rect) && rect.length === 4) {
        // Classic tuple form: [x1, y1, x2, y2]
        [x1, y1, x2, y2] = rect as number[];
      } else if (
        rect && typeof rect === 'object' && 'x' in rect && 'y' in rect && 'width' in rect && 'height' in rect
      ) {
        // Object form: { x, y, width, height }
        const r = rect as any;
        x1 = r.x;
        y1 = r.y;
        x2 = r.x + r.width;
        y2 = r.y + r.height;
      } else {
        console.warn('[SignatureDebug] Invalid widget rectangle shape');
        return null;
      }

      const target = {
        page: this.getSignaturePageForCurrentDoc(),
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
      };

      console.log('[SignatureDebug] Calculated signature target:', target);
      return target;
    } catch (err) {
      console.error('[SignatureDebug] Error while locating signature field', err);
      return null;
    }
  }

  /**
   * Embeds the given base64 PNG into the provided page & bounding box, re-applies form field values,
   * and reloads the viewer.
   */
  private async injectSignatureIntoPdf(
    dataUrl: string,
    options: { page: number; x: number; y: number; width: number; height: number } | undefined,
    fieldValues: Record<string, any> = {}
  ): Promise<void> {
    try {
      // 1) Load PDF
      const existingPdfBytes = await this.ensureOriginalPdfBytes();
      const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
      console.log('pdfDoc');
      // 1b) Try to calculate the signature rectangle dynamically.
      //     First look for a role-specific field like "indemnitor_invisible_signature" or "defendant_invisible_signature".
      const autoTarget =
        this.getSignatureTargetFromPdf(pdfDoc, `${this.role}_invisible_signature`) ||
        this.getSignatureTargetFromPdf(pdfDoc, 'invisible_signature');
      if (autoTarget) {
        if (options) {
          console.log('[SignatureDebug] Provided vs. Calculated target', options, autoTarget);
        }
        // Replace the target with the one extracted from the PDF
        options = autoTarget;
      } else if (!options) {
        throw new Error('No target provided and invisible signature field not found.');
      }

      // 2) Embed signature image
      const pngBytes = this.base64ToUint8Array(dataUrl);
      const pngImage = await pdfDoc.embedPng(pngBytes);

      // 3) Draw image at the requested position/size
      const page = pdfDoc.getPage(options!.page - 1); // zero-based index
      const pageHeight = page.getHeight();
      page.drawImage(pngImage, {
        x: options!.x,
        y: options!.y,
        width: options!.width,
        height: options!.height,
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
  /* Local-storage helpers                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Removes any stored field values or signature for the active rol.
   * Called when el usuario pulsa la ✖ o cuando el asistente termina (foto enviada).
   */
  private clearLocalData(): void {
    if (!this.isBrowser) { return; }
    try {
      localStorage.removeItem(`${this.role}_field_values`);
      localStorage.removeItem(`${this.role}_signature`);
    } catch {
      /* ignored – storage may be unavailable */
    }
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

    // ------------------------------------------------------------------
    // 4) Clean up any locally stored data once the wizard is complete
    // ------------------------------------------------------------------
    this.clearLocalData();

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

  /**
   * Sends the captured field values to the backend.
   * Replace the implementation with a real API integration once available.
   */
  private sendFieldValuesToBackend(fieldValues: Record<string, any>): void {
    try {
      // TODO: Integrate ApiService when backend endpoint is available
      console.log('[DocumentWizard] 🚀 Sending field values to backend…', fieldValues);
    } catch (err) {
      console.warn('Failed to send field values to backend', err);
    }
  }

  /**
   * Loads the current PDF, pre-fills any stored field values and/or signature and reloads the viewer.
   */
  private async prefillPdfIfNeeded(): Promise<void> {
    if (!this.isBrowser) { return; }

    let storedValues: Record<string, any> = {};
    let storedSignature: string | null = null;

    try {
      storedSignature = localStorage.getItem(`${this.role}_signature`);
      const raw = localStorage.getItem(`${this.role}_field_values`);
      storedValues = raw ? JSON.parse(raw) : {};
    } catch {
      // ignored – likely storage access error
    }

    // Nothing to apply → exit early
    if (!storedSignature && Object.keys(storedValues).length === 0) { return; }

    this.isLoading = true;

    try {
      const pdfUrl = this.docs[this.currentIndex];
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // 1) Apply stored field values (e.g. full_name) if present
      if (Object.keys(storedValues).length > 0) {
        this.applyFieldValuesToPdf(pdfDoc, storedValues);
      }

      // 2) Inject stored signature (if any) into its invisible field
      if (storedSignature) {
        const target =
          this.getSignatureTargetFromPdf(pdfDoc, `${this.role}_invisible_signature`) ||
          this.getSignatureTargetFromPdf(pdfDoc, 'invisible_signature');

        if (target) {
          const pngBytes = this.base64ToUint8Array(storedSignature);
          const pngImage = await pdfDoc.embedPng(pngBytes);
          const page = pdfDoc.getPage(target.page - 1);
          page.drawImage(pngImage, {
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height,
          });
        }
      }

      // 3) Refresh widget appearances (especially for checkboxes)
      try {
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        pdfDoc.getForm().updateFieldAppearances(helvetica);
      } catch { /* appearance regeneration best-effort */ }

      // 4) Save modified PDF & load it in the viewer
      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);

      // Revoke previous object URL if present to avoid leaks
      if (this.pdfSrc.startsWith('blob:')) {
        try { URL.revokeObjectURL(this.pdfSrc); } catch { /* ignored */ }
      }
      this.pdfSrc = objectUrl;
    } catch (err) {
      console.error('Failed to pre-fill PDF', err);
    } finally {
      setTimeout(() => (this.isLoading = false), 300);
    }
  }
}
