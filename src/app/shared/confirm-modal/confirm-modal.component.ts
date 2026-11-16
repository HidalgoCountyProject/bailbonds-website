import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  @Input() message = '';
  @Input() primaryLabel = 'OK';
  @Input() secondaryLabel = 'Cancel';

  show = false;

  /** Emits 'primary' | 'secondary' based on user choice */
  @Output() choice = new EventEmitter<'primary' | 'secondary'>();

  open(message?: string): void {
    if (message !== undefined) { this.message = message; }
    this.show = true;
  }

  close(choice: 'primary' | 'secondary'): void {
    this.show = false;
    this.choice.emit(choice);
  }
} 