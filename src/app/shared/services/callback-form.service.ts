import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CallbackFormService {
  private callbackOpenSubject = new BehaviorSubject<boolean>(false);

  public callbackOpen$: Observable<boolean> = this.callbackOpenSubject.asObservable();

  constructor() { }

  openCallbackForm(): void {
    this.callbackOpenSubject.next(true);
  }

  closeCallbackForm(): void {
    this.callbackOpenSubject.next(false);
  }

  toggleCallbackForm(): void {
    this.callbackOpenSubject.next(!this.callbackOpenSubject.value);
  }
} 