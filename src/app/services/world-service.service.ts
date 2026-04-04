import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WorldTimeService {
  private apiUrl = 'https://timeapi.io/api/Time/current/zone?timeZone=';
  private cache: { [key: string]: Observable<any> } = {};

  constructor(private http: HttpClient) {}

  getTimeByCountry(countryCode: string): Observable<any> {
    if (this.cache[countryCode]) {
      return this.cache[countryCode];
    }

    this.cache[countryCode] = this.http.get(`${this.apiUrl}${countryCode}`).pipe(
      map((data: any) => ({
        datetime: data.dateTime,
        timezone: data.timeZone
      })),
      catchError(error => {
        return throwError(() => new Error('Failed to fetch time'));
      }),
      shareReplay(1) // Cache the response
    );

    return this.cache[countryCode];
  }
}