import { afterNextRender, Component, DestroyRef, ElementRef, inject, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  section: Section = 'courthouse';
  query = '';
  day = 0;
  expandedCourt: Court | null = null;
  filteredCourts = COURTS;
  courtRows = this.groupCourts(COURTS);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly automaticScroll = inject(AutomaticScrollService);
  readonly languageService = inject(LanguageService);

  constructor() {
    this.destroyRef.onDestroy(() => this.automaticScroll.stop());
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.section = params.get('section') === 'jail' ? 'jail' : 'courthouse';
    });
  }

  selectSection(section: Section): void {
    this.section = section;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { section }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  search(value: string): void {
    this.query = value;
    const query = this.normalize(value.trim());
    const digits = value.replace(/\D/g, '');
    this.filteredCourts = COURTS.filter(court => {
      const content = [court.name, court.phone, court.tollFree, court.fax, court.floor, court.hours, court.mailing, court.email, ...court.staff.flat()].join(' ');
      return this.normalize(content).includes(query) ||
        (digits.length >= 3 && /^[\d\s()+.\-]+$/.test(value.trim()) && content.replace(/\D/g, '').includes(digits));
    });
    this.courtRows = this.groupCourts(this.filteredCourts);
    this.expandedCourt = null;
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


  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").toLowerCase();
  }

  private groupCourts(courts: Court[]): Court[][] {
    const rows: Court[][] = [];
    for (let index = 0; index < courts.length; index += 3) rows.push(courts.slice(index, index + 3));
    return rows;
  }
}
