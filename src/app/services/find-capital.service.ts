import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FindCapitalService {
  private apiUrl = 'https://restcountries.com/v4/name/';
  private countryNamesCache: string[] = [];

  constructor(private http: HttpClient) { }

  findCapital(countryName: string): Observable<any> {
    const url = `${this.apiUrl}${countryName}`;
    return this.http.get(url);
  }

  fetchCountryNames(): Observable<string[]> {
    if (this.countryNamesCache.length > 0) {
      return of(this.countryNamesCache); // Return cached data if available
    } else {
      const apiUrl = 'https://restcountries.com/v4/all?fields=name';
      return this.http.get<any[]>(apiUrl).pipe(
        tap(data => {
          this.countryNamesCache = data.map(country => country.name.common);
          this.countryNamesCache.unshift('India/Bharat');
        }),
        catchError(error => {
          return of([]);
        })
      );
    }
  }
}
