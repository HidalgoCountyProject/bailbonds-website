import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro-modal.component.html',
  styleUrls: ['./intro-modal.component.css']
})
export class IntroModalComponent {
  /** Texto a mostrar dentro del modal */
  @Input() message = '';

  /** Idioma para los textos internos */
  @Input() lang: 'en' | 'es' = 'en';

  /** Controla la visibilidad */
  show = false;

  /** Se emite cuando el usuario cierra el modal */
  @Output() closed = new EventEmitter<void>();

  /** Abre el modal y permite actualizar el mensaje */
  open(message?: string): void {
    if (message !== undefined) {
      this.message = message;
    }
    this.show = true;
  }

  /** Cierra el modal (solo vía OK) */
  close(): void {
    this.show = false;
    this.closed.emit();
  }
} 