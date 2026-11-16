import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private callbackPopupSubject = new BehaviorSubject<boolean>(false);
  
  // Observable público para que los componentes puedan suscribirse
  public callbackPopup$: Observable<boolean> = this.callbackPopupSubject.asObservable();
  
  constructor() { }
  
  // Método para abrir el popup
  openCallbackPopup(): void {
    this.callbackPopupSubject.next(true);
  }
  
  // Método para cerrar el popup
  closeCallbackPopup(): void {
    this.callbackPopupSubject.next(false);
  }
  
  // Método para alternar el estado del popup
  toggleCallbackPopup(): void {
    this.callbackPopupSubject.next(!this.callbackPopupSubject.value);
  }
} 