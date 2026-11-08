import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface WttrWeatherPeriod {
  time?: string;
  chanceofrain?: string;
  weatherDesc?: Array<{ value?: string }>;
}

interface WttrWeatherDay {
  date?: string;
  maxtempC?: string;
  mintempC?: string;
  hourly?: WttrWeatherPeriod[];
  astronomy?: Array<{ sunrise?: string; sunset?: string }>;
}

interface WttrResponse {
  current_condition?: Array<{
    temp_C?: string;
    FeelsLikeC?: string;
    humidity?: string;
    windspeedKmph?: string;
    winddir16Point?: string;
    uvIndex?: string;
    weatherDesc?: Array<{ value?: string }>;
  }>;
  weather?: WttrWeatherDay[];
}

export interface WeatherForecastDay {
  date: string;
  high: number;
  low: number;
  description: string;
  chanceOfRain: number | null;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  description: string;
  forecast: WeatherForecastDay[];
}

function parseWeatherNumber(value: string | undefined, field: string): number {
  const parsed = Number(value);
  if (!value?.trim() || !Number.isFinite(parsed)) {
    throw new Error(`The weather service returned an invalid ${field}.`);
  }
  return parsed;
}

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly apiUrl = 'https://wttr.in';

  constructor(private http: HttpClient) {}

  getWeather(city: string): Observable<WeatherData> {
    return this.http.get<WttrResponse>(`${this.apiUrl}/${encodeURIComponent(city)}?format=j1`).pipe(
      map((data) => {
        const current = data.current_condition?.[0];
        if (!current) throw new Error('The weather service returned no current conditions.');

        const forecast = (data.weather ?? []).flatMap((day): WeatherForecastDay[] => {
          const high = Number(day.maxtempC);
          const low = Number(day.mintempC);
          if (!day.date || !Number.isFinite(high) || !Number.isFinite(low)) return [];

          const hourly = day.hourly ?? [];
          const midday = hourly.find((period) => {
            const hour = Number(period.time ?? '0') / 100;
            return hour >= 11 && hour <= 14;
          }) ?? hourly[0];
          const rainChances = hourly.flatMap((period) => {
            const chance = period.chanceofrain?.trim();
            if (!chance) return [];
            const parsedChance = Number(chance);
            return Number.isFinite(parsedChance) ? [parsedChance] : [];
          });
          const description = midday?.weatherDesc?.[0]?.value;

          return [{
            date: day.date,
            high,
            low,
            description: description ?? 'Conditions unavailable',
            chanceOfRain: rainChances.length ? Math.max(...rainChances) : null,
          }];
        });

        return {
          temperature: parseWeatherNumber(current.temp_C, 'temperature'),
          feelsLike: parseWeatherNumber(current.FeelsLikeC, 'feels-like temperature'),
          humidity: parseWeatherNumber(current.humidity, 'humidity'),
          windSpeed: parseWeatherNumber(current.windspeedKmph, 'wind speed'),
          windDirection: current.winddir16Point ?? '',
          uvIndex: parseWeatherNumber(current.uvIndex, 'UV index'),
          sunrise: data.weather?.[0]?.astronomy?.[0]?.sunrise ?? 'Unavailable',
          sunset: data.weather?.[0]?.astronomy?.[0]?.sunset ?? 'Unavailable',
          description: current.weatherDesc?.[0]?.value ?? 'Unknown conditions',
          forecast,
        };
      }),
    );
  }
}
