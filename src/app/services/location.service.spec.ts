import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('returns an empty city list when the API has no data for a country', async () => {
    const citiesPromise = firstValueFrom(service.getCities('Abkhazia'));

    const request = httpTestingController.expectOne(
      'https://countriesnow.space/api/v0.1/countries/cities',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ country: 'Abkhazia' });
    request.flush('Not Found', { status: 404, statusText: 'Not Found' });

    await expect(citiesPromise).resolves.toEqual({ data: [] });
  });

  it('continues to surface non-404 API errors', async () => {
    const resultPromise = firstValueFrom(
      service.getCities('Example').pipe(
        catchError((error: HttpErrorResponse) => of(error)),
      ),
    );

    const request = httpTestingController.expectOne(
      'https://countriesnow.space/api/v0.1/countries/cities',
    );
    request.flush('Server Error', {
      status: 500,
      statusText: 'Server Error',
    });

    const result = await resultPromise;
    expect(result).toBeInstanceOf(HttpErrorResponse);
    expect((result as HttpErrorResponse).status).toBe(500);
  });
});
