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
  private strokeCount = 0; // Contador de trazos completos
  private moveCount = 0;   // Contador de movimientos durante un trazo

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
      save: 'SAVE',
      // Mensajes de validación
      signatureTooSmall: 'Please draw a complete signature. The signature is too small or incomplete.',
      noSignature: 'Please draw or type your signature before saving.',
      nameTooShort: 'Please enter your full name.',
      signatureIncomplete: 'Please draw a more complete signature with longer strokes.'
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
      save: 'GUARDAR',
      // Mensajes de validación
      signatureTooSmall: 'Por favor dibuja una firma completa. La firma es demasiado pequeña o incompleta.',
      noSignature: 'Por favor dibuja o escribe tu firma antes de guardar.',
      nameTooShort: 'Por favor ingresa tu nombre completo.',
      signatureIncomplete: 'Por favor dibuja una firma más completa con trazos más largos.'
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
      this.strokeCount = 0; // Resetear contador de trazos
      this.moveCount = 0;   // Resetear contador de movimientos
    }
    if (this.activeTab === 'type') {
      this.typedName = '';
    }
  }

  save(): void {
    let dataUrl = '';

    if (this.activeTab === 'draw' && this.canvasRef) {
      // SOLUCIÓN 3: Validar que hubo trazos significativos
      const MIN_STROKES = 1;     // Al menos un trazo
      const MIN_MOVES = 5;       // Al menos 5 movimientos acumulados (más estricto)
      
      if (this.strokeCount < MIN_STROKES) {
        alert(this.t('noSignature'));
        return;
      }
      
      // Si solo hay un tap (un trazo sin movimientos), rechazar
      if (this.strokeCount === 1 && this.moveCount < MIN_MOVES) {
        alert(this.t('signatureIncomplete'));
        return;
      }

      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d')!;
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      let minY = height, maxY = 0, minX = width, maxX = 0;
      let found = false;
      let pixelCount = 0; // SOLUCIÓN 1: Contar píxeles con tinta
      
      // Buscar el bounding box de la tinta
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] > 0) { // alpha > 0
            found = true;
            pixelCount++; // SOLUCIÓN 1: Incrementar contador
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
        // SOLUCIÓN 1: Validaciones de firma válida
        if (found) {
          const signWidth = maxX - minX + 1;
          const signHeight = maxY - minY + 1;
          const MIN_WIDTH = 45;   // Ancho mínimo en píxeles (más estricto)
          const MIN_HEIGHT = 25;  // Alto mínimo en píxeles (más estricto)
          const MIN_PIXELS = 80;  // Mínimo de píxeles con tinta (más estricto)
          
          // Validar que la firma tenga dimensiones razonables (AMBAS dimensiones deben ser válidas)
          const isWidthValid = signWidth >= MIN_WIDTH;
          const isHeightValid = signHeight >= MIN_HEIGHT;
          const isPixelCountValid = pixelCount >= MIN_PIXELS;
          
          if (!isWidthValid || !isHeightValid || !isPixelCountValid) {
            alert(this.t('signatureTooSmall'));
            return; // No guardar
          }
        
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
        // SOLUCIÓN 1: Mostrar error si no hay nada dibujado
        alert(this.t('noSignature'));
        return;
      }
    }

    if (this.activeTab === 'type' && this.typedName.trim()) {
      // SOLUCIÓN 1: Validar longitud mínima del nombre
      if (this.typedName.trim().length < 2) {
        alert(this.t('nameTooShort'));
        return;
      }
      
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
    
    // SOLUCIÓN 1: Validar que haya un dataUrl antes de emitir
    if (!dataUrl) {
      alert(this.t('noSignature'));
      return;
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
    
    // SOLUCIÓN 3: Resetear contadores al inicializar
    this.strokeCount = 0;
    this.moveCount = 0;
  }

  onPointerDown(evt: MouseEvent | TouchEvent): void {
    this.drawing = true;
    this.moveCount = 0; // SOLUCIÓN 3: Resetear contador de movimientos para este trazo
    const { x, y } = this.getPointerPos(evt);
    this.ctx?.beginPath();
    this.ctx?.moveTo(x, y);
    evt.preventDefault();
  }

  onPointerMove(evt: MouseEvent | TouchEvent): void {
    if (!this.drawing) return;
    this.moveCount++; // SOLUCIÓN 3: Incrementar contador de movimientos
    const { x, y } = this.getPointerPos(evt);
    this.ctx?.lineTo(x, y);
    this.ctx?.stroke();
    evt.preventDefault();
  }

  onPointerUp(evt: MouseEvent | TouchEvent): void {
    if (this.drawing && this.moveCount > 0) {
      this.strokeCount++; // SOLUCIÓN 3: Solo incrementar si hubo movimiento
    }
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