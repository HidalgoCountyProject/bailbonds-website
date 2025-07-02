import { Component, ElementRef, EventEmitter, Output, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signature-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signature-modal.component.html',
  styleUrls: ['./signature-modal.component.css']
})
export class SignatureModalComponent {
  /** Emits when the user clicks the X icon */
  @Output() closed = new EventEmitter<void>();
  /** Emits the PNG-encoded signature when the user clicks SAVE */
  @Output() saved = new EventEmitter<string>();

  /** Controls visibility of the modal */
  show = false;
  /** Currently selected tab */
  activeTab: 'draw' | 'type' = 'draw';

  /** Typed signature */
  typedName = '';
  /** Currently selected webfont */
  fontFamily = 'Dancing Script';
  fonts: string[] = [
    'Dancing Script',
    'Satisfy',
    'Cookie',
    'Great Vibes',
    'Caveat',
    'Sunshiney',
    'Sedgwick Ave',
    'Sacramento'
  ];

  @ViewChild('canvas', { static: false }) private canvasRef?: ElementRef<HTMLCanvasElement>;
  private ctx?: CanvasRenderingContext2D;
  private drawing = false;

  /** Language passed by the parent wizard (defaults to English) */
  @Input() lang: 'en' | 'es' = 'en';

  /** Internal strings for EN/ES. This is kept local so we don't pollute the global website dictionary. */
  private readonly i18n: Record<'en' | 'es', Record<string, string>> = {
    en: {
      drawTab: 'DRAW',
      typeTab: 'TYPE',
      drawTitle: 'DRAW SIGNATURE',
      typeTitle: 'TYPE SIGNATURE',
      legal: 'I agree that this electronic signature is legally binding and can be used by Affordable Bail Bonds.',
      rotate: 'Rotate your phone for more space',
      clearSignature: 'CLEAR SIGNATURE',
      clearName: 'CLEAR NAME',
      chooseFont: 'CHOOSE FONT:',
      typeHere: 'TYPE SIGNATURE',
      placeholderName: 'Your Name',
      save: 'SAVE'
    },
    es: {
      drawTab: 'DIBUJAR',
      typeTab: 'ESCRIBIR',
      drawTitle: 'DIBUJAR FIRMA',
      typeTitle: 'ESCRIBIR FIRMA',
      legal: 'Estoy de acuerdo en que esta firma electrónica es legalmente vinculante y puede ser utilizada por Affordable Bail Bonds.',
      rotate: 'Gira tu teléfono para más espacio',
      clearSignature: 'BORRAR FIRMA',
      clearName: 'BORRAR NOMBRE',
      chooseFont: 'ELEGIR FUENTE:',
      typeHere: 'ESCRIBIR FIRMA',
      placeholderName: 'Tu Nombre',
      save: 'GUARDAR'
    }
  };

  /** Helper translation getter */
  t(key: string): string {
    return this.i18n[this.lang][key] || key;
  }

  // Public API --------------------------------------------------------------

  open(): void {
    this.show = true;
    // Give Angular a tick to render the canvas before initialising it
    setTimeout(() => this.initCanvas(), 0);
  }

  close(): void {
    this.show = false;
    this.closed.emit();
  }

  clear(): void {
    if (this.activeTab === 'draw' && this.canvasRef && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    }
    if (this.activeTab === 'type') {
      this.typedName = '';
    }
  }

  save(): void {
    let dataUrl = '';

    if (this.activeTab === 'draw' && this.canvasRef) {
      dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    }

    if (this.activeTab === 'type' && this.typedName.trim()) {
      // Render the typed name to an off-screen canvas so we always return an image
      const off = document.createElement('canvas');
      off.width = 600;
      off.height = 200;
      const offCtx = off.getContext('2d')!;
      offCtx.fillStyle = '#000';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.font = `72px '${this.fontFamily}', sans-serif`;
      offCtx.fillText(this.typedName.trim(), off.width / 2, off.height / 2);
      dataUrl = off.toDataURL('image/png');
    }

    this.saved.emit(dataUrl);
    this.close();
  }

  /** Switches between DRAW and TYPE tabs */
  switchTab(tab: 'draw' | 'type'): void {
    this.activeTab = tab;
    if (tab === 'draw') {
      // Wait for the new canvas to render, then init it
      setTimeout(() => this.initCanvas(), 0);
    }
  }

  // Canvas helpers ----------------------------------------------------------
  private initCanvas(): void {
    if (!this.canvasRef) {
      return;
    }
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Increase resolution on HiDPI screens
    canvas.width = width * 2;
    canvas.height = height * 2;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(2, 2);
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#000';
  }

  onPointerDown(evt: MouseEvent | TouchEvent): void {
    this.drawing = true;
    const { x, y } = this.getPointerPos(evt);
    this.ctx?.beginPath();
    this.ctx?.moveTo(x, y);
    evt.preventDefault();
  }

  onPointerMove(evt: MouseEvent | TouchEvent): void {
    if (!this.drawing) return;
    const { x, y } = this.getPointerPos(evt);
    this.ctx?.lineTo(x, y);
    this.ctx?.stroke();
    evt.preventDefault();
  }

  onPointerUp(evt: MouseEvent | TouchEvent): void {
    this.drawing = false;
    evt.preventDefault();
  }

  private getPointerPos(evt: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef!.nativeElement;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (evt instanceof TouchEvent) {
      if (!evt.touches.length) {
        return { x: 0, y: 0 };
      }
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
} 