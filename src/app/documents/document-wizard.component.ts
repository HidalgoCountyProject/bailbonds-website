import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { SignatureModalComponent } from '../shared/signature-modal/signature-modal.component';
import { AlertModalComponent } from '../shared/alert-modal/alert-modal.component';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, PDFName } from 'pdf-lib';
import { LoadingModalComponent } from '../shared/loading-modal/loading-modal.component';

@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    SignatureModalComponent,
    AlertModalComponent,
    ReactiveFormsModule,
    LoadingModalComponent,
  ],
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

  // -----------------------------
  // Review/finalisation helpers
  // -----------------------------
  /** Indicates the component is showing the final review (flattened PDFs) step */
  inReviewStep = false;

  /** Object-URL list of the flattened PDFs that will be reviewed by the user */
  flattenedDocs: Array<{ name: string; url: string; bytes: Uint8Array }> = [];

  /** Keeps the raw bytes of the flattened documents so they can be uploaded */
  private finalDocsData: Array<{ name: string; bytes: Uint8Array }> = [];

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

  signedDocs: boolean[] = [];

  /**
   * Convenience helper – returns true when the currently displayed PDF has already been signed.
   */
  hasSignedCurrentDoc(): boolean {
    return this.signedDocs[this.currentIndex] === true;
  }

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
  @ViewChild('warningModal') warningModal?: AlertModalComponent;

  private originalViewportContent: string | null = null;

  /** Index of the currently displayed flattened doc */
  reviewIndex = 0;

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

    // Reset signature tracking for the (re-)loaded manifest
    this.signedDocs = this.docs.map(() => false);

    this.currentIndex = 0;
    this.updatePdfSrc();
    // Prefill the first PDF (e.g. auto-date fields) right after loading it
    if (this.isBrowser) {
      this.prefillPdfIfNeeded();
    }
  }

  private updatePdfSrc() {
    this.pdfSrc = this.docs[this.currentIndex];
    // Clear any cached bytes so future modifications apply to the currently displayed PDF
    this.originalPdfBytes = undefined;
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
      if (this.isBrowser) {
        this.prefillPdfIfNeeded();
      }
    }

    if (!this.isFirstDoc) {
      this.currentIndex -= 1;
      this.updatePdfSrc();
      this.signedDocs[this.currentIndex] = false;

      // Re-apply any stored field values (and signature) when navigating back
      if (this.isBrowser) {
        this.prefillPdfIfNeeded();
      }
    }
  }

  nextDoc() {
    if (this.inIdPhotoStep) {
      return; // No-op while in photo step
    }

    if (!this.hasSignedCurrentDoc()) {
      const msg = this.lang === 'es'
        ? 'Debes firmar este documento antes de continuar.'
        : 'You must sign this document before continuing.';
      this.warningModal?.open(msg);
      return;
    }

    // NEW: Validate that all required PDF fields are filled out
    if (this.isBrowser) {
      const missing = this.getMissingRequiredFields();
      if (missing.length > 0) {
        const msg = this.lang === 'es'
          ? 'Por favor completa los campos que son requeridos (se marcan en color rojo).'
          : 'Please fill out all required fields marked in red before continuing.';
        this.warningModal?.open(msg);
        return; // Abort navigation
      }
    }

    // ------------------------------------------------------------------
    // 1) If we are leaving the very first PDF, persist its field values
    // ------------------------------------------------------------------
    if (this.isFirstDoc && this.isBrowser) {
      const captured = this.captureCurrentFieldValues();
      const fieldValues = {
        ...captured,
        ...this.getCurrentDateFieldValues(),
        ...this.getDefendantFullName(captured),
      };
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
      this.signedDocs[this.currentIndex] = false;

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

  /**
   * Handles the Sign button click.
   *  • First document → open modal so the user can capture / recapture the signature.
   *  • Subsequent documents → silently apply the stored signature (if any) into the
   *    document's invisible signature field without opening the modal.
   */
  openSignature() {
    if (this.inIdPhotoStep) { return; }

    const storedSignature = this.getStoredSignature();

    // If we are on the very first document – or we don't have a stored signature yet –
    // fall back to the existing behaviour (show modal to capture it).
    if (this.isFirstDoc || !storedSignature) {
      this.signatureModal?.open();
      return;
    }

    // ------------------------------------------------------------------
    // Subsequent documents: apply the previously captured signature
    // ------------------------------------------------------------------

    // 1) Capture current field values before we reload the PDF
    if (this.isBrowser) {
      const captured = this.captureCurrentFieldValues();
      this.currentFieldValues = {
        ...captured,
        ...this.getCurrentDateFieldValues(),
        ...this.getDefendantFullName(captured),
      };
    }

    this.isLoading = true;

    const target = {
      page: this.getSignaturePageForCurrentDoc(),
      x: 300,
      y: 122,
      width: 120,
      height: 48,
    };

    this.injectSignatureIntoPdf(storedSignature, target, this.currentFieldValues).catch((err) =>
      console.error('Failed to apply stored signature', err)
    );
  }

  onSignatureSaved(dataUrl: string) {
    this.capturedSignature = dataUrl;

    // 1) Capture the current values the user has entered before we reload the PDF
    if (this.isBrowser) {
      const captured = this.captureCurrentFieldValues();
      this.currentFieldValues = {
        ...captured,
        ...this.getCurrentDateFieldValues(),
        ...this.getDefendantFullName(captured),
      };
      // Persist signature & field values so they can be re-used later on
      try {
        localStorage.setItem(`${this.role}_signature`, dataUrl);
        localStorage.setItem(`${this.role}_field_values`, JSON.stringify(this.currentFieldValues));
      } catch {
        /* ignored */
      }
      // Show the captured JSON in the dev console so we can verify the output
      //console.log('[DocumentWizard] Extracted field values', this.currentFieldValues);
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
   * Returns ALL widget rectangles that match the requested (invisible) field name.
   * Used when the PDF contains several signature placeholders with the same name.
   */
  private getSignatureTargetsFromPdf(
    pdfDoc: PDFDocument,
    fieldName: string = 'invisible_signature'
  ): Array<{ page: number; x: number; y: number; width: number; height: number }> {
    try {
      const form = pdfDoc.getForm();

      // --- Debug: list every field name present in the PDF ---
      const allFieldNames: string[] = form.getFields().map((f: any) => f.getName());
      //console.log('[SignatureDebug] Fields found in PDF:', allFieldNames);

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
        return [];
      }

      console.log('[SignatureDebug] Using field for signature:', resolvedField.getName?.() ?? '(unknown name)');

      // Access widgets and rectangles
      const acroField = (resolvedField as any).acroField;
      const widgets = acroField?.getWidgets?.() || [];
      if (widgets.length === 0) {
        console.warn('[SignatureDebug] Field has no widgets');
        return [];
      }

      const targets: Array<{ page: number; x: number; y: number; width: number; height: number }> = [];

      widgets.forEach((widget: any, idx: number) => {
        const rect = widget.getRectangle?.();
        if (!rect) { return; }

        let x1: number, y1: number, x2: number, y2: number;

        if (Array.isArray(rect) && rect.length === 4) {
          [x1, y1, x2, y2] = rect as number[];
        } else if (rect && typeof rect === 'object' && 'x' in rect && 'y' in rect && 'width' in rect && 'height' in rect) {
          const r = rect as any;
          x1 = r.x; y1 = r.y; x2 = r.x + r.width; y2 = r.y + r.height;
        } else {
          return; // invalid shape
        }

        targets.push({
          page: this.getSignaturePageForCurrentDoc(), // fall back to mapping
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        });
      });

      console.log('[SignatureDebug] Calculated signature targets:', targets);
      return targets;
    } catch (err) {
      console.error('[SignatureDebug] Error while locating signature field', err);
      return [];
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
      const autoTargets = [
        ...this.getSignatureTargetsFromPdf(pdfDoc, `${this.role}_invisible_signature`),
        ...this.getSignatureTargetsFromPdf(pdfDoc, 'invisible_signature'),
      ];

      let targets: Array<{ page: number; x: number; y: number; width: number; height: number }> = [];
      if (autoTargets.length > 0) {
        targets = autoTargets;
        if (options) {
          console.log('[SignatureDebug] Provided target ignored; using auto-detected targets');
        }
      } else if (options) {
        targets = [options];
      } else {
        throw new Error('No signature target found.');
      }

      // 2) Embed signature image
      const pngBytes = this.base64ToUint8Array(dataUrl);
      const pngImage = await pdfDoc.embedPng(pngBytes);

      // 3) Draw image in every target rectangle
      targets.forEach(t => {
        const page = pdfDoc.getPage(t.page - 1);
        page.drawImage(pngImage, { x: t.x, y: t.y, width: t.width, height: t.height });
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
      // Note: we intentionally keep this.originalPdfBytes unchanged so that any future
      // signature replacements start from the pristine (un-signed) PDF.

      // Mark current PDF as signed so the user can advance
      this.signedDocs[this.currentIndex] = true;

      this.logDebug('Injecting signature & restoring field values', { targets, fieldValues });

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

    // If the current src is a generated blob URL, fallback to the original file path
    const fetchUrl = this.pdfSrc.startsWith('blob:') ? this.docs[this.currentIndex] : this.pdfSrc;

    const response = await fetch(fetchUrl);
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

          if (!field) {
            this.logDebug(`Field not found in PDF: ${fieldName}`);
            return;
          }

          if (ctorName.includes('PDFTextField')) {
            field.setText(String(value));
          } else if (ctorName.includes('PDFDropdown') || ctorName.includes('PDFOptionList')) {
            field.select(String(value));
          } else if (ctorName.includes('PDFCheckBox')) {
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
    //console.log('[SignatureDebug] ' + message, data ?? '');
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

    // Leave the photo step and prepare review
    this.inIdPhotoStep = false;
    // Continue to final review step: flatten all documents and show them to the user
    this.finalizeDocuments().catch(err => console.error('Failed to finalise documents', err));
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
      //console.log('[DocumentWizard] 🚀 Sending field values to backend…', fieldValues);
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

      /* --------------------------------------------------------------
       * Auto-populate initials for the "rules and regulations" PDF
       * --------------------------------------------------------------
       * Only applies to the Indemnitor flow and to the documents:
       *   – assets/pdfs/indemnitor/rules-and-regulations-en.pdf
       *   – assets/pdfs/indemnitor/rules-and-regulations-es.pdf
       * We derive the initials from the previously stored first/ full names
       * (defendant_first_name, indemnitor_full_name) and inject them into
       * the field values as defendant_initial / indemnitor_initial.
       */
      if (this.role === 'indemnitor') {
        const rulesDocs = [
          'assets/pdfs/indemnitor/rules-and-regulations-en.pdf',
          'assets/pdfs/indemnitor/rules-and-regulations-es.pdf',
        ];
        const currentDoc = this.docs[this.currentIndex];
        if (rulesDocs.includes(currentDoc)) {
          const defFirst = (storedValues['defendant_first_name'] ?? '').trim();
          const indFull  = (storedValues['indemnitor_full_name'] ?? '').trim();

          if (defFirst.length > 0) {
            storedValues['defendant_initial'] = defFirst.charAt(0).toUpperCase();
          }
          if (indFull.length > 0) {
            storedValues['indemnitor_initial'] = indFull.charAt(0).toUpperCase();
          }
        }
      }

      // --------------------------------------------------------------
      // Auto-populate today's date fields (number_day, month_name, two_last_year_digits)
      // --------------------------------------------------------------
      storedValues = {
        ...storedValues,
        ...this.getCurrentDateFieldValues(),
      };
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

      // 2) (Removed) No longer auto-inject stored signature for the first document.
      //    The user must open the signature modal and confirm/firmar de nuevo.

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

  /**
   * Computes today's date parts in the format expected by the PDF fields.
   *
   *   • number_day – Numeric day of the month (1-31)
   *   • month_name – Localised month name (e.g. "January", "enero")
   *   • two_last_year_digits – Last two digits of the current year (e.g. "24")
   */
  private getCurrentDateFieldValues(): Record<string, string> {
    const now = new Date();
    const numberDay = String(now.getDate());
    // Use English or Spanish month names based on the active flow language
    const locale = this.lang === 'es' ? 'es' : 'en';
    const monthName = now.toLocaleDateString(locale, { month: 'long' });
    const twoLastYearDigits = now.getFullYear().toString().slice(-2);

    // Build full date in dd/mm/yyyy (ES) or mm/dd/yyyy (EN)
    const dd = numberDay.padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    const currentDate = this.lang === 'es' ? `${dd}/${mm}/${yyyy}` : `${mm}/${dd}/${yyyy}`;

    return {
      number_day: numberDay,
      month_name: monthName,
      two_last_year_digits: twoLastYearDigits,
      current_date: currentDate,
    };
  }

  /**
   * For the Indemnitor flow, concatenates first/ middle/ last name fields
   * (if present) and returns an object with defendant_full_name.
   * Used when persisting values after the first document so subsequent PDFs
   * can reuse the full name directly.
   */
  private getDefendantFullName(values: Record<string, any>): Record<string, string> {
    if (this.role !== 'indemnitor') {
      return {};
    }

    const first = (values['defendant_first_name'] ?? '').trim();
    const middle = (values['defendant_middle_name'] ?? '').trim();
    const last = (values['defendant_last_name'] ?? '').trim();

    const parts = [first, middle, last].filter(p => p.length > 0);
    if (parts.length === 0) {
      return {};
    }

    return { defendant_full_name: parts.join(' ') };
  }

  /** Returns the signature (data-URL) stored in localStorage for the active role, or null if absent */
  private getStoredSignature(): string | null {
    if (!this.isBrowser) { return null; }
    try {
      return localStorage.getItem(`${this.role}_signature`);
    } catch {
      return null;
    }
  }

  /**
   * NEW HELPER – Returns the "prompt" or name of each required field that is currently empty.
   * Uses the presence of the HTML `required` attribute or `aria-required="true"` to determine
   * whether a field is mandatory (as set by the originating PDF AcroForm definition).
   */
  private getMissingRequiredFields(): string[] {
    const missing: string[] = [];
    const selector =
      '.textWidgetAnnotation input, .textWidgetAnnotation textarea, ' +
      '.choiceWidgetAnnotation select, .buttonWidgetAnnotation input';

    document.querySelectorAll(selector).forEach((el) => {
      const htmlEl = el as HTMLElement & { required?: boolean };
      const isRequired = (htmlEl as any).required === true || htmlEl.getAttribute('required') !== null || htmlEl.getAttribute('aria-required') === 'true';
      if (!isRequired) { return; }

      // Determine if the field is filled
      let filled = false;
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          filled = el.checked;
        } else {
          filled = el.value.trim().length > 0;
        }
      } else if (el instanceof HTMLTextAreaElement) {
        filled = el.value.trim().length > 0;
      } else if (el instanceof HTMLSelectElement) {
        filled = (el as HTMLSelectElement).value !== '';
      }

      if (!filled) {
        missing.push(''); // value doesn't matter; we only need count
      }
    });

    return missing;
  }

  /** ------------------------------------------------------------
   * Review & final sending helpers
   * ------------------------------------------------------------ */

  /** Returns the signature page (1-based) for the provided document path */
  private getSignaturePageForDoc(docPath: string): number {
    const clean = docPath.split(/[?#]/)[0];
    if (clean in this.SIGN_PAGES) { return this.SIGN_PAGES[clean]; }
    const name = clean.split('/').pop() ?? '';
    return this.SIGN_PAGES[name] ?? 1;
  }

  /** Builds flattened (no form fields) versions of every document with field values & signature applied */
  private async flattenAllDocuments(): Promise<Array<{ name: string; bytes: Uint8Array; url: string }>> {
    const results: Array<{ name: string; bytes: Uint8Array; url: string }> = [];
    const desiredFontSize = 11; // Standardize font size across all filled fields

    // 1) Retrieve stored values & signature
    let storedValues: Record<string, any> = {};
    const storedSignature = this.getStoredSignature();
    try {
      storedValues = JSON.parse(localStorage.getItem(`${this.role}_field_values`) || '{}');
    } catch { /* ignored */ }

    // Always refresh date placeholders
    storedValues = { ...storedValues, ...this.getCurrentDateFieldValues() };

    // 2) Iterate documents and build flattened copies
    for (const docPath of this.docs) {
      try {
        const response = await fetch(docPath);
        const originalBytes = new Uint8Array(await response.arrayBuffer());
        const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });

        // Apply stored field values
        this.applyFieldValuesToPdf(pdfDoc, storedValues);

        // Harmonise font size & font across all text fields before regenerating appearances
        await this.adjustTextFieldFonts(pdfDoc, desiredFontSize);

        // Apply signature if we have one
        if (storedSignature) {
          // Temporarily override pdfSrc so getSignatureTargetsFromPdf can compute fallback page correctly
          const prevSrc = this.pdfSrc;
          this.pdfSrc = docPath;

          const autoTargets = [
            ...this.getSignatureTargetsFromPdf(pdfDoc, `${this.role}_invisible_signature`),
            ...this.getSignatureTargetsFromPdf(pdfDoc, 'invisible_signature'),
          ];
          this.pdfSrc = prevSrc; // restore

          let targets = autoTargets;
          if (targets.length === 0) {
            targets = [{
              page: this.getSignaturePageForDoc(docPath),
              x: 300,
              y: 122,
              width: 120,
              height: 48,
            }];
          }

          const pngBytes = this.base64ToUint8Array(storedSignature);
          const pngImage = await pdfDoc.embedPng(pngBytes);
          targets.forEach(t => {
            const page = pdfDoc.getPage(t.page - 1);
            page.drawImage(pngImage, { x: t.x, y: t.y, width: t.width, height: t.height });
          });
        }

        // -- Debug: fields before flatten --
        try {
          const form = pdfDoc.getForm();
          const beforeCount = form.getFields().length;
          console.log(`[FlattenDebug] ${docPath} – form fields before flatten:`, beforeCount);

          // Regenerate appearances so text is visible once flattened
          try {
            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            form.updateFieldAppearances(helvetica);
          } catch (appearanceErr) {
            console.warn('[FlattenDebug] Could not update appearances', appearanceErr);
          }

          // Flatten – convert interactive widgets into static content
          this.safeFlattenForm(form);

          const afterCount = form.getFields().length;
          console.log(`[FlattenDebug] ${docPath} – form fields after flatten:`, afterCount);

          // Remove AcroForm to ensure viewer treats PDF as static (prevents parsing errors)
          try {
            pdfDoc.catalog.delete(PDFName.of('AcroForm'));
          } catch (delErr) {
            console.warn('[FlattenDebug] Failed to delete AcroForm', delErr);
          }
        } catch (flattenErr) {
          console.warn('[FlattenDebug] Unable to flatten form', flattenErr);
        }
        

        const outBytes = await pdfDoc.save();
        const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
        const name = docPath.split('/').pop() ?? `document-${results.length + 1}.pdf`;
        results.push({ name, bytes: outBytes, url });
      } catch (err) {
        console.error('[DocumentWizard] Failed to flatten document', docPath, err);
      }
    }
    return results;
  }

  /** Prepares flattened documents and switches view to review step */
  private async finalizeDocuments(): Promise<void> {
    this.isLoading = true;
    try {
      const flattened = await this.flattenAllDocuments();
      this.flattenedDocs = flattened.map(f => ({ name: f.name, url: f.url, bytes: f.bytes }));
      this.finalDocsData = flattened.map(f => ({ name: f.name, bytes: f.bytes }));
      this.reviewIndex = 0;
      this.inReviewStep = true;
    } finally {
      this.isLoading = false;
    }
  }

  /** Sends the flattened documents to the backend (stub implementation) */
  sendDocuments(): void {
    //console.log('[DocumentWizard] 🚀 Sending documents to backend…', this.finalDocsData);
    // TODO: integrate ApiService once endpoint is available

    // Clean up local data & notify user
    this.clearLocalData();
    window.alert('Documents sent successfully');
    this.router.navigateByUrl('/wizard');
  }

  /** Navigates back to the editable wizard retaining the local storage data */
  goBackToEdit(): void {
    this.router.navigateByUrl(`/wizard/${this.role}/${this.lang}`);
  }

  /** Safe flatten form method */
  private safeFlattenForm(form: any): void {
    try {
      // pdf-lib exposes Field.flatten(); flatten each individually so one failure doesn't abort whole doc
      const fields = form.getFields?.() ?? [];
      fields.forEach((fld: any) => {
        try {
          if (typeof fld.flatten === 'function') {
            fld.flatten();
          } else {
            // Fallback: remove widgets so field is no longer interactive
            fld.enableReadOnly?.();
          }
        } catch (fieldErr) {
          console.warn('[FlattenDebug] Failed to flatten field', fld?.getName?.(), fieldErr);
          try { fld.enableReadOnly?.(); } catch { /* ignore */ }
        }
      });
    } catch (err) {
      console.warn('[FlattenDebug] safeFlattenForm failed', err);
    }
  }

  /* ------------ Review navigation ------------- */
  get isFirstReview() { return this.reviewIndex === 0; }
  get isLastReview() { return this.reviewIndex === this.flattenedDocs.length - 1; }

  prevFlattened(): void {
    if (!this.isFirstReview) { this.reviewIndex -= 1; }
  }

  nextFlattened(): void {
    if (!this.isLastReview) { this.reviewIndex += 1; }
  }

  /** Sets a consistent Helvetica font and size for every text field in the PDF */
  private async adjustTextFieldFonts(pdfDoc: PDFDocument, fontSize: number = 11): Promise<void> {
    try {
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const form = pdfDoc.getForm();
      form.getFields().forEach((fld: any) => {
        const ctor = fld.constructor?.name || '';
        if (ctor.includes('PDFTextField')) {
          try {
            if (typeof fld.setFont === 'function') { fld.setFont(helvetica); }
            if (typeof fld.setFontSize === 'function') { fld.setFontSize(fontSize); }
          } catch {/* ignore individual field errors */}
        }
      });
      // After setting, regenerate appearances to reflect new size (will also happen later)
      try { form.updateFieldAppearances(helvetica); } catch {}
    } catch (err) {
      console.warn('[FlattenDebug] Unable to adjust text field fonts', err);
    }
  }
}
