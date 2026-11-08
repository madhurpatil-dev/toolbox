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
    const pages = [0, 100, 200].map((offset) =>
      httpTestingController.expectOne(
        (request) =>
          request.urlWithParams.startsWith(
            'https://api.restcountries.com/countries/v5?',
          ) &&
          request.urlWithParams.includes(`offset=${offset}`) &&
          request.urlWithParams.includes('limit=100') &&
          request.urlWithParams.includes(
            'response_fields=names.common,codes.alpha_2,population',
          ),
      ),
    );

    pages[0].flush({
      data: {
        objects: Array.from({ length: 100 }, (_, index) => ({
          names: { common: `Country ${index}` },
          codes: { alpha_2: `A${index}` },
          population: index + 1,
        })),
      },
    });
    pages[1].flush({
      data: {
        objects: Array.from({ length: 100 }, (_, index) => ({
          names: { common: `Country ${index + 100}` },
          codes: { alpha_2: `B${index}` },
          population: index + 101,
        })),
      },
    });
    pages[2].flush({
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

  it('returns the fallback country list if a page request fails', async () => {
    const countriesPromise = firstValueFrom(service.getAllCountries());
    const pages = [0, 100, 200].map((offset) =>
      httpTestingController.expectOne(
        (request) => request.urlWithParams.includes(`offset=${offset}`),
      ),
    );

    pages[0].flush({ data: { objects: [] } });
    pages[1].flush({ data: { objects: [] } });
    pages[2].flush('Server Error', {
      status: 500,
      statusText: 'Server Error',
    });

    const countries = await countriesPromise;
    expect(countries.length).toBeGreaterThan(20);
    expect(
      countries.some(
        (country) =>
          country.names.common === 'India' && country.codes.alpha_2 === 'IN',
      ),
    ).toBe(true);
  });

  it('returns the fallback country list when the API response has no usable countries', async () => {
    const countriesPromise = firstValueFrom(service.getAllCountries());
    [0, 100, 200].forEach((offset) => {
      httpTestingController
        .expectOne((request) =>
          request.urlWithParams.includes(`offset=${offset}`),
        )
        .flush({ data: { objects: [] } });
    });

    const countries = await countriesPromise;
    expect(countries.length).toBeGreaterThan(20);
    expect(countries.some((country) => country.names.common === 'India')).toBe(
      true,
    );
  });
});
