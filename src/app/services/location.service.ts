import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private countriesUrl = 'https://restcountries.com/v4/all?fields=name,cca2,flags';
  private citiesUrl = 'https://countriesnow.space/api/v0.1/countries/cities';

  constructor(private http: HttpClient) {}

  // Get list of countries
  getCountries(): Observable<any> {
    return this.http.get(this.countriesUrl);
  }

  // Get cities based on selected country
  getCities(country: string): Observable<any> {
    return this.http.post(this.citiesUrl, { country: country });
  }
}
