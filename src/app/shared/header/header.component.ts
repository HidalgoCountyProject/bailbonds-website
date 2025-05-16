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
  private minScrollDistance = 100; // Reduced from 150 to make header hide faster
  private minUpScrollDistance = 80; // Minimum continuous upward scroll to show header
  private upScrollDistance = 0; // Track continuous upward scroll distance
  private isBrowser: boolean;
  currentLanguage: Language = 'en';
  private logoAnimationInterval: any = null;
  private readonly ANIMATION_INTERVAL = 20000; // Animation interval in ms (20 seconds)

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
      
      // Initialize logo animation
      this.setupLogoAnimation();
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
  
  ngOnDestroy(): void {
    // Clear logo animation interval if it exists
    if (this.logoAnimationInterval) {
      clearInterval(this.logoAnimationInterval);
    }
  }
  
  // Set up the logo animation sequence
  private setupLogoAnimation(): void {
    if (!this.isBrowser) return;
    
    // Wait a shorter time after page load before showing first animation
    setTimeout(() => {
      // Play animation after a short delay
      this.playLogoAnimation();
      
      // Set up interval to periodically replay animation
      this.logoAnimationInterval = setInterval(() => {
        this.playLogoAnimation();
      }, this.ANIMATION_INTERVAL);
    }, 1500); // Reduced from 2500ms to 1500ms (1.5 seconds)
  }
  
  // Handle the actual animation sequence
  private playLogoAnimation(): void {
    const logoImg = document.getElementById('logo-image') as HTMLImageElement;
    if (!logoImg) return;
    
    const images = [
      'assets/images/first.png',
      'assets/images/second.png',
      'assets/images/third.png'
    ];
    
    // Start with first image
    logoImg.src = images[0];
    
    // Show second image after a delay
    setTimeout(() => {
      logoImg.src = images[1];
      
      // Show third image after another delay
      setTimeout(() => {
        logoImg.src = images[2];
        
        // We no longer return to the first image
        // Animation ends on the third image (open bars)
      }, 1200);
    }, 1200);
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
      this.upScrollDistance = 0; // Reset upward scroll distance
      return;
    }
    
    // Check scroll direction
    if (currentScroll > this.lastScrollTop) {
      // Scrolling down - track continuous scroll distance
      this.scrollDistance += (currentScroll - this.lastScrollTop);
      this.upScrollDistance = 0; // Reset upward scroll tracking when direction changes
      
      // Hide header after continuous scroll distance threshold is reached
      if (!this.headerHidden && this.scrollDistance > this.minScrollDistance) {
        const header = this.el.nativeElement.querySelector('.header');
        if (header) {
          this.renderer.addClass(header, 'header--hidden');
          this.headerHidden = true;
        }
      }
    } else {
      // Scrolling up - track continuous upward scroll
      this.scrollDistance = 0; // Reset downward scroll tracking when direction changes
      this.upScrollDistance += (this.lastScrollTop - currentScroll);
      
      // Only show header after sufficient upward scroll
      if (this.headerHidden && this.upScrollDistance > this.minUpScrollDistance) {
        const header = this.el.nativeElement.querySelector('.header');
        if (header) {
          this.renderer.removeClass(header, 'header--hidden');
          this.headerHidden = false;
          this.upScrollDistance = 0; // Reset after showing
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
