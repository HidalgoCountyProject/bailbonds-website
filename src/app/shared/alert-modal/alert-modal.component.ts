import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.component.html',
  styleUrls: ['./alert-modal.component.css']
})
export class AlertModalComponent {
  /** Texto a mostrar dentro del modal */
  @Input() message = '';

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

  /** Cierra el modal */
  close(): void {
    this.show = false;
    this.closed.emit();
  }
} 