import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('maps current conditions and daily forecast data', async () => {
    const weatherPromise = firstValueFrom(service.getWeather('New York'));

    httpTestingController.expectOne('https://wttr.in/New%20York?format=j1').flush({
      current_condition: [{
        temp_C: '18',
        FeelsLikeC: '17',
        humidity: '60',
        windspeedKmph: '12',
        winddir16Point: 'NW',
        uvIndex: '4',
        weatherDesc: [{ value: 'Partly cloudy' }],
      }],
      weather: [{
        date: '2026-11-08',
        maxtempC: '21',
        mintempC: '13',
        hourly: [
          { time: '1200', chanceofrain: '10', weatherDesc: [{ value: 'Partly cloudy' }] },
          { time: '1800', chanceofrain: '35', weatherDesc: [{ value: 'Cloudy' }] },
        ],
        astronomy: [{ sunrise: '06:30 AM', sunset: '05:45 PM' }],
      }],
    });

    await expect(weatherPromise).resolves.toEqual({
      temperature: 18,
      feelsLike: 17,
      humidity: 60,
      windSpeed: 12,
      windDirection: 'NW',
      uvIndex: 4,
      sunrise: '06:30 AM',
      sunset: '05:45 PM',
      description: 'Partly cloudy',
      forecast: [{
        date: '2026-11-08',
        high: 21,
        low: 13,
        description: 'Partly cloudy',
        chanceOfRain: 35,
      }],
    });
  });
});
