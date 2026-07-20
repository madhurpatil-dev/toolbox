import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly BASE_URL = 'https://api.restcountries.com/countries/v5';
  private readonly API_KEY = 'rc_live_960b8d0b0dc84a30b10577a8f29dbc9c';
  private citiesUrl = 'https://countriesnow.space/api/v0.1/countries/cities';

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-API-Key': this.API_KEY });
  }

  constructor(private http: HttpClient) {}

  getCountries(): Observable<any> {
    const opts = { headers: this.authHeaders };
    const page1 = this.http.get<any>(`${this.BASE_URL}?response_fields=names.common&limit=100&offset=0`, opts);
    const page2 = this.http.get<any>(`${this.BASE_URL}?response_fields=names.common&limit=100&offset=100`, opts);
    const page3 = this.http.get<any>(`${this.BASE_URL}?response_fields=names.common&limit=100&offset=200`, opts);

    return forkJoin([page1, page2, page3]).pipe(
      map(([r1, r2, r3]: any) => [
        ...r1.data.objects,
        ...r2.data.objects,
        ...r3.data.objects,
      ])
    );
  }

  getCities(country: string): Observable<any> {
    return this.http.post(this.citiesUrl, { country });
  }
}