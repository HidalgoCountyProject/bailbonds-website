import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { SignatureModalComponent } from '../shared/signature-modal/signature-modal.component';
import { AlertModalComponent } from '../shared/alert-modal/alert-modal.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';
import { IntroModalComponent } from '../shared/intro-modal/intro-modal.component';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, PDFName } from 'pdf-lib';
import { LoadingModalComponent } from '../shared/loading-modal/loading-modal.component';
import { ApiService } from '../services/api.service';
import { hasCompletedDefendantInfo } from './guards/defendant-info-completed.guard';


// --- PDF Manifest Constants ---
const DEFENDANT_DOCS_EN = [
  'assets/pdfs/defendant/defendant-application-and-agreement-en.pdf',
  'assets/pdfs/defendant/supreme-court-opinion-en.pdf',
  'assets/pdfs/defendant/rules-and-regulations-en.pdf',
  'assets/pdfs/defendant/plain-talk-contract-en.pdf'
];
const DEFENDANT_DOCS_ES = [
  'assets/pdfs/defendant/defendant-application-and-agreement-es.pdf',
  'assets/pdfs/defendant/supreme-court-opinion-es.pdf',
  'assets/pdfs/defendant/rules-and-regulations-es.pdf',
  'assets/pdfs/defendant/plain-talk-contract-es.pdf'
];
const INDEMNITOR_DOCS_EN = [
  'assets/pdfs/indemnitor/indemnitor-application-and-agreement-en.pdf',
  'assets/pdfs/indemnitor/plain-talk-contract-en.pdf',
  'assets/pdfs/indemnitor/rules-and-regulations-en.pdf',
  'assets/pdfs/indemnitor/texas-addendum-en.pdf'
];
const INDEMNITOR_DOCS_ES = [
  'assets/pdfs/indemnitor/indemnitor-application-and-agreement-es.pdf',
  'assets/pdfs/indemnitor/plain-talk-contract-es.pdf',
  'assets/pdfs/indemnitor/rules-and-regulations-es.pdf',
  'assets/pdfs/indemnitor/texas-addendum-es.pdf'
];

@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    SignatureModalComponent,
    AlertModalComponent,
    ConfirmModalComponent,
    IntroModalComponent,
    ReactiveFormsModule,
    LoadingModalComponent,
  ],
  templateUrl: './document-wizard.component.html',
  styleUrls: ['./document-wizard.component.css']
})
export class DocumentWizardComponent implements OnInit, OnDestroy, AfterViewInit {
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
    'assets/pdfs/indemnitor/texas-addendum-en.pdf': 1,
    'assets/pdfs/defendant/defendant-application-and-agreement-es.pdf': 5,
    'assets/pdfs/indemnitor/texas-addendum-es.pdf': 1,
    'assets/pdfs/indemnitor/indemnitor-application-and-agreement-en.pdf': 4,
    'assets/pdfs/indemnitor/plain-talk-contract-en.pdf': 1,
    'assets/pdfs/indemnitor/rules-and-regulations-en.pdf': 1,
    'assets/pdfs/defendant/rules-and-regulations-en.pdf': 1,
    'assets/pdfs/defendant/supreme-court-opinion-en.pdf': 1,
    'assets/pdfs/indemnitor/indemnitor-application-and-agreement-es.pdf': 5,
    'assets/pdfs/indemnitor/plain-talk-contract-es.pdf': 1,
    'assets/pdfs/indemnitor/rules-and-regulations-es.pdf': 1,
    'assets/pdfs/defendant/rules-and-regulations-es.pdf': 1,
    'assets/pdfs/defendant/supreme-court-opinion-es.pdf': 1,
    'assets/pdfs/defendant/plain-talk-contract-en.pdf': 1,
    'assets/pdfs/defendant/plain-talk-contract-es.pdf': 1
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
  @ViewChild('infoModal') infoModal?: AlertModalComponent;
  @ViewChild('successModal') successModal?: ConfirmModalComponent;
  @ViewChild('introModal') introModal?: IntroModalComponent;

  private originalViewportContent: string | null = null;

  /** Index of the currently displayed flattened doc */
  reviewIndex = 0;

  // Add state for flattened English docs
  flattenedEnglishDocs: Array<{ name: string; url: string; bytes: Uint8Array }> = [];

  /** Retry counter for callout injection */
  private calloutRetryCount = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private meta: Meta,
    private apiService: ApiService
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
    
    // Hide any active tooltips when changing documents
    this.hideActiveTooltip();
    
    // Force tooltip application after document change with multiple retries
    if (this.isBrowser) {
      setTimeout(() => {
        this.applyTooltips();
      }, 1000);
      
      setTimeout(() => {
        this.applyTooltips();
      }, 2000);
    }
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

    // If we're on the first page and it's indemnitor role, navigate to defendant-info
    if (this.role === 'indemnitor' && this.isFirstDoc) {
      this.router.navigate(['/wizard/indemnitor', this.lang, 'defendant-info']);
      return;
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
        const msg = this.buildMissingFieldsMessage(missing);
        this.warningModal?.open(msg);
        return; // Abort navigation
      }
    }

    // NEW: Validate that defendant and indemnitor names are not identical
    if (this.isBrowser && this.role === 'indemnitor') {
      const nameConflict = this.validateNameConflict();
      if (nameConflict) {
        const msg = this.lang === 'es'
          ? 'El nombre del acusado no puede ser igual al nombre del fiador. Por favor, verifica que los nombres sean diferentes.'
          : 'The defendant name cannot be the same as the indemnitor name. Please verify that the names are different.';
        this.warningModal?.open(msg);
        return; // Abort navigation
      }
    }

    /* NEW: Validate that addresses don't conflict between defendant, indemnitor, and references*/
    if (this.isBrowser && this.role === 'indemnitor') {
      const addressConflict = this.validateAddressConflict();
      if (addressConflict) {
        let msg = '';
        if (addressConflict.type === 'defendant_reference') {
          msg = this.lang === 'es'
            ? `La dirección del acusado no puede ser igual a la dirección de la ${addressConflict.addresses[1].toLowerCase()}. Por favor, verifica que las direcciones sean diferentes.`
            : `The defendant address cannot be the same as the ${addressConflict.addresses[1].toLowerCase()}. Please verify that the addresses are different.`;
        } else if (addressConflict.type === 'indemnitor_reference') {
          msg = this.lang === 'es'
            ? `La dirección ${addressConflict.addresses[0].toLowerCase()} no puede ser igual a la dirección de la ${addressConflict.addresses[1].toLowerCase()}. Por favor, verifica que las direcciones sean diferentes.`
            : `The ${addressConflict.addresses[0].toLowerCase()} cannot be the same as the ${addressConflict.addresses[1].toLowerCase()}. Please verify that the addresses are different.`;
        }
        this.warningModal?.open(msg);
        return; // Abort navigation
      }
    }

    // ------------------------------------------------------------------
    // Persist the field values of the PDF we are leaving (for ALL docs)
    // ------------------------------------------------------------------
    if (this.isBrowser) {
      const captured = this.captureCurrentFieldValues();
      const fieldValues = {
        ...captured,
        ...this.getCurrentDateFieldValues(),
        ...this.getDefendantFullName(captured),
      };

      try {
        const storageKey = `${this.role}_field_values`;
        const existingRaw = localStorage.getItem(storageKey) || '{}';
        const existingValues = JSON.parse(existingRaw);
        const mergedValues = { ...existingValues, ...fieldValues };
        localStorage.setItem(storageKey, JSON.stringify(mergedValues));
      } catch {
        /* ignored – storage access may fail in private/incognito */
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
      
      // Clean up resize event listener
      const resizeHandler = (window as any).__calloutResizeHandler;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        delete (window as any).__calloutResizeHandler;
      }
    }
  }

  close() {
    // Show confirmation dialog before clearing data
          const message = this.lang === 'es' 
        ? '<div class="warning-section"><strong>¿Estás seguro de que quieres salir?</strong><br><br>Toda la información ingresada será <strong>borrada por completo</strong>.</div><div class="note-section"><small><em>Nota: Si quieres regresar al paso anterior, usa las flechas de la barra del wizard.</em></small></div>'
        : '<div class="warning-section"><strong>Are you sure you want to exit?</strong><br><br>All entered information will be <strong>completely deleted</strong>.</div><div class="note-section"><small><em>Note: If you want to go back to the previous step, use the arrows in the wizard bar.</em></small></div>';
    
    const primaryLabel = this.lang === 'es' ? 'Sí, salir' : 'Yes, exit';
    const secondaryLabel = this.lang === 'es' ? 'Cancelar' : 'Cancel';
    
    if (this.successModal) {
      this.successModal.primaryLabel = primaryLabel;
      this.successModal.secondaryLabel = secondaryLabel;
      this.successModal.open(message);
      
      // Subscribe to user choice
      const sub = this.successModal.choice.subscribe((choice) => {
        if (choice === 'primary') {
          // User confirmed - clear data and navigate
          this.clearLocalData();
          this.router.navigateByUrl('/wizard');
        }
        // If choice === 'secondary', user cancelled - do nothing, stay where they are
        sub.unsubscribe();
      });
    } else {
      // Fallback if modal is not available
      const confirmed = window.confirm(message);
      if (confirmed) {
        this.clearLocalData();
        this.router.navigateByUrl('/wizard');
      }
    }
  }



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
      // Persist signature & *merged* field values so they can be re-used later on without
      // deleting keys that may have been collected from other documents.
      try {
        localStorage.setItem(`${this.role}_signature`, dataUrl);

        const storageKey = `${this.role}_field_values`;
        const existingRaw = localStorage.getItem(storageKey) || '{}';
        const existingValues = JSON.parse(existingRaw);
        const mergedValues = { ...existingValues, ...this.currentFieldValues };
        localStorage.setItem(storageKey, JSON.stringify(mergedValues));
      } catch {
        /* Storage access can fail in private/incognito contexts – ignore */
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
      //     Si es supreme-court-opinion, usar el campo con sufijo de idioma
      const cleanSrc = this.pdfSrc.startsWith('blob:') ? this.docs[this.currentIndex] : this.pdfSrc.split(/[?#]/)[0];
      const isSupremeCourtOpinion =
        cleanSrc.includes('supreme-court-opinion-en.pdf') || cleanSrc.includes('supreme-court-opinion-es.pdf');
      let autoTargets: Array<{ page: number; x: number; y: number; width: number; height: number }> = [];
      if (isSupremeCourtOpinion) {
        // Solo buscar el campo de firma con sufijo de idioma
        autoTargets = [
          ...this.getSignatureTargetsFromPdf(pdfDoc, `${this.role}_invisible_signature_${this.lang}`)
        ];
      } else {
        autoTargets = [
          ...this.getSignatureTargetsFromPdf(pdfDoc, `${this.role}_invisible_signature`)
          //...this.getSignatureTargetsFromPdf(pdfDoc, 'invisible_signature'),
        ];
      }

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

      // 3) Draw image in every target rectangle with aspect ratio preservation
      targets.forEach(t => {
        const page = pdfDoc.getPage(t.page - 1);
        
        // Get the original image dimensions
        const imageWidth = pngImage.width;
        const imageHeight = pngImage.height;
        
        // Calculate the target dimensions while preserving aspect ratio
        const { drawWidth, drawHeight, drawX, drawY } = this.calculateAspectRatioFit(
          imageWidth, 
          imageHeight, 
          t.width, 
          t.height, 
          t.x, 
          t.y
        );
        
        page.drawImage(pngImage, { 
          x: drawX, 
          y: drawY, 
          width: drawWidth, 
          height: drawHeight 
        });
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
      const blob = new Blob([this.u8ToArrayBuffer(modifiedBytes)], { type: 'application/pdf' });
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

  /**
   * Calculates the dimensions and position to fit an image within a target rectangle
   * while preserving its aspect ratio. The image will be positioned at the bottom of the target area
   * to align with the signature line. Uses 90% of available space to make signatures larger and more visible.
   */
  private calculateAspectRatioFit(
    imageWidth: number,
    imageHeight: number,
    targetWidth: number,
    targetHeight: number,
    targetX: number,
    targetY: number
  ): { drawWidth: number; drawHeight: number; drawX: number; drawY: number } {
    console.log('imageWidth', imageWidth);
    console.log('imageHeight', imageHeight);
    console.log('targetWidth', targetWidth);
    console.log('targetHeight', targetHeight);
    console.log('targetX', targetX);
    console.log('targetY', targetY);
    // Use 90% of the target area to make signatures larger
    const availableWidth = targetWidth;
    const availableHeight = targetHeight;
    
    // Calculate the scaling factor to fit the image within the available area
    const scaleX = availableWidth / imageWidth;
    const scaleY = availableHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY); // Use the smaller scale to ensure the image fits
    
    // Calculate the new dimensions
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    
    // Position the image at the exact widget coordinates (no centering)
    const drawX = targetX;
    const drawY = targetY;
    console.log('drawX', drawX);
    console.log('drawY', drawY);  
    console.log('drawWidth', drawWidth);
    console.log('drawHeight', drawHeight);

    return { drawWidth, drawHeight, drawX, drawY };
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

  /** Utility: convert Uint8Array to ArrayBuffer for Blob construction */
  private u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
    const ab = new ArrayBuffer(u8.byteLength);
    const view = new Uint8Array(ab);
    view.set(u8);
    return ab;
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
    const ab = await response.arrayBuffer();
    // Force to regular ArrayBuffer (not SharedArrayBuffer) by copying
    const cloned = ab.slice(0);
    this.originalPdfBytes = new Uint8Array(cloned);
    return this.originalPdfBytes;
  }

  /** Writes the key/value pairs into the provided PDF using pdf-lib utilities. */
  private applyFieldValuesToPdf(pdfDoc: PDFDocument, fieldValues: Record<string, any>): void {
    try {
      console.log('Try apply values', fieldValues);
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

          console.log('field', field);
          console.log('fieldName', fieldName);
          console.log('value', value);
          console.log('constructor name',  field?.constructor?.name);

          if (!field) {
            this.logDebug(`Field not found in PDF: ${fieldName}`);
            return;
          }

          // Detect field type by available methods (works in prod and dev)
          if (typeof field.setText === 'function') {
            field.setText(String(value));
          } else if (typeof field.check === 'function' && typeof field.uncheck === 'function') {
            // Checkbox
            const isChecked = value === true || value === 'true' || value === 1 || value === '1';
            isChecked ? field.check() : field.uncheck();
          } else if (typeof field.select === 'function') {
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

    // Validate file size (max 10MB for photos)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      const errorMsg = this.lang === 'es' 
        ? `La foto es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Por favor selecciona una foto más pequeña (máximo 10MB) o toma una nueva foto con menor resolución.`
        : `The photo is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please select a smaller photo (maximum 10MB) or take a new photo with lower resolution.`;
      
      if (this.warningModal) {
        this.warningModal.open(errorMsg);
      } else {
        window.alert(errorMsg);
      }
      
      // Reset the input
      input.value = '';
      return;
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = this.lang === 'es'
        ? 'Por favor selecciona solo archivos de imagen (JPG, PNG, GIF).'
        : 'Please select only image files (JPG, PNG, GIF).';
      
      if (this.warningModal) {
        this.warningModal.open(errorMsg);
      } else {
        window.alert(errorMsg);
      }
      
      // Reset the input
      input.value = '';
      return;
    }

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
       * Applies to both Defendant and Indemnitor flows for the documents:
       *   – assets/pdfs/defendant/rules-and-regulations-en.pdf
       *   – assets/pdfs/defendant/rules-and-regulations-es.pdf
       *   – assets/pdfs/indemnitor/rules-and-regulations-en.pdf
       *   – assets/pdfs/indemnitor/rules-and-regulations-es.pdf
       * We derive the initials from the role's own full name and inject them into
       * the field values as defendant_initial / indemnitor_initial.
       */
      const rulesDocs = [
        'assets/pdfs/defendant/rules-and-regulations-en.pdf',
        'assets/pdfs/defendant/rules-and-regulations-es.pdf',
        'assets/pdfs/indemnitor/rules-and-regulations-en.pdf',
        'assets/pdfs/indemnitor/rules-and-regulations-es.pdf',
        'assets/pdfs/indemnitor/rules-and-regulations-es.pdf',
        'assets/pdfs/indemnitor/rules-and-regulations-es.pdf',
        'assets/pdfs/indemnitor/plain-talk-contract-en.pdf',
        'assets/pdfs/indemnitor/plain-talk-contract-es.pdf'
      ];
      const currentDoc = this.docs[this.currentIndex];
      if (rulesDocs.includes(currentDoc)) {
        // Get the full name for the current role
        const fullNameKey = `${this.role}_full_name`;
        const fullName = (storedValues[fullNameKey] ?? '').trim();
        
        if (fullName.length > 0) {
          // Parse the full name and extract initials
          const initials = this.parseNameAndGetInitials(fullName);
          
          // Set the initial field for the current role
          const initialKey = `${this.role}_initial`;
          storedValues[initialKey] = initials.first;
          
          // If there are middle and last name initials, combine them
          if (initials.middle || initials.last) {
            const combinedInitials = [initials.first, initials.middle, initials.last]
              .filter(initial => initial.length > 0)
              .join('');
            storedValues[initialKey] = combinedInitials;
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
      console.log('pdfUrl', pdfUrl);
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      console.log('pdfDoc', pdfDoc);
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
      const blob = new Blob([this.u8ToArrayBuffer(modifiedBytes)], { type: 'application/pdf' });
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
        // Get the user-friendly field name from the parent section's title attribute
        const fieldName = this.getFieldDisplayName(el);
        // Only add fields that have a title (user-friendly name)
        if (fieldName) {
          missing.push(fieldName);
        }
      }
    });

    return missing;
  }

  /**
   * Extracts a user-friendly field name from the PDF field
   * Only uses the title from the parent section, returns null if no title found
   */
  private getFieldDisplayName(element: Element): string | null {
    // Look for the parent section with title attribute
    const parentSection = element.closest('section[title]');
    if (parentSection) {
      const title = parentSection.getAttribute('title');
      if (title && title.trim()) {
        return title.trim();
      }
    }

    // Return null if no title found - this field will be omitted from the message
    return null;
  }

  /**
   * Builds a user-friendly message listing the missing required fields
   */
  private buildMissingFieldsMessage(missingFields: string[]): string {
    if (missingFields.length === 0) {
      // If no fields with titles are missing, show generic message
      return this.lang === 'es' 
        ? 'Por favor completa los campos requeridos (se marcan en color rojo).'
        : 'Please fill out all required fields marked in red before continuing.';
    }

    // Remove duplicates and sort alphabetically
    const uniqueFields = [...new Set(missingFields)].sort();

    if (this.lang === 'es') {
      if (uniqueFields.length === 1) {
        return `Por favor completa el campo requerido: ${uniqueFields[0]}`;
      } else if (uniqueFields.length === 2) {
        return `Por favor completa los campos requeridos: ${uniqueFields[0]} y ${uniqueFields[1]}`;
      } else {
        const lastField = uniqueFields.pop();
        const otherFields = uniqueFields.join(', ');
        return `Por favor completa los campos requeridos: ${otherFields} y ${lastField}`;
      }
    } else {
      if (uniqueFields.length === 1) {
        return `Please complete the required field: ${uniqueFields[0]}`;
      } else if (uniqueFields.length === 2) {
        return `Please complete the required fields: ${uniqueFields[0]} and ${uniqueFields[1]}`;
      } else {
        const lastField = uniqueFields.pop();
        const otherFields = uniqueFields.join(', ');
        return `Please complete the required fields: ${otherFields} and ${lastField}`;
      }
    }
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

  /** Returns the English PDF filenames for the current role */
  private getEnglishPdfFilenamesForRole(): string[] {
    return this.role === 'defendant' ? DEFENDANT_DOCS_EN : INDEMNITOR_DOCS_EN;
  }

  /** Generic PDF flattening for any set of doc paths */
  private async flattenDocuments(docPaths: string[]): Promise<Array<{ name: string; bytes: Uint8Array; url: string }>> {
    const results: Array<{ name: string; bytes: Uint8Array; url: string }> = [];
    // Get stored values/signature as in flattenAllDocuments
    let storedValues: Record<string, any> = {};
    let storedSignature: string | null = null;
    try {
      storedSignature = localStorage.getItem(`${this.role}_signature`);
      const raw = localStorage.getItem(`${this.role}_field_values`);
      storedValues = raw ? JSON.parse(raw) : {};
    } catch {}
    const desiredFontSize = 11;
    for (const docPath of docPaths) {
      try {
        const response = await fetch(docPath);
        const originalBytes = new Uint8Array(await response.arrayBuffer());
        const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
        this.applyFieldValuesToPdf(pdfDoc, storedValues);
        await this.adjustTextFieldFonts(pdfDoc, desiredFontSize);
        if (storedSignature) {
          const prevSrc = this.pdfSrc;
          this.pdfSrc = docPath;
          // Lógica de idioma para supreme-court-opinion
          const isSupremeCourtOpinion =
            docPath.includes('supreme-court-opinion-en.pdf') || docPath.includes('supreme-court-opinion-es.pdf');
          let autoTargets: Array<{ page: number; x: number; y: number; width: number; height: number }> = [];
          if (isSupremeCourtOpinion) {
            autoTargets = [
              ...this.getSignatureTargetsFromPdf(pdfDoc, `${this.role}_invisible_signature_${this.lang}`)
            ];
          } else {
            autoTargets = [
              ...this.getSignatureTargetsFromPdf(pdfDoc, `${this.role}_invisible_signature`)
              //...this.getSignatureTargetsFromPdf(pdfDoc, 'invisible_signature'),
            ];
          }
          this.pdfSrc = prevSrc;
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
            
            // Get the original image dimensions
            const imageWidth = pngImage.width;
            const imageHeight = pngImage.height;
            
            // Calculate the target dimensions while preserving aspect ratio
            const { drawWidth, drawHeight, drawX, drawY } = this.calculateAspectRatioFit(
              imageWidth, 
              imageHeight, 
              t.width, 
              t.height, 
              t.x, 
              t.y
            );
            
            page.drawImage(pngImage, { 
              x: drawX, 
              y: drawY, 
              width: drawWidth, 
              height: drawHeight 
            });
          });
        }
        // Robust appearance regeneration and flattening
        try {
          const form = pdfDoc.getForm();
          try {
            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            // Ensure consistent font/size on text fields before regenerating appearances
            form.getFields().forEach((fld: any) => {
              try {
                if (typeof (fld as any).setFont === 'function') { (fld as any).setFont(helvetica); }
                if (typeof (fld as any).setFontSize === 'function') { (fld as any).setFontSize(desiredFontSize); }
              } catch { /* ignore individual field errors */ }
            });
            form.updateFieldAppearances(helvetica);
          } catch {
            // Retry once – helps on mobile where memory/timing can cause a first failure
            await new Promise(r => setTimeout(r, 0));
            try {
              const helvetica2 = await pdfDoc.embedFont(StandardFonts.Helvetica);
              form.updateFieldAppearances(helvetica2);
            } catch {
              // If this also fails, proceed to flatten but do not force-delete AcroForm later
            }
          }

          // Flatten after appearances are (re)generated
          this.safeFlattenForm(form);

          // Only remove AcroForm if there are no fields left (i.e., flatten succeeded)
          try {
            const remaining = form.getFields?.() ?? [];
            if (remaining.length === 0) {
              try { pdfDoc.catalog.delete(PDFName.of('AcroForm')); } catch {}
            }
          } catch { /* ignore */ }
        } catch { /* outer guard – never fail whole doc for appearance issues */ }
        const outBytes = await pdfDoc.save();
        const url = URL.createObjectURL(new Blob([this.u8ToArrayBuffer(outBytes as unknown as Uint8Array)], { type: 'application/pdf' }));
        const name = docPath.split('/').pop() ?? `document-${results.length + 1}.pdf`;
        results.push({ name, bytes: outBytes, url });
      } catch (err) {
        console.error('[DocumentWizard] Failed to flatten document', docPath, err);
      }
    }
    return results;
  }

  /** Flatten all main (reviewed) documents */
  private async flattenAllDocuments(): Promise<Array<{ name: string; bytes: Uint8Array; url: string }>> {
    console.log('flattenAllDocuments');
    console.log(this.docs);
    return this.flattenDocuments(this.docs);
  }

  /** Flatten English PDFs for dual upload (Spanish flow) */
  private async flattenEnglishPdfs(): Promise<Array<{ name: string; bytes: Uint8Array; url: string }>> {
    return this.flattenDocuments(this.getEnglishPdfFilenamesForRole());
  }

  /** Prepares flattened documents and switches view to review step */
  private async finalizeDocuments(): Promise<void> {
    this.isLoading = true;
    try {
      const flattened = await this.flattenAllDocuments();
      this.flattenedDocs = flattened.map(f => ({ name: f.name, url: f.url, bytes: f.bytes }));
      this.finalDocsData = flattened.map(f => ({ name: f.name, bytes: f.bytes }));
      // If Spanish, also flatten English PDFs (but don't show in review)
      if (this.lang === 'es') {
        this.flattenedEnglishDocs = await this.flattenEnglishPdfs();
      } else {
        this.flattenedEnglishDocs = [];
      }
      this.reviewIndex = 0;
      this.inReviewStep = true;
      const msgIntro = this.lang === 'es'
        ? `El Siguiente paso es pulsar en el botón de"Enviar documentos".\n\nAsegúrate de que tus datos estén correctos antes de enviar.`
        : `The next step is to press the "Send Documents" button.\n\nMake sure your information is correct before sending.`;
      this.infoModal?.open(msgIntro);
    } finally {
      this.isLoading = false;
    }
  }

  /** Helper: Get the filenames of all flattened PDFs for submission (including English if lang==='es') */
  private getPdfFilenames(): string[] {
    const main = this.flattenedDocs.map(doc => doc.name);
    if (this.lang === 'es') {
      const english = this.flattenedEnglishDocs.map(doc => doc.name);
      return [...main, ...english];
    }
    return main;
  }

  /** Modular file lookup for upload service (searches both Spanish and English flattened docs) */
  private findFileByName(filename: string): Blob | File | null {
    // Buscar en PDFs (Spanish)
    const pdf = this.flattenedDocs.find(doc => doc.name === filename);
    if (pdf) {
      return new Blob([this.u8ToArrayBuffer(pdf.bytes as unknown as Uint8Array)], { type: 'application/pdf' });
    }
    // Buscar en PDFs (English, if present)
    const pdfEn = this.flattenedEnglishDocs.find(doc => doc.name === filename);
    if (pdfEn) {
      return new Blob([this.u8ToArrayBuffer(pdfEn.bytes as unknown as Uint8Array)], { type: 'application/pdf' });
    }
    // Buscar en fotos
    const photoControl = this.idPhotoControl?.value;
    if (photoControl?.front && filename.startsWith('front-')) {
      return photoControl.front;
    }
    if (photoControl?.back && filename.startsWith('back-')) {
      return photoControl.back;
    }
    return null;
  }

  /** Gets the form data object from localStorage for the current role */
  private getFormDataFromLocalStorage(): any {
    const raw = localStorage.getItem(`${this.role}_field_values`);
    return raw ? JSON.parse(raw) : {};
  }

  /** Sends the flattened documents to the backend (calls initProcess first, then uploads files, then completes submission) */
  sendDocuments(): void {
    // Safety net: if this indemnitor session somehow reached the wizard without
    // completing the dedicated Defendant Information step (e.g. a direct/bookmarked/
    // restored URL that bypassed the route guard), block submission here instead of
    // sending an incomplete payload to the backend.
    if (this.role === 'indemnitor' && !hasCompletedDefendantInfo()) {
      const msg = this.lang === 'es'
        ? 'Falta información del acusado (teléfono, dirección o trabajo). Serás redirigido para completarla antes de enviar los documentos.'
        : 'Some defendant information is missing (phone, address, or workplace). You will be redirected to complete it before sending the documents.';

      if (this.warningModal) {
        const sub = this.warningModal.closed.subscribe(() => {
          sub.unsubscribe();
          this.router.navigate(['/wizard/indemnitor', this.lang, 'defendant-info']);
        });
        this.warningModal.open(msg);
      } else {
        this.router.navigate(['/wizard/indemnitor', this.lang, 'defendant-info']);
      }
      return;
    }

    this.isLoading = true;
    const pdfFilenames = this.getPdfFilenames();
    const photoKeys = this.getPhotoKeys();
    const files = [...pdfFilenames, ...photoKeys];
    const payload = { files };

    this.apiService.initProcess(payload).subscribe({
      next: (response) => {
        const uploadId = response.uploadId;
        // Upload all files using the presigned URLs
        this.apiService.uploadFilesToPresignedUrls(response.urls, this.findFileByName.bind(this)).subscribe({
          next: (uploadResults) => {
            const allOk = uploadResults.every(r => r.success);
            // Continue with logic even if some uploads failed
            // if (!allOk) {
            //   this.isLoading = false;
            //   window.alert('Ocurrió un error al subir uno o más archivos. Intenta de nuevo.');
            //   return;
            // }
            // All uploads OK, now call completeDocuments
            const formData = this.getFormDataFromLocalStorage();
            this.apiService.completeDocuments({ uploadId, files, formData, lang: this.lang, role: this.role }).subscribe({
              next: () => {
                this.isLoading = false;
                // Existing modal logic (solo si todo salió bien)
                const msg = this.lang==='es'
                  ? '¡Enhorabuena!\n\nHas enviado los documentos a Affordable Bail Bonds. Si lo deseas, puedes llamar al número de contacto <strong>+1 956-867-9269</strong> para avisar; de cualquier manera nos pondremos en contacto contigo.'
                  : 'Congratulations!\n\nYour documents have been sent to Affordable Bail Bonds. Feel free to call us at <strong>+1 956-867-9269</strong> to let us know; otherwise we will contact you shortly.';
                if (this.successModal) {
                  this.successModal.primaryLabel = this.lang==='es' ? 'Visita nuestro sitio web' : 'Visit our website';
                  this.successModal.secondaryLabel = this.lang==='es' ? 'Completar nuevos documentos' : 'Fill new documents';
                  
                  this.successModal.open(msg);
                  
                  // Auto-redirect after 25 seconds
                  const redirectTimer = setTimeout(() => {
                    this.clearLocalData();
                    this.router.navigateByUrl('/');
                  }, 25000);
                  
                  // Subscribe once
                  const sub = this.successModal.choice.subscribe((c) => {
                    clearTimeout(redirectTimer); // Cancel auto-redirect if user clicks
                    this.clearLocalData();
                    if (c === 'primary') {
                      this.router.navigateByUrl('/');
                    } else {
                      this.router.navigateByUrl('/wizard');
                    }
                    sub.unsubscribe();
                  });
                } else {
                  // Fallback
                  window.alert('Documents sent successfully');
                  this.clearLocalData();
                  this.router.navigateByUrl('/');
                }
              },
              error: () => {
                this.isLoading = false;
                const errorMsg = this.lang === 'es'
                  ? 'Lo sentimos, hubo un error al enviar los documentos. No te preocupes, tus datos siguen guardados. Puedes intentar de nuevo o llamar al número +1 956-867-9269 para asistencia.'
                  : 'We apologize, there was an error sending the documents. Don\'t worry, your data is still saved. You can try again or call +1 956-867-9269 for assistance.';
                
                if (this.warningModal) {
                  this.warningModal.open(errorMsg);
                } else {
                  // Fallback
                  window.alert(errorMsg);
                }
              }
            });
          },
          error: (err) => {
            this.isLoading = false;
            const errorMsg = this.lang === 'es'
              ? 'Lo sentimos, hubo un error al enviar los documentos. No te preocupes, tus datos siguen guardados. Puedes intentar de nuevo o llamar al número +1 956-867-9269 para asistencia.'
              : 'We apologize, there was an error sending the documents. Don\'t worry, your data is still saved. You can try again or call +1 956-867-9269 for assistance.';
            
            if (this.warningModal) {
              this.warningModal.open(errorMsg);
            } else {
              // Fallback
              window.alert(errorMsg);
            }
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        const errorMsg = this.lang === 'es'
          ? 'Lo sentimos, hubo un error al enviar los documentos. No te preocupes, tus datos siguen guardados. Puedes intentar de nuevo o llamar al número +1 956-867-9269 para asistencia.'
          : 'We apologize, there was an error sending the documents. Don\'t worry, your data is still saved. You can try again or call +1 956-867-9269 for assistance.';
        
        if (this.warningModal) {
          this.warningModal.open(errorMsg);
        } else {
          // Fallback
          window.alert(errorMsg);
        }
      }
    });
  }

  /** Navigates back to the editable wizard retaining the local storage data */
  goBackToEdit(): void {
    if (this.inReviewStep) {
      // Reset review-specific state and return to interactive editing
      this.inReviewStep = false;
      this.reviewIndex = 0;
      this.flattenedDocs = [];
      this.finalDocsData = [];

      // Jump back to the first document so the user can empezar de nuevo
      this.currentIndex = 0;
      this.updatePdfSrc();

      // Reapply pre-fill values (signature, etc.)
      if (this.isBrowser) {
        this.prefillPdfIfNeeded();
      }
    } else {
      this.router.navigateByUrl(`/wizard/${this.role}/${this.lang}`);
    }
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

  /* ---------------------------------------------------------------------- */
  /* Placeholder helpers                                                    */
  /* ---------------------------------------------------------------------- */

  /** Called by the PDF viewer once all pages are rendered */
  onPagesLoaded(): void {
    // Apply tooltips to form fields after PDF loads
    if (this.isBrowser) {
      this.applyTooltips();
      // Force retry tooltips multiple times with different delays to ensure they work in English
      setTimeout(() => {
        this.applyTooltips();
      }, 500);
      
      setTimeout(() => {
        this.applyTooltips();
      }, 1000);
      
      setTimeout(() => {
        this.applyTooltips();
      }, 2000);
      
      // Ensure the yellow callout appears inside the PDF text layer on page 1
      this.ensureIndemnitorCallout();
      // Add zoom change listener to update button position
      this.addZoomChangeListener();
    }
  }

  /** Adds a listener for zoom changes to update button position */
  private addZoomChangeListener(): void {
    // Listen for zoom changes in the PDF viewer
    const pdfViewer = document.querySelector('ngx-extended-pdf-viewer');
    if (pdfViewer) {
      // Use MutationObserver to detect changes in the PDF viewer's zoom
      const observer = new MutationObserver(() => {
        // Re-ensure the callout is positioned correctly after zoom changes
        setTimeout(() => this.ensureIndemnitorCallout(), 100);
      });
      
      observer.observe(pdfViewer, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true
      });
    }
    
    // Also listen for window resize events to reposition the button
    // This ensures the button stays correctly positioned when the window is resized
    if (this.isBrowser) {
      const resizeHandler = () => {
        setTimeout(() => this.ensureIndemnitorCallout(), 100);
      };
      window.addEventListener('resize', resizeHandler);
      
      // Store the handler to clean up later if needed
      (window as any).__calloutResizeHandler = resizeHandler;
    }
  }

  /** Applies tooltips to PDF form fields to help users understand what to enter */
  private applyTooltips(): void {
    const selector = '.textWidgetAnnotation input, .textWidgetAnnotation textarea';
    const personInJailFields = ['defendant_first_name', 'defendant_middle_name', 'defendant_last_name'];
    const excludeFields = ['number_day', 'month_name', 'two_last_year_digits'];

    const elements = document.querySelectorAll(selector);

    elements.forEach((el) => {
      const input = el as HTMLInputElement | HTMLTextAreaElement;
      const fieldName = input.name || '';
      if (!fieldName) { return; }

      // Skip checkboxes / radios
      if (input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio')) {
        return;
      }
      
      if (excludeFields.includes(fieldName)) { return; }

      // Check if tooltip is already attached to avoid duplicates
      if (input.hasAttribute('data-tooltip-attached')) {
        return;
      }

      // Add tooltip behavior directly to the input
      this.addTooltipBehavior(input, personInJailFields.includes(fieldName));
      
      // Mark as having tooltip attached
      input.setAttribute('data-tooltip-attached', 'true');
    });
  }

  /** Global tooltip management - only one tooltip can be active at a time */
  private static activeTooltip: HTMLElement | null = null;
  private static activeHideTimeout: any = null;
  private static clickOutsideListenerAdded = false;

  /** Adds tooltip behavior to an input element */
  private addTooltipBehavior(input: HTMLInputElement | HTMLTextAreaElement, isPersonInJail: boolean): void {
    const showTooltip = () => {
      // Hide any existing tooltip first
      this.hideActiveTooltip();
      
      const tooltipType = isPersonInJail ? 'person-in-jail' : 'person-bailing-out';
      const tooltipText = isPersonInJail 
        ? (this.lang === 'es' ? 'Persona en la cárcel' : 'Person in Jail')
        : (this.lang === 'es' ? 'Persona que paga la fianza' : 'Person paying the bond');
      const tooltipIcon = isPersonInJail ? '🔒' : '👤';
      
      const tooltipElement = document.createElement('div');
      tooltipElement.className = `pdf-tooltip pdf-tooltip-${tooltipType}`;
      tooltipElement.innerHTML = `
        <div class="pdf-tooltip-content">
          <span class="pdf-tooltip-icon">${tooltipIcon}</span>
          <span class="pdf-tooltip-text">${tooltipText}</span>
        </div>
        <div class="pdf-tooltip-arrow"></div>
      `;
      
      // Position tooltip above input with higher z-index to avoid interference
      tooltipElement.style.position = 'absolute';
      tooltipElement.style.top = '-50px';
      tooltipElement.style.left = '50%';
      tooltipElement.style.transform = 'translateX(-50%)';
      tooltipElement.style.zIndex = '9999';
      tooltipElement.style.pointerEvents = 'none'; // Don't interfere with input
      
      input.parentElement?.appendChild(tooltipElement);
      
      // Set as active tooltip
      DocumentWizardComponent.activeTooltip = tooltipElement;
      
      // Auto-hide after 5 seconds
      DocumentWizardComponent.activeHideTimeout = setTimeout(() => {
        DocumentWizardComponent.hideActiveTooltipStatic();
      }, 5000);
    };

    const hideTooltip = () => {
      // Only hide if this is the active tooltip
      if (DocumentWizardComponent.activeTooltip && 
          input.parentElement?.contains(DocumentWizardComponent.activeTooltip)) {
        this.hideActiveTooltip();
      }
    };

    // Event listeners
    input.addEventListener('focus', showTooltip);
    input.addEventListener('blur', hideTooltip);
    
    // Show tooltip on touch but don't prevent default to allow keyboard
    input.addEventListener('touchstart', (e) => {
      // Small delay to ensure the input gets focus first
      setTimeout(() => {
        if (document.activeElement === input) {
          showTooltip();
        }
      }, 100);
    });
    
    // Hide tooltip when user starts typing
    input.addEventListener('input', () => {
      this.hideActiveTooltip();
    });
    
    // Hide tooltip when user starts typing (for mobile)
    input.addEventListener('keydown', () => {
      this.hideActiveTooltip();
    });
    
    // Hide tooltip when user starts typing (for mobile keyboards)
    input.addEventListener('compositionstart', () => {
      this.hideActiveTooltip();
    });
    
    // Hide tooltip when user starts typing (for mobile keyboards)
    input.addEventListener('compositionend', () => {
      this.hideActiveTooltip();
    });
    
    // Add global click outside listener only once
    if (!DocumentWizardComponent.clickOutsideListenerAdded) {
      DocumentWizardComponent.clickOutsideListenerAdded = true;
      document.addEventListener('click', (e) => {
        // Small delay to ensure focus event has been processed first
        setTimeout(() => {
          if (DocumentWizardComponent.activeTooltip) {
            const target = e.target as Node;
            const isInsideTooltip = DocumentWizardComponent.activeTooltip.contains(target);
            const isInsideInput = document.querySelector('.textWidgetAnnotation input:focus, .textWidgetAnnotation textarea:focus')?.contains(target);
            
            if (!isInsideTooltip && !isInsideInput) {
              DocumentWizardComponent.hideActiveTooltipStatic();
            }
          }
        }, 10);
      });
    }
    
    // Add CSS styles if not already added
    this.addTooltipStyles();
  }

  /** Hides the currently active tooltip */
  private hideActiveTooltip(): void {
    DocumentWizardComponent.hideActiveTooltipStatic();
  }

  /** Static method to hide active tooltip */
  private static hideActiveTooltipStatic(): void {
    if (DocumentWizardComponent.activeTooltip) {
      DocumentWizardComponent.activeTooltip.remove();
      DocumentWizardComponent.activeTooltip = null;
    }
    if (DocumentWizardComponent.activeHideTimeout) {
      clearTimeout(DocumentWizardComponent.activeHideTimeout);
      DocumentWizardComponent.activeHideTimeout = null;
    }
  }

  /** Public method to manually trigger tooltip application for debugging */
  public forceApplyTooltips(): void {
    this.applyTooltips();
  }

  /** Adds tooltip CSS styles to the document */
  private addTooltipStyles(): void {
    if (document.getElementById('pdf-tooltip-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pdf-tooltip-styles';
    style.textContent = `
      .pdf-tooltip {
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: pdfTooltipSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        pointer-events: none;
        user-select: none;
      }
      
      .pdf-tooltip-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .pdf-tooltip-icon {
        font-size: 16px;
        line-height: 1;
      }
      
      .pdf-tooltip-text {
        font-size: 13px;
        line-height: 1.2;
      }
      
      .pdf-tooltip-arrow {
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid currentColor;
      }
      
      .pdf-tooltip-person-in-jail {
        background: linear-gradient(135deg, #2d3748, #4a5568);
        color: #f7fafc;
        border-color: rgba(247, 250, 252, 0.2);
        box-shadow: 0 4px 12px rgba(45, 55, 72, 0.3), 0 0 0 1px rgba(247, 250, 252, 0.1);
      }
      
      .pdf-tooltip-person-bailing-out {
        background: linear-gradient(135deg, #4299e1, #63b3ed);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
      }
      
      @keyframes pdfTooltipSlideIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
      }
      
      @media (max-width: 768px) {
        .pdf-tooltip {
          font-size: 14px;
          padding: 10px 14px;
          min-width: 180px;
          text-align: center;
          top: -40px !important;
          animation-duration: 0.15s !important;
          pointer-events: none !important;
        }
        
        .pdf-tooltip-content {
          justify-content: center;
        }
        
        .pdf-tooltip-icon {
          font-size: 18px;
        }
        
        .pdf-tooltip-text {
          font-size: 14px;
        }
        
        /* Faster animation on mobile for better responsiveness */
        @keyframes pdfTooltipSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(5px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .pdf-tooltip {
          border: 2px solid currentColor;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .pdf-tooltip {
          animation: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /** ------------------------------------------------------------------ */
  /** Inline callout inside PDF text layer (top-left)                     */
  /** ------------------------------------------------------------------ */
  private ensureIndemnitorCallout(): void {
    try {
      // Only show on interactive PDF step, on the first document of the role, and only for indemnitor role
      if (this.inIdPhotoStep || this.inReviewStep || !this.isFirstDoc || this.role !== 'indemnitor') { return; }

      // Choose the page container itself so we are above text and below widgets
      const page = document.querySelector('.pdfViewer .page[data-page-number="1"]') as HTMLElement | null;
      if (!page) {
        if (this.calloutRetryCount < 10) {
          this.calloutRetryCount++;
          setTimeout(() => this.ensureIndemnitorCallout(), 150);
        }
        return;
      }

      // Remove existing callout if it exists (for repositioning after zoom)
      const existingCallout = page.querySelector('.indemnitor-callout');
      if (existingCallout) {
        existingCallout.remove();
      }

      // Get the actual rendered dimensions of the PDF page
      const pageRect = page.getBoundingClientRect();
      const pageWidth = pageRect.width;
      const pageHeight = pageRect.height;
      
      // Check if we have valid dimensions
      if (pageWidth === 0 || pageHeight === 0) {
        if (this.calloutRetryCount < 10) {
          this.calloutRetryCount++;
          setTimeout(() => this.ensureIndemnitorCallout(), 150);
        }
        return;
      }

      // Create callout container
      const callout = document.createElement('button');
      callout.type = 'button';
      callout.className = 'indemnitor-callout';
      
      // Calculate position as percentage of page width/height
      // This ensures the button scales with the PDF regardless of zoom or screen size
      // Detect mobile vs desktop based on rendered PDF width
      const isMobileSize = pageWidth < 600; // Mobile PDFs typically render narrower
      
      // Position the button - mobile needs to be more to the left
      const leftPercent = isMobileSize ? 7.5 : 9.5;
      const topPercent = isMobileSize ? 0.1 :0.5;
      
      // Adjust slightly for Spanish (move slightly left and down)
      const adjustedLeftPercent = this.lang === 'es' ? leftPercent - 0.3 : leftPercent;
      const adjustedTopPercent = this.lang === 'es' ? topPercent + 0.2 : topPercent;
      
      // Calculate dynamic scale based on page width
      // Use a base reference of 800px width (typical PDF render width for good readability)
      // Scale factor ensures the button size is proportional to the PDF size
      const baseWidth = 800; // reference width for "normal" size
      const scaleFactor = pageWidth / baseWidth;
      
      // Clamp scale factor to reasonable bounds
      // Mobile gets smaller sizing (0.5-0.75), desktop gets normal sizing (0.65-1.15)
      const minScale = isMobileSize ? 0.5 : 0.65;
      const maxScale = isMobileSize ? 0.75 : 1.15;
      const clampedScale = Math.max(minScale, Math.min(maxScale, scaleFactor));
      
      // Use transform-origin at top-left so scaling doesn't affect position
      callout.setAttribute('style', [
        'position:absolute',
        `left: ${adjustedLeftPercent}%`,
        `top: ${adjustedTopPercent}%`,
        'z-index: 1',
        `transform: scale(${clampedScale})`,
        'transform-origin: top left'
      ].join(';'));

      // Localised label
      const labelEs = '¿Qué es? haz click aquí ';
      const labelEn = 'What is it? click here';
      callout.textContent = this.lang === 'es' ? labelEs : labelEn;

      // Click opens the info modal with an explanation of "Indemnitor"
      callout.addEventListener('click', () => {
        const msg = this.lang === 'es'
          ? '<strong>Indemnizador/Indemnitor:</strong> la persona que garantiza y paga la fianza del <strong>acusado</strong> (<strong>persona arrestada</strong>) y es responsable hasta que termine su proceso judicial.<br><br>Es decir, completa esta sección con la información del <strong>indemnizador</strong> (indemnitor).'
          : '<strong>Indemnitor:</strong> the person who guarantees and pays the defendant\'s bond (<strong>arrested person bond</strong>) and is held responsible until the court process is completed.<br><br>That is, fill this section with the <strong>guarantor\'s</strong> (indemnitor) information.';
        this.infoModal?.open(msg);
      });

      // Append inside the page so it scrolls/zooms with the PDF
      page.appendChild(callout);
    } catch {
      /* best-effort UI hint; ignore failures */
    }
  }

  ngAfterViewInit(): void {
    // Show introductory modal when the wizard loads
    const roleLabel = this.role === 'defendant'
      ? (this.lang === 'es' ? 'acusado' : 'defendant')
      : (this.lang === 'es' ? 'indemnizador' : 'indemnitor');

    const msgIntro = this.lang === 'es'
      ? `Vas a comenzar el formulario de ${roleLabel}. Los campos obligatorios tienen bordes rojos. Usa los botones superiores para firmar y navegar.`
      : `You are about to start the ${roleLabel} form. Required fields have red borders. Use the top buttons to sign and navigate.`;

    // Use setTimeout to ensure the modal is opened after view initialisation
    setTimeout(() => this.introModal?.open(msgIntro));
    
    // Additional tooltip application after view init with longer delays
    if (this.isBrowser) {
      setTimeout(() => {
        this.applyTooltips();
      }, 3000);
      
      setTimeout(() => {
        this.applyTooltips();
      }, 5000);
      
      // Expose tooltip functionality globally for debugging
      (window as any).forceTooltips = () => this.forceApplyTooltips();
      (window as any).debugTooltips = () => {
        console.log('Current language:', this.lang);
        console.log('Form elements found:', document.querySelectorAll('.textWidgetAnnotation input, .textWidgetAnnotation textarea').length);
        this.forceApplyTooltips();
      };
    }
  }

  /** Helper: Get the photo keys/filenames based on the selected role and available sides */
  private getPhotoKeys(): string[] {
    const photoControl = this.idPhotoControl?.value;
    const keys: string[] = [];
    if (photoControl?.front) {
      keys.push(`front-${this.role}.jpg`);
    }
    if (photoControl?.back) {
      keys.push(`back-${this.role}.jpg`);
    }
    return keys;
  }

  /**
   * Parses a full name string and extracts initials from first, middle, and last names.
   * Handles cases where middle name might be optional.
   * 
   * @param fullName - The full name string to parse
   * @returns Object with first, middle, and last initials (empty string if not present)
   */
  private parseNameAndGetInitials(fullName: string): { first: string; middle: string; last: string } {
    const trimmed = fullName.trim();
    if (!trimmed) {
      return { first: '', middle: '', last: '' };
    }

    // Split by spaces and filter out empty strings
    const parts = trimmed.split(/\s+/).filter(part => part.length > 0);
    
    if (parts.length === 1) {
      // Only one name provided - treat as first name
      return {
        first: parts[0].charAt(0).toUpperCase(),
        middle: '',
        last: ''
      };
    } else if (parts.length === 2) {
      // Two names - first and last
      return {
        first: parts[0].charAt(0).toUpperCase(),
        middle: '',
        last: parts[1].charAt(0).toUpperCase()
      };
    } else if (parts.length >= 3) {
      // Three or more names - first, middle, last
      // For last name, take the first letter of the third space (start of last name)
      const first = parts[0].charAt(0).toUpperCase();
      const middle = parts[1].charAt(0).toUpperCase();
      const last = parts[2].charAt(0).toUpperCase(); // First letter of third space
      
      return { first, middle, last };
    }

    return { first: '', middle: '', last: '' };
  }

  /**
   * Validates the name conflict between defendant and indemnitor.
   * Returns true if the names are identical, false otherwise.
   */
  private validateNameConflict(): boolean {
    try {
      // Get defendant name from localStorage
      const defendantData = localStorage.getItem('indemnitor_field_values');
      if (!defendantData) return false;
      
      const defendantValues = JSON.parse(defendantData);
      const defendantFirstName = (defendantValues['defendant_first_name'] || '').trim();
      const defendantMiddleName = (defendantValues['defendant_middle_name'] || '').trim();
      const defendantLastName = (defendantValues['defendant_last_name'] || '').trim();
      
      // Build defendant full name
      const defendantNameParts = [defendantFirstName, defendantMiddleName, defendantLastName].filter(part => part.length > 0);
      const defendantFullName = defendantNameParts.join(' ').toLowerCase().trim();
      
      // Get indemnitor name from current form values
      const currentValues = this.captureCurrentFieldValues();
      const indemnitorFullName = (currentValues['indemnitor_full_name'] || '').toLowerCase().trim();
      
      // Compare names (case-insensitive, normalized)
      return defendantFullName.length > 0 && indemnitorFullName.length > 0 && defendantFullName === indemnitorFullName;
    } catch (error) {
      console.warn('Error validating name conflict:', error);
      return false;
    }
  }

  /**
   * Validates address conflicts between defendant, indemnitor, and reference addresses.
   * Returns conflict details if there are conflicts, null otherwise.
   */
  private validateAddressConflict(): { type: string, addresses: string[] } | null {
    try {
      console.log('🔍 Starting address conflict validation...');
      
      // Get defendant address from localStorage
      const defendantData = localStorage.getItem('indemnitor_field_values');
      if (!defendantData) {
        console.log('❌ No defendant data found in localStorage');
        return null;
      }
      
      const defendantValues = JSON.parse(defendantData);
      const defendantAddress = this.normalizeAddress(this.combineDefendantAddress(defendantValues));
      console.log('👤 Defendant address:', defendantAddress);
      
      // Get current indemnitor form values
      const currentValues = this.captureCurrentFieldValues();
      console.log('📋 Current form values keys:', Object.keys(currentValues).filter(key => key.includes('address') || key.includes('reference')));
      
      // Get indemnitor addresses (current and former)
      const indemnitorCurrentAddress = this.normalizeAddress(this.combineIndemnitorCurrentAddress(currentValues));
      const indemnitorFormerAddress = this.normalizeAddress(this.combineIndemnitorFormerAddress(currentValues));
      console.log('🏠 Indemnitor current address:', indemnitorCurrentAddress);
      console.log('🏠 Indemnitor former address:', indemnitorFormerAddress);
      
      // Get reference addresses
      const referenceAddress1 = this.normalizeAddress(this.combineReferenceAddress(currentValues, 1));
      const referenceAddress2 = this.normalizeAddress(this.combineReferenceAddress(currentValues, 2));
      const referenceAddress3 = this.normalizeAddress(this.combineReferenceAddress(currentValues, 3));
      console.log('📞 Reference 1 address:', referenceAddress1);
      console.log('📞 Reference 2 address:', referenceAddress2);
      console.log('📞 Reference 3 address:', referenceAddress3);
      
      const referenceAddresses = [
        { address: referenceAddress1, number: 1 },
        { address: referenceAddress2, number: 2 },
        { address: referenceAddress3, number: 3 }
      ].filter(ref => ref.address.length > 0);
      
      console.log('📞 Valid reference addresses:', referenceAddresses.map(ref => `Ref ${ref.number}: "${ref.address}"`));
      
      // Check if defendant address conflicts with any reference address
      if (defendantAddress.length > 0) {
        console.log('🔍 Checking defendant vs references...');
        for (const ref of referenceAddresses) {
          console.log(`🔍 Comparing defendant "${defendantAddress}" vs reference ${ref.number} "${ref.address}"`);
          if (this.addressesMatch(defendantAddress, ref.address)) {
            console.log('❌ CONFLICT FOUND: Defendant vs Reference', ref.number);
            return {
              type: 'defendant_reference',
              addresses: [`Defendant address`, `Reference ${ref.number}`]
            };
          }
        }
      }
      
      // Check if indemnitor addresses conflict with any reference address
      const indemnitorAddresses = [
        { address: indemnitorCurrentAddress, type: 'Current' },
        { address: indemnitorFormerAddress, type: 'Former' }
      ].filter(addr => addr.address.length > 0);
      
      console.log('🔍 Checking indemnitor vs references...');
      for (const indemnitorAddr of indemnitorAddresses) {
        if (indemnitorAddr.address.length > 0) {
          console.log(`🔍 Checking indemnitor ${indemnitorAddr.type} address: "${indemnitorAddr.address}"`);
          for (const ref of referenceAddresses) {
            console.log(`🔍 Comparing indemnitor ${indemnitorAddr.type} "${indemnitorAddr.address}" vs reference ${ref.number} "${ref.address}"`);
            if (this.addressesMatch(indemnitorAddr.address, ref.address)) {
              console.log('❌ CONFLICT FOUND: Indemnitor vs Reference', ref.number);
              return {
                type: 'indemnitor_reference',
                addresses: [`Indemnitor ${indemnitorAddr.type} address`, `Reference ${ref.number}`]
              };
            }
          }
        }
      }
      
      console.log('✅ No address conflicts found');
      return null;
    } catch (error) {
      console.warn('❌ Error validating address conflict:', error);
      return null;
    }
  }

  /**
   * Combines defendant address fields into a single string
   */
  private combineDefendantAddress(defendantValues: any): string {
    const house = defendantValues['defendant_address_house'] || '';
    const street = defendantValues['defendant_address_street'] || '';
    const city = defendantValues['defendant_address_city'] || '';
    const state = defendantValues['defendant_address_state'] || '';
    const zip = defendantValues['defendant_address_zip'] || '';
    
    console.log('🔧 Combining defendant address:', { house, street, city, state, zip });
    
    const addressParts = [];
    if (house) addressParts.push(house);
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zip) addressParts.push(zip);
    
    const combined = addressParts.join(' ');
    console.log('🔧 Combined defendant address:', combined);
    return combined;
  }

  /**
   * Combines indemnitor current address fields into a single string
   */
  private combineIndemnitorCurrentAddress(values: any): string {
    const house = values['indemnitor_current_house'] || '';
    const street = values['indemnitor_current_street'] || '';
    const city = values['indemnitor_current_city'] || '';
    const state = values['indemnitor_current_state'] || '';
    const zip = values['indemnitor_current_zip'] || '';
    
    console.log('🔧 Combining indemnitor current address:', { house, street, city, state, zip });
    
    const addressParts = [];
    if (house) addressParts.push(house);
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zip) addressParts.push(zip);
    
    const combined = addressParts.join(' ');
    console.log('🔧 Combined indemnitor current address:', combined);
    return combined;
  }

  /**
   * Combines indemnitor former address fields into a single string
   */
  private combineIndemnitorFormerAddress(values: any): string {
    const house = values['indemnitor_former_house'] || '';
    const street = values['indemnitor_former_street'] || '';
    const city = values['indemnitor_former_city'] || '';
    const state = values['indemnitor_former_state'] || '';
    const zip = values['indemnitor_former_zip'] || '';
    
    console.log('🔧 Combining indemnitor former address:', { house, street, city, state, zip });
    
    const addressParts = [];
    if (house) addressParts.push(house);
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zip) addressParts.push(zip);
    
    const combined = addressParts.join(' ');
    console.log('🔧 Combined indemnitor former address:', combined);
    return combined;
  }

  /**
   * Combines reference address fields into a single string
   */
  private combineReferenceAddress(values: any, referenceNumber: number): string {
    const house = values[`indemnitor_reference_house${referenceNumber}`] || '';
    const street = values[`indemnitor_reference_street${referenceNumber}`] || '';
    const city = values[`indemnitor_reference_city${referenceNumber}`] || '';
    const state = values[`indemnitor_reference_state${referenceNumber}`] || '';
    const zip = values[`indemnitor_reference_zip${referenceNumber}`] || '';
    
    console.log(`🔧 Combining reference ${referenceNumber} address:`, { house, street, city, state, zip });
    
    const addressParts = [];
    if (house) addressParts.push(house);
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zip) addressParts.push(zip);
    
    const combined = addressParts.join(' ');
    console.log(`🔧 Combined reference ${referenceNumber} address:`, combined);
    return combined;
  }

  /**
   * Normalizes an address for comparison by removing extra spaces, converting to lowercase,
   * and handling common abbreviations.
   */
  private normalizeAddress(address: string): string {
    if (!address || typeof address !== 'string') return '';
    
    return address.toLowerCase().trim();
  }

  /**
   * Compares two normalized addresses to determine if they match.
   * Uses strict containment detection to prevent any address overlap.
   */
  private addressesMatch(address1: string, address2: string): boolean {
    if (!address1 || !address2) {
      console.log('❌ One or both addresses are empty:', { address1, address2 });
      return false;
    }
    
    // Exact match (addresses are already normalized)
    const match = address1 === address2;
    console.log(`🔍 Address match: "${address1}" === "${address2}" = ${match}`);
    return match;
  }

}
