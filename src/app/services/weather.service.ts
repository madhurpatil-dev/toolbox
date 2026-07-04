import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private apiUrl = 'https://wttr.in';

  constructor(private http: HttpClient) {}

  getWeather(city: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${city}?format=j1`).pipe(
      map((data) => ({
        temperature: data.current_condition[0].temp_C,
        feelsLike: data.current_condition[0].FeelsLikeC,
        humidity: data.current_condition[0].humidity,
        windSpeed: data.current_condition[0].windspeedKmph,
        uvIndex: data.current_condition[0].uvIndex,
        sunrise: data.weather[0].astronomy[0].sunrise,
        sunset: data.weather[0].astronomy[0].sunset,
        description: data.current_condition[0].weatherDesc[0].value,
      })),
    );
  }
}
