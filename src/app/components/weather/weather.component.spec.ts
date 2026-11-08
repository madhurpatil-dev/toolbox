import { FormControl } from '@angular/forms';
import type { WeatherData } from '../../services/weather.service';
import { WeatherComponent } from './weather.component';

describe('WeatherComponent', () => {
  let component: WeatherComponent;

  beforeEach(() => {
    component = Object.create(WeatherComponent.prototype);
    component.temperatureUnit = 'C';
    component.weatherDetails = [];
    Object.defineProperties(component, {
      countrySearchControl: { value: new FormControl('', { nonNullable: true }) },
      citySearchControl: { value: new FormControl('', { nonNullable: true }) },
    });
    component.weatherData = {
      temperature: 20,
      feelsLike: 19,
      humidity: 55,
      windSpeed: 10,
      windDirection: 'NW',
      uvIndex: 7,
      sunrise: '06:30 AM',
      sunset: '05:45 PM',
      description: 'Partly cloudy',
      forecast: [],
    } satisfies WeatherData;
  });

  it('switches between Celsius and Fahrenheit without changing stored temperatures', () => {
    expect(component.formatTemperature(component.weatherData!.temperature)).toBe(20);

    component.toggleTemperatureUnit();

    expect(component.temperatureUnit).toBe('F');
    expect(component.formatTemperature(component.weatherData!.temperature)).toBe(68);
    expect(component.weatherData!.temperature).toBe(20);
  });

  it('describes UV exposure using standard risk bands', () => {
    expect(component.uvRiskLevel).toBe('High');
    component.weatherData!.uvIndex = 9;
    expect(component.uvRiskLevel).toBe('Very high');
  });

  it('filters countries and cities by a case-insensitive search term', () => {
    component.countries = ['Canada', 'India', 'United States'];
    component.cities = ['New Delhi', 'New York', 'Toronto'];
    component.countrySearchControl.setValue('  INd ');
    component.citySearchControl.setValue('new');

    expect(component.filteredCountries).toEqual(['India']);
    expect(component.filteredCities).toEqual(['New Delhi', 'New York']);
  });
});
