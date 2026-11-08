import { WeatherComponent } from './weather.component';
import type { WeatherData } from '../../services/weather.service';

describe('WeatherComponent', () => {
  let component: WeatherComponent;

  beforeEach(() => {
    component = Object.create(WeatherComponent.prototype);
    component.temperatureUnit = 'C';
    component.weatherDetails = [];
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
});
