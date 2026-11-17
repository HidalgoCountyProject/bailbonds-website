import { afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { COURTS, Court, VISITATION, VISITATION_SLOT_HOURS } from './information.data';
import { AutomaticScrollService } from '../../shared/services/automatic-scroll.service';
import { LanguageService } from '../../shared/services/language.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  dayTranslationKeys,
  localizeFloor,
  localizeOfficeHours,
  localizeStaffRole,
  localizeVisitItem,
  localizeVisitLocationHeading
} from './information.localize';

type Section = 'jail' | 'courthouse';

@Component({
  selector: 'app-information',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.css']
})
export class InformationComponent {
  readonly directoryUrl = 'https://www.hidalgocounty.us/m/directory/department?did=139';
  readonly detentionUrl = 'https://www.hidalgocounty.us/3007/Detention';
  readonly inmateCommunicationUrl =
    'https://www.hidalgocounty.us/3007/Detention#docaccess-bbc76a7f22f869aa322b865d2d70a10094838f3c3acdc2677187d3c24b482b00';
  readonly dayKeys = dayTranslationKeys();
  readonly visitation = VISITATION;
  readonly visitationSlotHours = VISITATION_SLOT_HOURS;
  readonly localizeFloor = localizeFloor;
  readonly localizeOfficeHours = localizeOfficeHours;
  readonly localizeStaffRole = localizeStaffRole;
  readonly localizeVisitItem = localizeVisitItem;
  readonly localizeVisitLocationHeading = localizeVisitLocationHeading;
  section: Section | null = 'courthouse';
  contentVisible = true;
  sectionEnter: 'left' | 'right' | null = null;
  day = 0;
  expandedCourt: Court | null = null;
  readonly courtRows = this.groupCourts(COURTS);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly automaticScroll = inject(AutomaticScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly languageService = inject(LanguageService);

  private static readonly mobileMedia = '(max-width: 740px)';

  constructor() {
    this.destroyRef.onDestroy(() => this.automaticScroll.stop());
    if (isPlatformBrowser(this.platformId)) {
      this.applySectionFromRoute(this.route.snapshot?.queryParamMap.get('section') ?? null);
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.applySectionFromRoute(params.get('section'));
    });
  }

  get awaitingSectionChoice(): boolean {
    return !this.contentVisible;
  }

  selectSection(section: Section): void {
    if (this.section !== section) {
      this.sectionEnter = section === 'courthouse' ? 'left' : 'right';
    }
    this.section = section;
    this.contentVisible = true;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { section }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private applySectionFromRoute(param: string | null): void {
    if (param === 'jail') {
      this.section = 'jail';
      this.contentVisible = true;
      return;
    }
    if (param === 'courthouse') {
      this.section = 'courthouse';
      this.contentVisible = true;
      return;
    }
    if (!this.isMobileViewport()) {
      this.section = 'courthouse';
      this.contentVisible = true;
      return;
    }
    this.contentVisible = false;
    this.section = null;
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(InformationComponent.mobileMedia).matches;
  }

  toggleCourt(court: Court): void {
    this.expandedCourt = this.expandedCourt === court ? null : court;
    if (!this.expandedCourt) return;

    // Wait until the old panel closes and the new panel has its final position.
    // Render callbacks run only in the browser, not during server rendering.
    afterNextRender(() => {
      if (this.expandedCourt !== court || !window.matchMedia('(max-width: 740px)').matches) return;
      const details = this.host.nativeElement.querySelector<HTMLElement>(`#court-details-${this.courtId(court)}`);
      if (!details) return;
      this.automaticScroll.scrollTo(details, {
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      });
    }, { injector: this.injector });
  }

  courtId(court: Court): number { return COURTS.indexOf(court); }

  formatPhone(phone: string): string {
    return phone.replace(/^\(?(\d{3})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})/, '($1) $2-$3');
  }

  phoneLink(phone: string, fallback = ''): string {
    const extension = phone.match(/ext\.?\s*(\d+)/i)?.[1];
    const number = phone.split(/ext/i)[0].replace(/\D/g, '') || fallback.replace(/\D/g, '');
    return `tel:+1${number}${extension ? ';ext=' + extension : ''}`;
  }

  directions(address: string): string {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  }

  selectVisitDay(index: number): void {
    this.day = index;
  }

  visitationSlotsForDay(dayIndex: number): number {
    return this.visitation[dayIndex].filter(slot => slot !== null).length;
  }

  get lang() {
    return this.languageService.getCurrentLanguage();
  }

  private groupCourts(courts: Court[]): Court[][] {
    const rows: Court[][] = [];
    for (let index = 0; index < courts.length; index += 3) rows.push(courts.slice(index, index + 3));
    return rows;
  }
}
