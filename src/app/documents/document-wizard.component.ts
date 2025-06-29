import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { SignatureModalComponent } from '../shared/signature-modal/signature-modal.component';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

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
  
  // Zoom limits for mobile optimization
  minZoom = 0.5;  // 50% - minimum zoom (can't zoom out beyond initial fit)
  maxZoom = 3.0;  // 300% - maximum zoom (reasonable limit for mobile)
  currentZoom = 1.0;
  initialScale = 1.0;

  // Hold captured signature (PNG Data URL)
  capturedSignature?: string;

  // Step management
  inIdPhotoStep = false;

  // Reactive form to capture ID photo (front and back)
  currentForm!: FormGroup;

  private idPhotoQuestion = { question_id: 'id-photo', input_type: 'photo' };

  @ViewChild('signatureModal') signatureModal?: SignatureModalComponent;

  constructor(private router: Router, private route: ActivatedRoute, private fb: FormBuilder) {
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

  /* ---------------------------------------------------------------------- */
  /* Signature modal helpers                                                */
  /* ---------------------------------------------------------------------- */

  openSignature() {
    if (this.inIdPhotoStep) { return; } // Disable signature during photo step
    this.signatureModal?.open();
  }

  onSignatureSaved(dataUrl: string) {
    this.capturedSignature = dataUrl;
    // Later you can embed this into the PDF or preview it
    console.log('Signature captured', dataUrl.substring(0, 50) + '...');
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
