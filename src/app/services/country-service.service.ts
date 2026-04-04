import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CountryServiceService {
  // Minimal fields for the dropdown list only
  private allCountriesUrl = 'https://restcountries.com/v4/all?fields=name,cca2,population';
  private countriesCache$: Observable<any[]> | undefined;

  constructor(private http: HttpClient) {}

  getAllCountries(): Observable<any[]> {
    if (!this.countriesCache$) {
      this.countriesCache$ = this.http.get<any[]>(this.allCountriesUrl).pipe(shareReplay(1));
    }
    return this.countriesCache$;
  }

  // NEW: fetch full details for a single country on demand
  getCountryByCode(code: string): Observable<any> {
    const url = `https://restcountries.com/v4/alpha/${code}?fields=name,cca2,population,flags,area,capital,languages,currencies,continents,coatOfArms`;
    return this.http.get<any>(url);
  }
}