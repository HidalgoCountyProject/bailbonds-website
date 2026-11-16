import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface GoogleReview {
  name: string;
  photo: string;
  rating: number;
  date: string;
  text: string;
  language: string;
  opinions: string;
  isNew?: boolean;
  hasPhoto?: boolean;
}

@Component({
  selector: 'app-google-reviews',
  templateUrl: './google-reviews.component.html',
  styleUrls: ['./google-reviews.component.css'],
  standalone: true,
  imports: [CommonModule, TranslatePipe]
})
export class GoogleReviewsComponent implements OnInit, AfterViewInit {
  @ViewChild('reviewsCarousel') reviewsCarousel!: ElementRef;
  
  currentIndex = 0;
  cardsPerView = 3;
  private isBrowser: boolean;
  
  reviews: GoogleReview[] = [
    {
      name: 'Emyly Alaniz',
      photo: 'E',
      rating: 5,
      date: 'Hace 5 meses',
      text: 'Rosie made my experience here go so smooth.. Let\'s be honest it\'s never a fun experience having to come to these places. Rosie\'s grace towards me put me at ease and I walked out with so much peace!! Thank you for everything Rosie!',
      language: 'español',
      opinions: '3 opiniones'
    },
    {
      name: 'Samantha Gamez',
      photo: 'S',
      rating: 5,
      date: 'Hace 5 meses',
      text: 'Great services definitely recommend & very trustworthy',
      language: 'español',
      opinions: '2 opiniones'
    },
    {
      name: 'Neyda Jimenez',
      photo: 'N',
      rating: 5,
      date: 'Hace 7 meses',
      text: 'Had a great experience here, people at the office had great customer service. Was in & out quick, they know what they\'re doing.',
      language: 'español',
      opinions: '4 opiniones, 1 foto',
      hasPhoto: true
    },
    {
      name: 'Jose Guerrero',
      photo: 'J',
      rating: 5,
      date: 'Hace 1 hora',
      text: 'Rápidos, profesionales y de gran ayuda en un momento difícil. Este servicio de fianzas superó mi expectativas, tuve un problema con mi sobrino y necesitaba ayuda inmediatamente, gracias a AFFORDABLE BAIL BONDS me ayudó a sacar a mi sobrino y a un buen precio también. Totalmente recomendados y dios bendiga que no pero si necesito que sacar a mi primo otra vez definitivamente volveré.',
      language: 'español',
      opinions: '1 opinión',
      isNew: true
    },
    {
      name: 'yare',
      photo: 'Y',
      rating: 5,
      date: 'Hace 2 horas',
      text: 'I was really overwhelmed when I had to deal with posting bail for a loved one, but [Affordable Bail Bonds] made the whole experience so much easier. They were upfront about the costs, didn\'t try to upsell anything, and worked out a payment plan that fit my situation. The staff was super understanding and kind, which honestly made all the difference. You don\'t expect to need a bail bondsman, but if you ever do, this is the team you want on your side.',
      language: 'español',
      opinions: '1 opinión, 1 foto',
      hasPhoto: true,
      isNew: true
    },
    {
      name: 'Gael Santana',
      photo: 'G',
      rating: 5,
      date: 'Hace 6 meses',
      text: 'The best Bailbonds in the valley🙏🔥❤',
      language: 'español',
      opinions: '3 opiniones, 1 foto',
      hasPhoto: true
    },
    {
      name: 'flaco perez',
      photo: 'F',
      rating: 5,
      date: 'Hace un año',
      text: 'Fast and friendly service!! I recommend them to everyone I know. THE BEST IN THE VALLEY!!',
      language: 'español',
      opinions: 'Local Guide, 31 opiniones, 27 fotos',
      hasPhoto: true
    },
    {
      name: 'Saul Ruiz',
      photo: 'S',
      rating: 5,
      date: 'Hace 11 meses',
      text: 'Very helpful with detailed information they gave me with my bail bond rules Great Customer Service',
      language: 'español',
      opinions: '1 opinión'
    },
    {
      name: 'David Morales',
      photo: 'D',
      rating: 5,
      date: 'Hace 10 meses',
      text: 'Gladly appreciate the service they provided me with',
      language: 'español',
      opinions: '12 opiniones, 3 fotos',
      hasPhoto: true
    }
  ];

  shuffledReviews: GoogleReview[] = [];
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.shuffleReviews();
    
    // Set cards per view based on screen width
    if (this.isBrowser) {
      this.updateCardsPerView();
      window.addEventListener('resize', () => {
        this.updateCardsPerView();
        setTimeout(() => this.equalizeCardHeights(), 300);
      });
    }
  }
  
  ngAfterViewInit(): void {
    // After view is initialized, make sure cards are equal height
    if (this.isBrowser) {
      setTimeout(() => this.equalizeCardHeights(), 300);
    }
  }

  // Fisher-Yates shuffle algorithm to randomize reviews
  shuffleReviews(): void {
    this.shuffledReviews = [...this.reviews];
    for (let i = this.shuffledReviews.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledReviews[i], this.shuffledReviews[j]] = 
      [this.shuffledReviews[j], this.shuffledReviews[i]];
    }
  }
  
  // Make all review cards equal height
  equalizeCardHeights(): void {
    if (!this.isBrowser) return;
    
    const cards = document.querySelectorAll('.review-card') as NodeListOf<HTMLElement>;
    if (!cards || cards.length === 0) return;
    
    // Reset heights to auto to measure true content height
    cards.forEach(card => {
      card.style.height = 'auto';
    });
    
    // Find the tallest card
    let maxHeight = 0;
    cards.forEach(card => {
      maxHeight = Math.max(maxHeight, card.offsetHeight);
    });
    
    // Set all cards to the height of the tallest
    if (maxHeight > 0) {
      cards.forEach(card => {
        card.style.height = `${maxHeight}px`;
      });
    }
  }
  
  // Navigation functions for the carousel
  prevReview(): void {
    if (!this.isBrowser) return;
    
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.scrollToCurrentIndex();
    } else {
      // Loop back to the end
      this.currentIndex = this.shuffledReviews.length - this.cardsPerView;
      this.scrollToCurrentIndex();
    }
  }
  
  nextReview(): void {
    if (!this.isBrowser) return;
    
    if (this.currentIndex < this.shuffledReviews.length - this.cardsPerView) {
      this.currentIndex++;
      this.scrollToCurrentIndex();
    } else {
      // Loop back to the beginning
      this.currentIndex = 0;
      this.scrollToCurrentIndex();
    }
  }
  
  // Scroll the carousel to show cards at current index
  scrollToCurrentIndex(): void {
    if (!this.isBrowser) return;
    
    const container = document.querySelector('.reviews-carousel') as HTMLElement;
    if (container) {
      const cards = container.querySelectorAll('.review-card');
      if (cards.length > this.currentIndex) {
        const card = cards[this.currentIndex] as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const offset = cardRect.left - containerRect.left + container.scrollLeft;
        
        container.scrollTo({
          left: offset,
          behavior: 'smooth'
        });
      }
    }
  }
  
  // Update cards per view based on screen width
  updateCardsPerView(): void {
    if (!this.isBrowser) return;
    
    if (window.innerWidth >= 992) {
      this.cardsPerView = 3;
    } else if (window.innerWidth >= 768) {
      this.cardsPerView = 2;
    } else {
      this.cardsPerView = 1;
    }
    
    // Adjust currentIndex if needed
    if (this.currentIndex > this.shuffledReviews.length - this.cardsPerView) {
      this.currentIndex = this.shuffledReviews.length - this.cardsPerView;
      if (this.currentIndex < 0) this.currentIndex = 0;
    }
  }
} 