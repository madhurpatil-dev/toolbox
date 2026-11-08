import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppModule } from '../../app.module';
import { FindcapitalComponent } from './findcapital.component';

describe('FindcapitalComponent', () => {
  let component: FindcapitalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppModule] }).compileComponents();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    component = new FindcapitalComponent(
      { findCapital: vi.fn().mockReturnValue(of(null)), fetchCountryNames: vi.fn().mockReturnValue(of([])) } as any,
      { observe: vi.fn().mockReturnValue(of({ breakpoints: {} })) } as any,
      { open: vi.fn() } as any,
      { markForCheck: vi.fn(), detectChanges: vi.fn() } as any,
    );
  });

  it('should clear results when no country is selected', () => {
    component.selectedCountry = 'India';
    component.capital = 'New Delhi';
    component.countryFlag = 'flag.png';
    component.countryInfo = { population: 1 };
    component.error = 'Previous error';
    component.showResults = true;

    component.selectedCountry = '';
    component.onCountrySelected();

    expect(component.capital).toBe('');
    expect(component.countryFlag).toBe('');
    expect(component.countryInfo).toBeNull();
    expect(component.error).toBe('');
    expect(component.showResults).toBe(false);
  });

  it('filters countries without changing the capital search selection flow', () => {
    component.countryNames = ['Canada', 'India', 'United States'];
    component.countrySearchControl.setValue('  ind ');

    expect(component.filteredCountryNames).toEqual(['India']);

    component.onCountrySelected('India');
    expect(component.selectedCountry).toBe('India');
    expect(component.countrySearchControl.value).toBe('');
  });
});
