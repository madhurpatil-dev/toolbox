import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FindCapitalService {
  private readonly BASE_URL = 'https://api.restcountries.com/countries/v5';
  private readonly API_KEY = 'rc_live_960b8d0b0dc84a30b10577a8f29dbc9c';
  private countryNamesCache: string[] = [];

  constructor(private http: HttpClient) { }

  findCapital(countryName: string): Observable<any> {
    const url = `${this.BASE_URL}/names.common/${encodeURIComponent(countryName)}?api-key=${this.API_KEY}`;
    return this.http.get<any>(url);
  }

  fetchCountryNames(): Observable<string[]> {
    if (this.countryNamesCache.length > 0) {
      return of(this.countryNamesCache);
    }

    const url = `${this.BASE_URL}?response_fields=names.common&limit=100&api-key=${this.API_KEY}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        const names: string[] = response.data.objects.map(
          (country: any) => country.names.common
        );
        names.unshift('India/Bharat');
        this.countryNamesCache = names;
        return names;
      }),
      catchError(() => of([]))
    );
  }
}
