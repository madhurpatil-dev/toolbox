import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Chart, ChartType, registerables } from 'chart.js';
import { debounceTime, finalize, Subject, takeUntil } from 'rxjs';
import { CountryServiceService } from '../../services/country-service.service';

interface CountryRecord {
  names?: { common?: string };
  codes?: { alpha_2?: string };
  population?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './countries.component.html',
  styleUrls: ['./countries.component.css'],
  standalone: false,
})
export class CountriesComponent implements OnInit, OnDestroy {
  countries: CountryRecord[] = [];
  selectedCountryCode = '';
  selectedCountryName = '';
  countrySearch = '';
  countryPopulation: number | undefined;
  errorMessage: string | undefined;
  chartType: ChartType = 'bar';
  modalChartType: ChartType = 'bar';
  globalChartLimit: 10 | 'all' = 10;
  chart: Chart | null = null;
  modalChart: Chart | null = null;
  top5HighPopulation: CountryRecord[] = [];
  top5LowPopulation: CountryRecord[] = [];
  additionalInfo: CountryRecord = {};
  isPopulationGraphModalOpen = false;
  isCountriesLoading = false;
  isCountryDetailsLoading = false;
  copyFeedback = '';
  favoriteCodes = new Set<string>();

  @ViewChild('populationChart') populationChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('countrySearchInput') countrySearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('closeModalButton') closeModalButton?: ElementRef<HTMLButtonElement>;

  private readonly countrySelectionSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private readonly favoritesStorageKey = 'country-population-explorer-favorites';
  private copyFeedbackTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly countryService: CountryServiceService) {
    Chart.register(...registerables);
    this.countrySelectionSubject
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => this.fetchCountryPopulation());
  }

  ngOnInit(): void {
    this.restoreFavorites();
    this.isCountriesLoading = true;

    this.countryService
      .getAllCountries()
      .pipe(
        finalize(() => (this.isCountriesLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (countries) => {
          this.countries = (countries ?? []).filter(Boolean);
          this.findTop5HighPopulation();
          this.findTop5LowPopulation();
        },
        error: () => {
          this.errorMessage = 'We could not load the country directory. Please try again.';
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.countrySelectionSubject.complete();
    this.chart?.destroy();
    this.modalChart?.destroy();
    if (this.copyFeedbackTimer) clearTimeout(this.copyFeedbackTimer);
  }

  get filteredCountries(): CountryRecord[] {
    const query = this.countrySearch.trim().toLocaleLowerCase();

    return this.countries
      .filter((country) => {
        const name = country.names?.common?.toLocaleLowerCase() ?? '';
        const code = country.codes?.alpha_2?.toLocaleLowerCase() ?? '';
        return !query || name.includes(query) || code.includes(query);
      })
      .sort((a, b) => (a.names?.common ?? '').localeCompare(b.names?.common ?? ''));
  }

  get selectedCountry(): CountryRecord | undefined {
    return this.countries.find(
      (country) => country.codes?.alpha_2 === this.selectedCountryCode,
    );
  }

  get selectedCountryFlagUrl(): string {
    const code = this.additionalInfo?.codes?.alpha_2?.toLowerCase();
    return code ? `https://flagcdn.com/w320/${code}.png` : '';
  }

  get totalPopulation(): number {
    return this.countries.reduce(
      (total, country) => total + (Number.isFinite(country.population) ? Number(country.population) : 0),
      0,
    );
  }

  get globalChartCountries(): CountryRecord[] {
    const ranked = this.countries
      .filter((country) => Number.isFinite(country.population))
      .sort((a, b) => Number(b.population) - Number(a.population));

    return this.globalChartLimit === 'all' ? ranked : ranked.slice(0, this.globalChartLimit);
  }

  selectCountry(country: CountryRecord): void {
    const code = country.codes?.alpha_2;
    if (!code) return;

    this.selectedCountryCode = code;
    this.selectedCountryName = country.names?.common ?? '';
    this.countrySearch = this.selectedCountryName;
    this.onCountrySelectionChange();
  }

  onCountrySearchChange(): void {
    this.errorMessage = undefined;
  }

  onCountrySelectionChange(): void {
    if (!this.selectedCountryCode) return;
    const selected = this.selectedCountry;
    this.countrySearch = selected?.names?.common ?? this.countrySearch;
    this.countrySelectionSubject.next(this.selectedCountryCode);
  }

  fetchCountryPopulation(): void {
    if (!this.selectedCountryCode) return;

    const selectedCountry = this.selectedCountry;
    if (!selectedCountry) {
      this.errorMessage = 'That country could not be found. Please choose another option.';
      this.isCountryDetailsLoading = false;
      return;
    }

    this.showCountryLoadingState(selectedCountry);

    this.countryService
      .getCountryByCode(this.selectedCountryCode)
      .pipe(
        finalize(() => (this.isCountryDetailsLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (fullDetails) => {
          if (!fullDetails) {
            this.errorMessage = 'Country details are not available right now.';
            return;
          }

          this.countryPopulation = fullDetails.population ?? selectedCountry.population;
          this.additionalInfo = fullDetails;
          this.selectedCountryName = fullDetails.names?.common ?? selectedCountry.names?.common ?? '';
          this.errorMessage = undefined;

          setTimeout(() => this.renderChart());
        },
        error: () => {
          this.errorMessage = 'We could not load country details. Please try again.';
        },
      });
  }

  setChartType(type: ChartType): void {
    this.chartType = type;
    this.renderChart();
  }

  renderChart(): void {
    if (!this.selectedCountryName || this.countryPopulation === undefined) return;

    const canvas = document.getElementById('myChart') as HTMLCanvasElement | null;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    this.chart?.destroy();
    const usesCircularChart = this.chartType === 'pie' || this.chartType === 'doughnut';
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height || 360);
    gradient.addColorStop(0, '#7759f7');
    gradient.addColorStop(1, '#34c6a1');

    this.chart = new Chart(context, {
      type: this.chartType,
      data: {
        labels: [this.selectedCountryName],
        datasets: [
          {
            label: 'Population',
            data: [this.countryPopulation],
            backgroundColor: usesCircularChart ? ['#7759f7'] : gradient,
            borderColor: usesCircularChart ? '#ffffff' : '#5c43d4',
            borderWidth: usesCircularChart ? 5 : 1,
            borderRadius: this.chartType === 'bar' ? 12 : undefined,
            maxBarThickness: 136,
            fill: this.chartType === 'line',
            tension: this.chartType === 'line' ? 0.35 : undefined,
            pointRadius: this.chartType === 'line' ? 6 : undefined,
            pointHoverRadius: this.chartType === 'line' ? 8 : undefined,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 650, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: usesCircularChart, labels: { color: '#334155', usePointStyle: true } },
          tooltip: this.populationTooltip(),
        },
        ...(usesCircularChart ? {} : { scales: this.populationScales() }),
      },
    });
  }

  findTop5HighPopulation(): void {
    this.top5HighPopulation = this.rankedCountries('desc').slice(0, 5);
  }

  findTop5LowPopulation(): void {
    this.top5LowPopulation = this.rankedCountries('asc').slice(0, 5);
  }

  getCountryInfo(field: string): string | number {
    if (!this.additionalInfo) return 'Not available';
    const data = this.additionalInfo[field];
    if (data === undefined || data === null) return 'Not available';

    switch (field) {
      case 'currencies':
        if (Array.isArray(data)) {
          return data.length
            ? data.map((currency: any) => `${currency.name ?? currency.code} (${currency.symbol || currency.code || ''})`).join(', ')
            : 'Not available';
        }
        if (typeof data === 'object') {
          const currencies = Object.values(data).map(
            (currency: any) => `${currency.name ?? ''}${currency.symbol ? ` (${currency.symbol})` : ''}`.trim(),
          );
          return currencies.filter(Boolean).join(', ') || 'Not available';
        }
        return 'Not available';

      case 'languages':
        if (Array.isArray(data)) return data.map((language: any) => language.name ?? language).join(', ') || 'Not available';
        return typeof data === 'object' ? Object.values(data).join(', ') || 'Not available' : String(data);

      case 'capital':
      case 'capitals':
        if (Array.isArray(data)) return data.map((capital: any) => capital.name ?? capital).join(', ') || 'Not available';
        return String(data);

      case 'continents':
        return Array.isArray(data) ? data.join(', ') || 'Not available' : String(data);

      case 'area':
        return data?.kilometers ? Number(data.kilometers).toLocaleString() : 'Not available';

      default:
        return typeof data === 'object' ? Object.values(data).join(', ') : String(data);
    }
  }

  toggleFavorite(country?: CountryRecord, event?: Event): void {
    event?.stopPropagation();
    const code = country?.codes?.alpha_2;
    if (!code) return;

    const updatedFavorites = new Set(this.favoriteCodes);
    updatedFavorites.has(code) ? updatedFavorites.delete(code) : updatedFavorites.add(code);
    this.favoriteCodes = updatedFavorites;
    this.persistFavorites();
  }

  onCountryCodeSelected(code: string): void {
    const country = this.countries.find((item) => item.codes?.alpha_2 === code);
    if (country) this.selectCountry(country);
  }

  isFavorite(country?: CountryRecord): boolean {
    const code = country?.codes?.alpha_2;
    return !!code && this.favoriteCodes.has(code);
  }

  async copyPopulation(): Promise<void> {
    if (this.countryPopulation === undefined || !this.selectedCountryName) return;
    const text = `${this.selectedCountryName}: ${this.countryPopulation.toLocaleString()} people`;

    try {
      if (!navigator.clipboard) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback('Population copied');
    } catch {
      this.showCopyFeedback('Copy is unavailable in this browser');
    }
  }

  openPopulationGraphModal(): void {
    if (!this.countries.length) return;
    this.isPopulationGraphModalOpen = true;
    setTimeout(() => {
      this.renderPopulationChart();
      this.closeModalButton?.nativeElement.focus();
    });
  }

  closePopulationGraphModal(): void {
    this.isPopulationGraphModalOpen = false;
    this.modalChart?.destroy();
    this.modalChart = null;
  }

  onGlobalChartSettingsChange(): void {
    this.renderPopulationChart();
  }

  renderPopulationChart(): void {
    const canvas = this.populationChart?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const countries = this.globalChartCountries;
    this.modalChart?.destroy();
    const isRadial = ['polarArea', 'radar', 'doughnut', 'pie'].includes(this.modalChartType);
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height || 420);
    gradient.addColorStop(0, '#7759f7');
    gradient.addColorStop(1, '#34c6a1');

    this.modalChart = new Chart(context, {
      type: this.modalChartType,
      data: {
        labels: countries.map((country) => country.names?.common ?? 'Unknown'),
        datasets: [
          {
            label: 'Population',
            data: countries.map((country) => country.population ?? 0),
            backgroundColor: isRadial ? this.chartColors(countries.length) : gradient,
            borderColor: isRadial ? '#ffffff' : '#5c43d4',
            borderWidth: isRadial ? 2 : 1,
            borderRadius: this.modalChartType === 'bar' ? 8 : undefined,
            fill: this.modalChartType === 'line',
            tension: this.modalChartType === 'line' ? 0.35 : undefined,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 650, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            display: isRadial,
            position: 'bottom',
            labels: { boxWidth: 10, padding: 12, color: '#475569', usePointStyle: true },
          },
          tooltip: this.populationTooltip(),
        },
        ...(isRadial ? {} : { scales: this.populationScales() }),
      },
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');

    if (event.key === 'Escape' && this.isPopulationGraphModalOpen) {
      this.closePopulationGraphModal();
      return;
    }

    if (event.key === '/' && !isTyping && !this.isPopulationGraphModalOpen) {
      event.preventDefault();
      this.countrySearchInput?.nativeElement.focus();
    }
  }

  private showCountryLoadingState(country: CountryRecord): void {
    this.isCountryDetailsLoading = true;
    this.countryPopulation = undefined;
    this.additionalInfo = {};
    this.selectedCountryName = country.names?.common ?? '';
    this.errorMessage = undefined;
    this.chart?.destroy();
    this.chart = null;
  }

  private rankedCountries(direction: 'asc' | 'desc'): CountryRecord[] {
    return this.countries
      .filter((country) => Number.isFinite(country.population))
      .sort((a, b) =>
        direction === 'desc'
          ? Number(b.population) - Number(a.population)
          : Number(a.population) - Number(b.population),
      );
  }

  private populationTooltip(): any {
    return {
      backgroundColor: '#172036',
      titleColor: '#ffffff',
      bodyColor: '#e2e8f0',
      padding: 12,
      callbacks: {
        label: (context: any) => ` ${context.raw.toLocaleString()} people`,
      },
    };
  }

  private populationScales(): any {
    return {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
        ticks: {
          color: '#64748b',
          callback: (value: any) => Number(value).toLocaleString(),
        },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: '#475569' },
      },
    };
  }

  private chartColors(count: number): string[] {
    return Array.from({ length: count }, (_, index) => `hsl(${255 - (index * 26) % 190} 72% ${55 + (index % 3) * 6}%)`);
  }

  private restoreFavorites(): void {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(this.favoritesStorageKey) ?? '[]');
      if (Array.isArray(savedFavorites)) this.favoriteCodes = new Set(savedFavorites.filter((code) => typeof code === 'string'));
    } catch {
      this.favoriteCodes = new Set<string>();
    }
  }

  private persistFavorites(): void {
    try {
      localStorage.setItem(this.favoritesStorageKey, JSON.stringify(Array.from(this.favoriteCodes)));
    } catch {
      // Saved countries remain available for the current session if browser storage is blocked.
    }
  }

  private showCopyFeedback(message: string): void {
    this.copyFeedback = message;
    if (this.copyFeedbackTimer) clearTimeout(this.copyFeedbackTimer);
    this.copyFeedbackTimer = setTimeout(() => (this.copyFeedback = ''), 2500);
  }
}
