/// <reference types="jasmine" />

import { of } from 'rxjs';
import { FindcapitalComponent } from './findcapital.component';

describe('FindcapitalComponent', () => {
  let component: FindcapitalComponent;

  beforeEach(() => {
    component = new FindcapitalComponent(
      { findCapital: jasmine.createSpy('findCapital').and.returnValue(of(null)), fetchCountryNames: jasmine.createSpy('fetchCountryNames').and.returnValue(of([])) } as any,
      { observe: jasmine.createSpy('observe').and.returnValue(of({ breakpoints: {} })) } as any,
      { open: jasmine.createSpy('open') } as any
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
    expect(component.showResults).toBeFalse();
  });
});
