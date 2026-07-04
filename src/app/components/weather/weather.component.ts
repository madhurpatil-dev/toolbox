import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { WeatherService } from '../../services/weather.service';
import { LocationService } from '../../services/location.service';
import { Chart, ChartType, registerables } from 'chart.js';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css'],
  standalone: false,
})
export class WeatherComponent implements OnInit {
  countries: string[] = [];
  cities: string[] = [];
  selectedCountry: string = '';
  selectedCity: string = '';
  weatherData: any = null;
  error: string = '';
  isDarkMode: boolean = false;
  weatherDetails: any[] = [];

  chart: any;

  @ViewChild('weatherChart') weatherChart!: ElementRef;

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

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Chart.js handles resize automatically
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
  this.locationService.getCountries().subscribe(
    (data) => {
      this.countries = data.map((country: any) => country.names?.common).sort();
    },
    () => {
      this.error = 'Failed to load countries. Please try again later.';
    },
  );
}

  onCountryChange(): void {
    this.cities = [];
    this.selectedCity = '';
    this.weatherData = null;

    if (!this.selectedCountry) return;

    this.locationService.getCities(this.selectedCountry).subscribe(
      (data) => {
        this.cities = data.data.sort();
      },
      () => {
        this.error =
          'Failed to load cities for the selected country. Please try again.';
      },
    );
  }

  getWeather(): void {
    if (!this.selectedCity) return;

    this.error = '';
    this.weatherData = null;

    this.weatherService.getWeather(this.selectedCity).subscribe(
      (data) => {
        this.weatherData = data;
        this.prepareWeatherDetails();
        this.cdr.detectChanges(); // Forces Angular to render the canvas immediately
        this.updateChart();
      },
      (err) => {
        this.error = `Failed to load weather data: ${err.message || 'Unknown error'}`;
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
        label: 'UV Index',
        value: this.weatherData.uvIndex,
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

  updateChart(): void {
    if (this.weatherData && this.weatherChart) {
      // Destroy existing chart
      if (this.chart) {
        this.chart.destroy();
      }

      const ctx = this.weatherChart.nativeElement.getContext('2d');
      const data = [
        this.weatherData.temperature,
        this.weatherData.feelsLike,
        this.weatherData.humidity,
        this.weatherData.windSpeed,
        this.weatherData.uvIndex,
      ];
      const labels = [
        'Temperature (°C)',
        'Feels Like (°C)',
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
