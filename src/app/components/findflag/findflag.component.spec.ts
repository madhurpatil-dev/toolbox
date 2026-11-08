import { FindflagComponent } from './findflag.component';

describe('FindflagComponent', () => {
  it('filters countries by the displayed country name and clears search on selection', () => {
    const component = new FindflagComponent(
      {} as any,
      {} as any,
      {} as any,
      { detectChanges: vi.fn() } as any,
    );
    component.countrySearchControl.setValue('  united ');

    expect(component.filteredCountries.length).toBeGreaterThan(0);
    expect(component.filteredCountries.every((country) => country.display.toLowerCase().includes('united'))).toBe(true);

    component.selectedCountry = 'United States';
    component.onCountrySelected();
    expect(component.countrySearchControl.value).toBe('');
  });
});
