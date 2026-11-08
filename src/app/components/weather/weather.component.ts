import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { WeatherService, type WeatherData } from '../../services/weather.service';
import { LocationService } from '../../services/location.service';
import { Chart, registerables, type Chart as ChartInstance } from 'chart.js';

interface WeatherDetail {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
}

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css'],
  standalone: false,
})
export class WeatherComponent implements OnInit, OnDestroy {
  countries: string[] = [];
  cities: string[] = [];
  selectedCountry: string = '';
  selectedCity: string = '';
  readonly countrySearchControl = new FormControl('', { nonNullable: true });
  readonly citySearchControl = new FormControl('', { nonNullable: true });
  weatherData: WeatherData | null = null;
  error: string = '';
  cityLookupMessage: string = '';
  isDarkMode: boolean = false;
  weatherDetails: WeatherDetail[] = [];
  isCitiesLoading = false;
  isWeatherLoading = false;
  temperatureUnit: 'C' | 'F' = 'C';

  chart: ChartInstance | null = null;

  @ViewChild('weatherChart') weatherChart!: ElementRef;
  private cityRequestId = 0;
  private weatherRequestId = 0;

  constructor(
    private weatherService: WeatherService,
    private locationService: LocationService,
    private cdr: ChangeDetectorRef,
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.fetchCountries();
    this.checkDarkModePreference();
  }

  ngOnDestroy(): void {
    this.cityRequestId++;
    this.weatherRequestId++;
    this.chart?.destroy();
  }

  get filteredCountries(): string[] {
    const query = this.countrySearchControl.value.trim().toLocaleLowerCase();
    return this.countries.filter((country) => country.toLocaleLowerCase().includes(query));
  }

  get filteredCities(): string[] {
    const query = this.citySearchControl.value.trim().toLocaleLowerCase();
    return this.cities.filter((city) => city.toLocaleLowerCase().includes(query));
  }

  private checkDarkModePreference() {
    const darkModePref = localStorage.getItem('darkMode');
    if (darkModePref !== null) {
      this.isDarkMode = darkModePref === 'true';
    } else {
      this.isDarkMode =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  fetchCountries(): void {
    this.locationService.getCountries().pipe(
      finalize(() => this.cdr.detectChanges()),
    ).subscribe(
      (data: any[]) => {
        const countryNames = data
          .map((country: any) => country?.names?.common as string | undefined)
          .filter((name: string | undefined): name is string => Boolean(name));

        this.countries = Array.from(new Set(countryNames)) as string[];
        this.countries.sort((a: string, b: string) => a.localeCompare(b));
        this.cdr.detectChanges();
      },
      () => {
        this.error = 'Failed to load countries. Please try again later.';
        this.cdr.detectChanges();
      },
    );
  }

  onCountryChange(): void {
    const requestId = ++this.cityRequestId;
    this.countrySearchControl.setValue('');
    this.citySearchControl.setValue('');
    this.cities = [];
    this.selectedCity = '';
    this.isCitiesLoading = false;
    this.clearWeatherData();
    this.error = '';
    this.cityLookupMessage = '';

    if (!this.selectedCountry) {
      this.cdr.detectChanges();
      return;
    }

    this.isCitiesLoading = true;
    this.locationService.getCities(this.selectedCountry).pipe(
      finalize(() => {
        if (requestId !== this.cityRequestId) return;
        this.isCitiesLoading = false;
        this.cdr.detectChanges();
      }),
    ).subscribe(
      (data: any) => {
        if (requestId !== this.cityRequestId) return;
        const cityList: string[] = Array.isArray(data?.data)
          ? data.data.map((city: string) => city).filter(Boolean)
          : [];

        this.cities = cityList.sort((a: string, b: string) => a.localeCompare(b));
        if (this.cities.length === 0) {
          this.cityLookupMessage =
            'City data is unavailable for this country. Please choose another country.';
        }
        this.cdr.detectChanges();
      },
      () => {
        if (requestId !== this.cityRequestId) return;
        this.error =
          'Failed to load cities for the selected country. Please try again.';
        this.cdr.detectChanges();
      },
    );
  }

  onCityChange(): void {
    this.citySearchControl.setValue('');
    if (!this.selectedCity) {
      this.clearWeatherData();
      this.cdr.detectChanges();
      return;
    }

    this.getWeather();
  }

  private clearWeatherData(): void {
    this.weatherRequestId++;
    this.isWeatherLoading = false;
    this.weatherData = null;
    this.weatherDetails = [];
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  getWeather(): void {
    if (!this.selectedCity) return;

    this.error = '';
    this.clearWeatherData();
    const requestId = ++this.weatherRequestId;
    this.isWeatherLoading = true;
    this.cdr.detectChanges();

    this.weatherService.getWeather(this.selectedCity).pipe(
      finalize(() => {
        if (requestId !== this.weatherRequestId) return;
        this.isWeatherLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(
      (data) => {
        if (requestId !== this.weatherRequestId) return;
        this.weatherData = data;
        this.prepareWeatherDetails();
        this.cdr.detectChanges();
        Promise.resolve().then(() => {
          if (requestId === this.weatherRequestId) this.updateChart();
        });
      },
      (err) => {
        if (requestId !== this.weatherRequestId) return;
        this.error = `Failed to load weather data: ${err.message || 'Unknown error'}`;
        this.cdr.detectChanges();
      },
    );
  }

  prepareWeatherDetails(): void {
    if (!this.weatherData) return;

    this.weatherDetails = [
      {
        label: 'Humidity',
        value: `${this.weatherData.humidity}%`,
        icon: 'opacity',
        iconClass: 'humidity-icon',
      },
      {
        label: 'Wind Speed',
        value: `${this.weatherData.windSpeed} km/h`,
        icon: 'air',
        iconClass: 'wind-icon',
      },
      {
        label: 'Wind Direction',
        value: this.weatherData.windDirection || 'Unavailable',
        icon: 'navigation',
        iconClass: 'wind-icon',
      },
      {
        label: 'UV Index',
        value: `${this.weatherData.uvIndex} (${this.uvRiskLevel})`,
        icon: 'wb_sunny',
        iconClass: 'uv-icon',
      },
      {
        label: 'Sunrise',
        value: this.weatherData.sunrise,
        icon: 'brightness_5',
        iconClass: 'sunrise-icon',
      },
      {
        label: 'Sunset',
        value: this.weatherData.sunset,
        icon: 'brightness_4',
        iconClass: 'sunset-icon',
      },
    ];
  }

  get uvRiskLevel(): string {
    const index = this.weatherData?.uvIndex ?? 0;
    if (index < 3) return 'Low';
    if (index < 6) return 'Moderate';
    if (index < 8) return 'High';
    if (index < 11) return 'Very high';
    return 'Extreme';
  }

  formatTemperature(celsius: number): number {
    return Math.round(this.temperatureUnit === 'C' ? celsius : celsius * 9 / 5 + 32);
  }

  toggleTemperatureUnit(): void {
    this.temperatureUnit = this.temperatureUnit === 'C' ? 'F' : 'C';
    this.prepareWeatherDetails();
    this.updateChart();
  }

  updateChart(): void {
    if (this.weatherData && this.weatherChart) {
      this.chart?.destroy();

      const ctx = this.weatherChart.nativeElement.getContext('2d');
      if (!ctx) return;
      const data = [
        this.formatTemperature(this.weatherData.temperature),
        this.formatTemperature(this.weatherData.feelsLike),
        this.weatherData.humidity,
        this.weatherData.windSpeed,
        this.weatherData.uvIndex,
      ];
      const labels = [
        `Temperature (°${this.temperatureUnit})`,
        `Feels Like (°${this.temperatureUnit})`,
        'Humidity (%)',
        'Wind (km/h)',
        'UV Index',
      ];

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Weather Metrics',
              data: data,
              backgroundColor: [
                '#2575fc',
                '#6a11cb',
                '#ff7e5f',
                '#30cfd0',
                '#ffc371',
              ],
              borderColor: '#2c3e50',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }

  getWeatherIcon(): string {
    if (!this.weatherData || !this.weatherData.description) {
      return '❓';
    }

    const description = this.weatherData.description.toLowerCase();
    if (description.includes('clear')) return '☀️';
    if (description.includes('cloud')) return '☁️';
    if (description.includes('rain')) return '🌧️';
    if (description.includes('storm')) return '⛈️';
    if (description.includes('snow')) return '❄️';
    if (description.includes('wind')) return '💨';
    if (description.includes('fog') || description.includes('mist'))
      return '🌫️';
    if (description.includes('sun') && description.includes('cloud'))
      return '⛅';
    if (description.includes('drizzle')) return '🌦️';
    return '🌍';
  }

  getWeatherIconClass(): string {
    if (!this.weatherData || !this.weatherData.description) {
      return 'unknown-weather';
    }

    const description = this.weatherData.description.toLowerCase();
    if (description.includes('clear')) return 'clear-weather';
    if (description.includes('cloud')) return 'cloudy-weather';
    if (description.includes('rain')) return 'rainy-weather';
    if (description.includes('storm')) return 'stormy-weather';
    if (description.includes('snow')) return 'snowy-weather';
    if (description.includes('wind')) return 'windy-weather';
    if (description.includes('fog') || description.includes('mist'))
      return 'foggy-weather';
    return 'unknown-weather';
  }
}
