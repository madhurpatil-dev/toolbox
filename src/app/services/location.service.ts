import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CountryRecord, CountryServiceService } from './country-service.service';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly citiesUrl = 'https://countriesnow.space/api/v0.1/countries/cities';

  constructor(
    private readonly http: HttpClient,
    private readonly countryService: CountryServiceService,
  ) {}

  getCountries(): Observable<CountryRecord[]> {
    return this.countryService.getAllCountries();
  }

  getCities(country: string): Observable<any> {
    return this.http.post<any>(this.citiesUrl, { country }).pipe(
      map((response) => ({
        ...response,
        data: Array.isArray(response?.data) ? response.data : [],
      })),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of({ data: [] });
        }

        return throwError(() => error);
      }),
    );
  }
}