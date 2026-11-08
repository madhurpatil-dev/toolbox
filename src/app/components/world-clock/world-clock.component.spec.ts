import { WorldClockComponent } from './world-clock.component';

describe('WorldClockComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays the selected location date and advances it at local midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T23:59:59Z'));
    const component = new WorldClockComponent(
      {} as any,
      {} as any,
      { markForCheck: vi.fn() } as any
    );
    component.timezone = 'Pacific/Kiritimati';

    component.processTime('2024-01-02T23:59:59+14:00');
    expect(component.getCurrentDate()).toBe('Tuesday, January 2, 2024');

    vi.advanceTimersByTime(1000);

    expect(component.getCurrentDate()).toBe('Wednesday, January 3, 2024');
    component.ngOnDestroy();
  });

  it('filters locations by country name and clears search after selection', () => {
    const component = new WorldClockComponent(
      {} as any,
      {} as any,
      { markForCheck: vi.fn() } as any
    );
    component.countrySearchControl.setValue('  united ');

    expect(component.filteredCountries.map((country) => country.name)).toEqual([
      'United States',
      'United Kingdom',
      'United Arab Emirates',
    ]);

    component.selectedCountryCode = 'US';
    component.onCountryChange();
    expect(component.countrySearchControl.value).toBe('');
    component.ngOnDestroy();
  });
});
