import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CountryServiceService {
  private readonly BASE_URL = 'https://api.restcountries.com/countries/v5';
  private readonly API_KEY = 'rc_live_960b8d0b0dc84a30b10577a8f29dbc9c';
  private countriesCache$: Observable<any[]> | undefined;
  private countryDetailCache: Map<string, any> = new Map();

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-API-Key': this.API_KEY });
  }

  constructor(private http: HttpClient) {}

  getAllCountries(): Observable<any[]> {
    if (!this.countriesCache$) {
      this.countriesCache$ = this.fetchAllPages().pipe(shareReplay(1));
    }
    return this.countriesCache$;
  }

  private fetchAllPages(): Observable<any[]> {
    const fields = 'names.common,codes.alpha_2,population';
    const limit = 100;
    const opts = { headers: this.authHeaders };

    const page1 = this.http.get<any>(`${this.BASE_URL}?response_fields=${fields}&limit=${limit}&offset=0`, opts);
    const page2 = this.http.get<any>(`${this.BASE_URL}?response_fields=${fields}&limit=${limit}&offset=100`, opts);
    const page3 = this.http.get<any>(`${this.BASE_URL}?response_fields=${fields}&limit=${limit}&offset=200`, opts);

    return forkJoin([page1, page2, page3]).pipe(
      map(([r1, r2, r3]) => [
        ...r1.data.objects,
        ...r2.data.objects,
        ...r3.data.objects
      ])
    );
  }

  getCountryByCode(code: string): Observable<any> {
    if (this.countryDetailCache.has(code)) {
      return of(this.countryDetailCache.get(code));
    }

    const fields = 'names.common,codes.alpha_2,population,flag,area,capitals,languages,currencies,continents,coat_of_arms';
    const url = `${this.BASE_URL}/codes.alpha_2/${code}?response_fields=${fields}`;
    return this.http.get<any>(url, { headers: this.authHeaders }).pipe(
      map(response => response.data.objects[0]),
      tap(detail => this.countryDetailCache.set(code, detail))
    );
  }
}