import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AutomaticScrollService {
  private readonly document = inject(DOCUMENT);
  private release: (() => void) | null = null;
  active = false;

  scrollTo(element: HTMLElement, options: ScrollIntoViewOptions): void {
    this.stop();
    const view = this.document.defaultView;
    if (!view) return;

    this.active = true;
    let idleTimer: number;
    const inputEvents = ['touchstart', 'pointerdown', 'wheel', 'keydown'];
    const finish = () => {
      view.clearTimeout(idleTimer);
      view.removeEventListener('scroll', onScroll);
      inputEvents.forEach(event => view.removeEventListener(event, finish));
      this.active = false;
      this.release = null;
    };
    // Also works in browsers without scrollend support and for instant scrolling.
    const onScroll = () => {
      view.clearTimeout(idleTimer);
      idleTimer = view.setTimeout(finish, 160);
    };

    this.release = finish;
    view.addEventListener('scroll', onScroll, { passive: true });
    inputEvents.forEach(event => view.addEventListener(event, finish, { passive: true }));
    onScroll();
    element.scrollIntoView(options);
  }

  stop(): void {
    this.release?.();
  }
}
