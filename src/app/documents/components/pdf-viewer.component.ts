import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfService } from '../services/pdf.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PdfViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Source URL of the PDF file */
  @Input() src!: string;
  /** Emits whenever the visible page (derived from scroll position) changes */
  @Output() pageChange = new EventEmitter<{ current: number; total: number }>();

  /** Scroll container wrapping canvases */
  @ViewChild('scrollContainer', { static: true }) scrollContainerRef!: ElementRef<HTMLDivElement>;

  totalPages = 0;
  private resizeObserver!: ResizeObserver;

  constructor(private pdfService: PdfService, private renderer: Renderer2) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.loadPdf();
  }

  private async loadPdf() {
    if (!this.src || typeof window === 'undefined') return;

    const container = this.scrollContainerRef.nativeElement;
    // Clean previous renders
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const pdfDoc = await this.pdfService.load(this.src);
    this.totalPages = pdfDoc.numPages;

    // Render pages serially to keep memory low
    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });

      // Create canvas element
      const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      if (!context) continue;

      // Fit width to container but render at device-pixel-ratio for high DPI
      const dpr = window.devicePixelRatio || 1;
      const cssScale = container.clientWidth / viewport.width;
      const scale = cssScale * dpr;
      const scaledViewport = page.getViewport({ scale });

      // Set canvas pixel dimensions (high-res)
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Keep canvas displayed size at CSS pixels (so layout unchanged)
      canvas.style.width = `${scaledViewport.width / dpr}px`;
      canvas.style.height = `${scaledViewport.height / dpr}px`;

      const renderTask = page.render({ canvasContext: context, viewport: scaledViewport });
      await renderTask.promise;

      this.renderer.appendChild(container, canvas);
    }

    // Emit initial page
    this.emitPage(container);

    // Listen to scroll events
    this.renderer.listen(container, 'scroll', () => this.emitPage(container));

    // Observe resize to re-emit page on container size changes (helpful on orientation change)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.emitPage(container));
      this.resizeObserver.observe(container);
    }
  }

  private emitPage(container: HTMLElement) {
    if (this.totalPages === 0) return;
    const scrollTop = container.scrollTop || 0;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const progress = scrollTop / (scrollHeight - clientHeight);
    const pageApprox = Math.min(this.totalPages, Math.max(1, Math.round(progress * this.totalPages)));
    this.pageChange.emit({ current: pageApprox, total: this.totalPages });
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
