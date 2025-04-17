import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, Renderer2, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  private autoScrollInterval: any;
  private isPaused: boolean = false;
  private currentIndex: number = 0;
  private totalSlides: number = 0;
  private slidesPerView: number = 4;
  private isBrowser: boolean;
  private destroy$ = new Subject<void>();
  private resumeTimeoutId: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private renderer: Renderer2, private el: ElementRef) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      setTimeout(() => this.initAccordion(), 0);
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.initializeCarousel();
        this.handleResize();
      }, 0);

      fromEvent(window, 'resize')
        .pipe(
          debounceTime(150),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.handleResize();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.isBrowser && this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
    }
  }

  initAccordion(): void {
    const accordionHeaders = this.el.nativeElement.querySelectorAll('.accordion-header');
    accordionHeaders.forEach((header: HTMLElement) => {
      this.renderer.listen(header, 'click', () => {
        const accordionItem = header.parentElement;
        if (!accordionItem) return;
        const currentlyActive = accordionItem.classList.contains('active');
        
        this.el.nativeElement.querySelectorAll('.accordion-item.active').forEach((item: HTMLElement) => {
          if (item !== accordionItem) {
            item.classList.remove('active');
          }
        });
        
        if (!currentlyActive) {
          accordionItem.classList.add('active');
        } else {
          accordionItem.classList.remove('active');
        }
      });
    });
  }

  private initializeCarousel(): void {
    const carousel = this.el.nativeElement.querySelector('.services-carousel') as HTMLElement;
    const dotsContainer = this.el.nativeElement.querySelector('.carousel-dots') as HTMLElement;
    const prevButton = this.el.nativeElement.querySelector('.carousel-control.prev') as HTMLElement;
    const nextButton = this.el.nativeElement.querySelector('.carousel-control.next') as HTMLElement;
    
    if (!carousel || !dotsContainer || !prevButton || !nextButton) {
      console.error("Carousel elements not found");
      return;
    }

    const cards = carousel.querySelectorAll('.service-card');
    this.totalSlides = cards.length;
    
    if(this.totalSlides === 0) {
      console.error("No service cards found in carousel");
      return;
    }

    this.updateSlidesPerView();
    this.createDots(dotsContainer);
    this.equalizeCardHeights();
    this.setupDesktopInteractions(carousel, prevButton, nextButton);
    this.updateScrollableState();
    this.startAutoScroll();
  }

  private handleResize(): void {
    this.updateSlidesPerView();
    this.moveToSlide(this.currentIndex, false);
    setTimeout(() => this.equalizeCardHeights(), 50);
    this.updateScrollableState();
    this.startAutoScroll();
  }

  private setupDesktopInteractions(carousel: HTMLElement, prevButton: HTMLElement, nextButton: HTMLElement): void {
    if (window.innerWidth < 768) return;
    const container = carousel.parentElement as HTMLElement;
    if (!container) return;

    this.renderer.listen(container, 'mouseenter', () => this.pauseCarousel());
    this.renderer.listen(container, 'mouseleave', () => this.resumeCarousel(1500));
    
    this.renderer.listen(prevButton, 'click', () => {
      this.pauseCarousel();
      this.moveToSlide(this.currentIndex - 1);
      this.resumeCarousel(8000);
    });
    this.renderer.listen(nextButton, 'click', () => {
      this.pauseCarousel();
      this.moveToSlide(this.currentIndex + 1);
      this.resumeCarousel(8000);
    });
  }

  private createDots(container: HTMLElement): void {
    container.innerHTML = '';
    const isMobile = window.innerWidth < 768;
    const requiredDots = this.totalSlides > this.slidesPerView;
    
    if (isMobile || !requiredDots) {
       this.renderer.setStyle(container, 'display', 'none');
       return;
    }
    this.renderer.setStyle(container, 'display', 'flex');

    const dotCount = Math.max(0, this.totalSlides - this.slidesPerView + 1);
    
    for (let i = 0; i < dotCount; i++) {
      const dot = this.renderer.createElement('div');
      this.renderer.addClass(dot, 'carousel-dot');
      if (i === this.currentIndex) this.renderer.addClass(dot, 'active');
      this.renderer.setAttribute(dot, 'data-index', i.toString());
      this.renderer.listen(dot, 'click', () => {
        this.pauseCarousel();
        this.moveToSlide(i);
        this.resumeCarousel(8000);
      });
      this.renderer.appendChild(container, dot);
    }
  }

  private updateSlidesPerView(): void {
    const width = window.innerWidth;
    let previousSlidesPerView = this.slidesPerView;
    
    if (width >= 1200) {
      this.slidesPerView = 4;
    } else if (width >= 992) {
      this.slidesPerView = 3;
    } else if (width >= 768) {
      this.slidesPerView = 2;
    } else {
      this.slidesPerView = 1;
    }
    
    if (previousSlidesPerView !== this.slidesPerView) {
        const dotsContainer = this.el.nativeElement.querySelector('.carousel-dots') as HTMLElement;
        if (dotsContainer) {
            this.createDots(dotsContainer);
        }
    }
  }

  private getSlideWidth(): number {
    const firstCard = this.el.nativeElement.querySelector('.services-carousel .service-card') as HTMLElement;
    if (!firstCard) return 0;
    const cardStyle = window.getComputedStyle(firstCard);
    const marginLeft = parseFloat(cardStyle.marginLeft || '0');
    const marginRight = parseFloat(cardStyle.marginRight || '0');
    return firstCard.offsetWidth + marginLeft + marginRight;
  }

  private moveToSlide(index: number, animate: boolean = true): void {
    const carousel = this.el.nativeElement.querySelector('.services-carousel') as HTMLElement;
    if (!carousel || window.innerWidth < 768) return;

    const maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);
    
    if (index < 0) {
        this.currentIndex = maxIndex;
    } else if (index > maxIndex) {
        this.currentIndex = 0;
    } else {
        this.currentIndex = index;
    }
    
    const slideWidth = this.getSlideWidth();
    const translateX = -(this.currentIndex * slideWidth);
    
    this.renderer.setStyle(carousel, 'transition', animate ? 'transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)' : 'none');
    this.renderer.setStyle(carousel, 'transform', `translateX(${translateX}px)`);
    
    this.updateActiveDot();
    this.updateScrollableState();
  }

  private updateActiveDot(): void {
    const dots = this.el.nativeElement.querySelectorAll('.carousel-dots .carousel-dot');
    if (!dots || dots.length === 0) return;
    
    dots.forEach((dot: HTMLElement, index: number) => {
      if (index === this.currentIndex) {
        this.renderer.addClass(dot, 'active');
      } else {
        this.renderer.removeClass(dot, 'active');
      }
    });
  }

  private updateScrollableState(): void {
    const container = this.el.nativeElement.querySelector('.carousel-container') as HTMLElement;
    if (!container || window.innerWidth < 768) return;

    const maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);
    const canScrollLeft = this.currentIndex > 0;
    const canScrollRight = this.currentIndex < maxIndex;

    if (canScrollLeft) {
        this.renderer.addClass(container, 'is-scrollable-left');
    } else {
        this.renderer.removeClass(container, 'is-scrollable-left');
    }

    if (canScrollRight) {
        this.renderer.addClass(container, 'is-scrollable-right');
    } else {
        this.renderer.removeClass(container, 'is-scrollable-right');
    }
  }

  private startAutoScroll(): void {
    if (!this.isBrowser || window.innerWidth < 768) {
       if (this.autoScrollInterval) clearInterval(this.autoScrollInterval);
       return;
    }
    
    if (this.totalSlides <= this.slidesPerView) {
        if (this.autoScrollInterval) clearInterval(this.autoScrollInterval);
        return;
    }
    
    this.pauseCarousel();
    if (this.autoScrollInterval) clearInterval(this.autoScrollInterval);
    
    this.autoScrollInterval = setInterval(() => {
      if (!this.isPaused) {
        this.moveToSlide(this.currentIndex + 1);
      }
    }, 6000);
    this.resumeCarousel(1000);
  }

  private pauseCarousel(): void {
    this.isPaused = true;
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = null;
    }
  }

  private resumeCarousel(delay: number = 0): void {
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = null;
    }
    
    if (this.totalSlides <= this.slidesPerView) return;
    
    if (delay > 0) {
      this.resumeTimeoutId = setTimeout(() => {
        if (this.isPaused) {
          this.isPaused = false;
        }
        this.resumeTimeoutId = null;
      }, delay);
    } else {
      this.isPaused = false;
    }
  }

  private equalizeCardHeights(): void {
    if (!this.isBrowser) return;
    const cards = this.el.nativeElement.querySelectorAll('.services-carousel .service-card') as NodeListOf<HTMLElement>;
    if (!cards.length) return;
    
    let maxHeight = 0;
    cards.forEach(card => this.renderer.setStyle(card, 'height', 'auto'));
    
    requestAnimationFrame(() => {
       cards.forEach(card => {
         maxHeight = Math.max(maxHeight, card.offsetHeight);
       });
       if (maxHeight > 0) {
         cards.forEach(card => this.renderer.setStyle(card, 'height', `${maxHeight}px`));
       }
    });
  }
}
