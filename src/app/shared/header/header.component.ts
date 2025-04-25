import { Component, OnInit, HostListener, Renderer2, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { LanguageService, Language } from '../services/language.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { trigger, transition, style, animate } from '@angular/animations';
import { PopupService } from '../../services/popup.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, NgClass, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, AfterViewInit {
  isMobileMenuOpen = false;
  showLanguagePrompt = false;
  private lastScrollTop = 0;
  private headerHidden = false;
  private scrollThreshold = 100; // Minimum scroll before header can hide
  private scrollDistance = 0; // Track continuous scroll distance
  private minScrollDistance = 150; // Minimum continuous scroll distance to hide header
  private isBrowser: boolean;
  currentLanguage: Language = 'en';

  constructor(
    private renderer: Renderer2, 
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private languageService: LanguageService,
    private popupService: PopupService
  ) { 
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
    
    // Always show the language prompt initially
    if (this.isBrowser) {
      // Slight delay to ensure page has loaded
      setTimeout(() => {
        this.displayLanguagePrompt();
      }, 1500);
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Set header height as CSS variable
      this.updateHeaderHeight();
      // Also update on window resize
      window.addEventListener('resize', this.updateHeaderHeight.bind(this));
      
      // Initial update to ensure content positioning
      setTimeout(() => this.updateHeaderHeight(), 100);
    }
  }

  displayLanguagePrompt(): void {
    console.log('Showing language prompt');
    this.showLanguagePrompt = true;
    
    // Auto-dismiss after 12 seconds if not interacted with
    setTimeout(() => {
      if (this.showLanguagePrompt) {
        this.dismissLanguagePrompt();
      }
    }, 12000);
  }

  toggleLanguage(event: Event): void {
    event.preventDefault();
    this.languageService.toggleLanguage();
    this.dismissLanguagePrompt();
  }

  dismissLanguagePrompt(): void {
    this.showLanguagePrompt = false;
  }

  private updateHeaderHeight(): void {
    if (this.isBrowser) {
      const header = this.el.nativeElement.querySelector('.header');
      if (header) {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
      }
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Update header height after menu toggle
    if (this.isBrowser) {
      setTimeout(() => this.updateHeaderHeight(), 50);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;
    
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Don't hide header until user has scrolled past threshold
    if (currentScroll < this.scrollThreshold) {
      if (this.headerHidden) {
        const header = this.el.nativeElement.querySelector('.header');
        if (header) {
          this.renderer.removeClass(header, 'header--hidden');
          this.headerHidden = false;
        }
      }
      this.scrollDistance = 0; // Reset scroll distance
      return;
    }
    
    // Check scroll direction
    if (currentScroll > this.lastScrollTop) {
      // Scrolling down - track continuous scroll distance
      this.scrollDistance += (currentScroll - this.lastScrollTop);
      
      // Hide header after continuous scroll distance threshold is reached
      if (!this.headerHidden && this.scrollDistance > this.minScrollDistance) {
        const header = this.el.nativeElement.querySelector('.header');
        if (header) {
          this.renderer.addClass(header, 'header--hidden');
          this.headerHidden = true;
        }
      }
    } else {
      // Scrolling up - immediately show header and reset scroll distance
      this.scrollDistance = 0;
      
      if (this.headerHidden) {
        const header = this.el.nativeElement.querySelector('.header');
        if (header) {
          this.renderer.removeClass(header, 'header--hidden');
          this.headerHidden = false;
        }
      }
    }
    
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // For Mobile or negative scrolling
  }

  // Método para abrir el popup de callback
  openCallbackPopup(): void {
    this.popupService.openCallbackPopup();
  }
}
