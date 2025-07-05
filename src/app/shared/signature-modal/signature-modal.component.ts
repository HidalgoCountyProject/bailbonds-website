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
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d')!;
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      let minY = height, maxY = 0, minX = width, maxX = 0;
      let found = false;
      // Buscar el bounding box de la tinta
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 0) { // alpha > 0
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (found) {
        const signWidth = maxX - minX + 1;
        const signHeight = maxY - minY + 1;
        // Nuevo canvas del mismo ancho, pero solo tan alto como la firma
        const out = document.createElement('canvas');
        out.width = width;
        out.height = signHeight;
        const outCtx = out.getContext('2d')!;
        // Fondo transparente
        outCtx.clearRect(0, 0, out.width, out.height);
        // Pegar la firma alineada abajo
        outCtx.drawImage(canvas, 0, minY, width, signHeight, 0, 0, width, signHeight);
        // Ahora crear un canvas final del tamaño original, pero con la firma pegada abajo
        const final = document.createElement('canvas');
        final.width = width;
        final.height = height;
        const finalCtx = final.getContext('2d')!;
        finalCtx.clearRect(0, 0, width, height);
        finalCtx.drawImage(out, 0, height - signHeight);
        dataUrl = final.toDataURL('image/png');
      } else {
        // Si no hay tinta, exportar el canvas normal
        dataUrl = canvas.toDataURL('image/png');
      }
    }

    if (this.activeTab === 'type' && this.typedName.trim()) {
      // Render the typed name to an off-screen canvas so we always return an image
      const off = document.createElement('canvas');
      off.width = 600;
      off.height = 200;
      const offCtx = off.getContext('2d')!;
      offCtx.fillStyle = '#000';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'bottom';
      offCtx.font = `140px '${this.fontFamily}', sans-serif`;
      offCtx.fillText(this.typedName.trim(), off.width / 2, off.height);
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