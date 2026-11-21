import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CountryServiceService } from './country-service.service';

describe('CountryServiceService', () => {
  let service: CountryServiceService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('toolbox-country-list-v1');
    localStorage.removeItem('toolbox-country-details-v1');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CountryServiceService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('loads country names, codes, and populations across all API pages', async () => {
    const countriesPromise = firstValueFrom(service.getAllCountries());
    const firstPage = httpTestingController.expectOne(
      (request) => request.params.get('offset') === '0',
    );
    expect(firstPage.request.url).toBe('/.netlify/functions/countries');
    expect(firstPage.request.params.get('action')).toBe('list');
    expect(firstPage.request.params.get('limit')).toBe('100');
    expect(firstPage.request.urlWithParams).not.toContain('api-key');
    firstPage.flush({
      data: {
        objects: Array.from({ length: 100 }, (_, index) => ({
          names: { common: `Country ${index}` },
          codes: { alpha_2: `A${index}` },
          population: index + 1,
        })),
        meta: { total: 250 },
      },
    });
    const secondPage = httpTestingController.expectOne(
      (request) => request.params.get('offset') === '100',
    );
    const thirdPage = httpTestingController.expectOne(
      (request) => request.params.get('offset') === '200',
    );
    secondPage.flush({
      data: {
        objects: Array.from({ length: 100 }, (_, index) => ({
          names: { common: `Country ${index + 100}` },
          codes: { alpha_2: `B${index}` },
          population: index + 101,
        })),
      },
    });
    thirdPage.flush({
      data: {
        objects: Array.from({ length: 50 }, (_, index) => ({
          names: { common: `Country ${index + 200}` },
          codes: { alpha_2: `C${index}` },
          population: index + 201,
        })),
      },
    });

    const countries = await countriesPromise;
    expect(countries).toHaveLength(250);
    expect(countries[0]).toEqual({
      names: { common: 'Country 0' },
      codes: { alpha_2: 'A0' },
      population: 1,
    });
    expect(countries[249].population).toBe(250);
  });

  it('uses the bundled fallback after the API returns no usable countries', () => {
    let countries: import('./country-service.service').CountryRecord[] = [];
    service.getAllCountries().subscribe((value) => countries = value);
    httpTestingController.expectOne(
      (request) => request.params.get('offset') === '0',
    ).flush({ data: { objects: [] } });
    [0, 100, 200].forEach((offset) => {
      if (offset === 0) return;
      httpTestingController.expectOne(
        (request) => request.params.get('offset') === String(offset),
      ).flush({ data: { objects: [] } });
    });

    expect(countries.length).toBeGreaterThan(20);
    expect(countries.some((country) => country.names?.common === 'India')).toBe(true);
  });

  it('surfaces a detail failure when no fallback exists for a country', async () => {
    let requestError: unknown;
    service.getCountryByCode('ZZ').subscribe({ error: (error) => requestError = error });
    httpTestingController.expectOne(
      (request) => request.params.get('action') === 'detail' && request.params.get('code') === 'ZZ',
    ).flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(requestError).toBeTruthy();
  });
});
