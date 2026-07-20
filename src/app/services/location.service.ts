import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly BASE_URL = 'https://api.restcountries.com/countries/v5';
  private readonly API_KEY = 'rc_live_960b8d0b0dc84a30b10577a8f29dbc9c';
  private citiesUrl = 'https://countriesnow.space/api/v0.1/countries/cities';

  constructor(private http: HttpClient) {}

  getCountries(): Observable<any> {
    const url = `${this.BASE_URL}?response_fields=names.common,codes.alpha_2,flag&limit=100&api-key=${this.API_KEY}`;
    // fetch all 3 pages and merge — same pattern as CountryServiceService
    const page1 = this.http.get<any>(`${this.BASE_URL}?response_fields=names.common&limit=100&offset=0&api-key=${this.API_KEY}`);
    const page2 = this.http.get<any>(`${this.BASE_URL}?response_fields=names.common&limit=100&offset=100&api-key=${this.API_KEY}`);
    const page3 = this.http.get<any>(`${this.BASE_URL}?response_fields=names.common&limit=100&offset=200&api-key=${this.API_KEY}`);

    return new Observable(observer => {
      Promise.all([
        page1.toPromise(),
        page2.toPromise(),
        page3.toPromise()
      ]).then(([r1, r2, r3]: any) => {
        const all = [...r1.data.objects, ...r2.data.objects, ...r3.data.objects];
        observer.next(all);
        observer.complete();
      }).catch(err => observer.error(err));
    });
  }

  getCities(country: string): Observable<any> {
    return this.http.post<any>(this.citiesUrl, { country }).pipe(
      map((response) => ({
        ...response,
        data: Array.isArray(response?.data) ? response.data : [],
      })),
    );
  }
}