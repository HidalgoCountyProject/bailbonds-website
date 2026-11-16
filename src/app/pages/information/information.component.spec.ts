import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { InformationComponent } from './information.component';

describe('InformationComponent', () => {
  let fixture: ComponentFixture<InformationComponent>;
  let component: InformationComponent;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({ section: 'courthouse' }));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    await TestBed.configureTestingModule({
      imports: [InformationComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: params.asObservable() } },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(InformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('finds staff despite accents and phones without formatting', () => {
    component.search('castaneda');
    expect(component.filteredCourts.map(court => court.name)).toEqual(['County Court #9']);
    component.search('(956) 292 7740');
    expect(component.filteredCourts.map(court => court.name)).toEqual(['County Court #8']);
  });

  it('opens one court detail panel at a time and lets it close', () => {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.court-title'));
    buttons[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.court-drawer:not([hidden])').length).toBe(1);
    buttons[4].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(buttons[4].getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.court-drawer:not([hidden])').textContent).toContain('County Court #2');
    buttons[4].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.court-drawer:not([hidden])').length).toBe(0);
  });

  it('shows a recoverable empty search state', () => {
    component.search('no such court');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty').textContent).toContain('No matching courts');
    fixture.nativeElement.querySelector('.empty button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty')).toBeNull();
    expect(component.filteredCourts.length).toBe(14);
  });

  it('supports direct jail links and displays only the published weekend time slot', () => {
    params.next(convertToParamMap({ section: 'jail' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#jail-view').hidden).toBeFalse();
    expect(fixture.nativeElement.querySelector('#courthouse-view').hidden).toBeTrue();
    const day: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    day.value = '5';
    day.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.slot').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.slot').textContent).toContain('8:00 AM – 2:00 PM');
    expect(fixture.nativeElement.querySelector('.slot').textContent).toContain('Delta Section');
    day.value = '6';
    day.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.slot').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.slot').textContent).toContain('3:00 PM – 9:00 PM');
  });

  it('retains staff extensions when generating call links', () => {
    expect(component.phoneLink('956-292-7036 Ext. 6662')).toBe('tel:+19562927036;ext=6662');
    expect(component.phoneLink('Ext. 6653', '956-292-7042')).toBe('tel:+19562927042;ext=6653');
  });

  it('updates the shareable section when choosing jail information', () => {
    fixture.nativeElement.querySelectorAll('.choice')[1].click();
    fixture.detectChanges();
    expect(component.section).toBe('jail');
    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { section: 'jail' } }));
  });
});
