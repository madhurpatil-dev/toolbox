import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CountryServiceService } from '../../services/country-service.service';
import {
  ChartCardComponent,
  CountryCardComponent,
  CountrySearchComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  SkeletonLoaderComponent,
  StatCardComponent,
} from './countries-ui.components';
import { CountriesComponent } from './countries.component';

describe('CountriesComponent', () => {
  let component: CountriesComponent;
  let fixture: ComponentFixture<CountriesComponent>;
  const countries = ['IN', 'US', 'CN', 'BR'].map((code, index) => ({
    names: { common: `Country ${code}` },
    codes: { alpha_2: code },
    population: 1000 - index * 100,
  }));
  const countryService = {
    getAllCountries: vi.fn(),
    getCountryByCode: vi.fn(),
  } as unknown as CountryServiceService;

  beforeEach(async () => {
    vi.mocked(countryService.getAllCountries).mockReturnValue(of(countries));
    vi.mocked(countryService.getCountryByCode).mockReturnValue(of({ population: 1000 }));
    await TestBed.configureTestingModule({
      imports: [
        CountriesComponent,
        CommonModule,
        FormsModule,
        ChartCardComponent,
        CountryCardComponent,
        CountrySearchComponent,
        EmptyStateComponent,
        ErrorStateComponent,
        SkeletonLoaderComponent,
        StatCardComponent,
      ],
      providers: [{ provide: CountryServiceService, useValue: countryService }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('limits comparisons to three countries', () => {
    component.toggleComparedCountry('IN');
    component.toggleComparedCountry('US');
    component.toggleComparedCountry('CN');
    component.toggleComparedCountry('BR');

    expect(component.comparedCodes).toEqual(['IN', 'US', 'CN']);
    expect(component.comparisonMessage).toContain('up to three');
  });

  it('selects the active autocomplete option with the keyboard', () => {
    const search = new CountrySearchComponent();
    search.countries = [{ code: 'IN', name: 'India', population: 1000 }];
    const selected = vi.spyOn(search.countrySelected, 'emit');

    search.onInput({ target: { value: 'Ind' } } as unknown as Event);
    search.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    search.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(selected).toHaveBeenCalledWith('IN');
    expect(search.isOpen).toBe(false);
  });
});
