import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import type { Chart as ChartInstance, ChartType } from 'chart.js';
import { finalize } from 'rxjs/operators';
import { CountryServiceService } from '../../services/country-service.service';
import { ThemeService } from '../../services/theme.service';
import {
  ChartCardComponent,
  CountryCardComponent,
  CountryOption,
  CountrySearchComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  SkeletonLoaderComponent,
  StatCardComponent,
} from './countries-ui.components';

@Component({
  selector: 'app-root',
  templateUrl: './countries.component.html',
  styleUrls: ['./countries.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    A11yModule,
    ChartCardComponent,
    CountryCardComponent,
    CountrySearchComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonLoaderComponent,
    StatCardComponent,
  ],
})
export class CountriesComponent implements OnInit, OnDestroy {
  countries: any[] = [];
  selectedCountryCode: string = '';
  selectedCountryName: string = '';
  countryPopulation: number | undefined;
  errorMessage: string | undefined;
  chartType: string = 'bar';
  modalChartType: string = 'bar';
  chart: ChartInstance | null = null;
  modalChart: ChartInstance | null = null;
  additionalInfo: any = {};
  isPopulationGraphModalOpen: boolean = false;
  isCountriesLoading: boolean = false;
  isCountryDetailsLoading: boolean = false;
  selectedRegion = '';
  sortBy = 'population';
  comparedCodes: string[] = [];
  recentCodes: string[] = [];
  comparisonMessage = '';
  shareUrl = '';
  shareStatus = '';
  shareCopied = false;

  @ViewChild('populationChart') populationChart!: ElementRef;
  @ViewChild('globalChartButton') globalChartButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('modalCloseButton') modalCloseButton?: ElementRef<HTMLButtonElement>;

  private chartModulePromise?: Promise<typeof import('chart.js/auto')>;
  private detailRequestId = 0;
  private queryParamSubscription?: Subscription;
  private requestedCountryCode = '';

  constructor(
    private countryService: CountryServiceService,
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadPreferences();
    this.queryParamSubscription = this.route.queryParamMap.subscribe((params) => {
      this.requestedCountryCode = params.get('country')?.toUpperCase() ?? '';
      this.selectSharedCountry();
      this.cdr.markForCheck();
    });
    this.loadCountries();
  }

  ngOnDestroy(): void {
    this.queryParamSubscription?.unsubscribe();
    this.chart?.destroy();
    this.modalChart?.destroy();
  }

  get theme(): 'light' | 'dark' {
    return this.themeService.theme;
  }

  private loadCountries(): void {
    this.isCountriesLoading = true;
    this.countryService.getAllCountries().pipe(
      finalize(() => {
        this.isCountriesLoading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe(
      (countries) => {
        this.countries = countries;
        this.selectSharedCountry();
        this.cdr.markForCheck();
      },
      (error) => {
        this.errorMessage = 'Error fetching countries. Please try again.';
        this.cdr.markForCheck();
      },
    );
  }

  private loadPreferences(): void {
    try {
      const storedRecent = JSON.parse(localStorage.getItem('population-finder-recent') ?? '[]');
      this.recentCodes = Array.isArray(storedRecent)
        ? storedRecent.filter((code): code is string => typeof code === 'string').slice(0, 4)
        : [];
    } catch {
      this.recentCodes = [];
    }
  }

  private selectSharedCountry(): void {
    if (
      this.requestedCountryCode &&
      this.countries.some((country) => country.codes?.alpha_2 === this.requestedCountryCode) &&
      this.selectedCountryCode !== this.requestedCountryCode
    ) {
      this.selectCountry(this.requestedCountryCode);
    }
  }

  get countryOptions(): CountryOption[] {
    return this.countries.map((country) => ({
      code: country.codes?.alpha_2 ?? '',
      name: country.names?.common ?? 'Unknown country',
      population: country.population,
      region: country.region ?? country.continents?.[0],
      continents: country.continents,
    })).filter((country) => country.code);
  }

  get regions(): string[] {
    return [...new Set(this.countryOptions.map((country) => country.region).filter((region): region is string => Boolean(region)))].sort();
  }

  get hasDensityData(): boolean {
    return this.countries.some((country) => Number(country.area?.kilometers ?? country.area) > 0);
  }

  get hasGrowthData(): boolean {
    return this.countries.some((country) => Number.isFinite(Number(country.growthRate ?? country.populationGrowth)));
  }

  get recentCountries(): CountryOption[] {
    return this.recentCodes.map((code) => this.countryOptions.find((country) => country.code === code)).filter((country): country is CountryOption => Boolean(country));
  }

  get filteredSortedCountries(): any[] {
    const filtered = this.countries.filter((country) => !this.selectedRegion || (country.region ?? country.continents?.[0]) === this.selectedRegion);
    const metric = (country: any): number => {
      if (this.sortBy === 'density') {
        const area = Number(country.area?.kilometers ?? country.area);
        return area > 0 ? country.population / area : Number.NEGATIVE_INFINITY;
      }
      if (this.sortBy === 'growth') return Number(country.growthRate ?? country.populationGrowth ?? Number.NEGATIVE_INFINITY);
      return Number(country.population ?? 0);
    };
    return [...filtered].sort((first, second) => metric(second) - metric(first));
  }

  get top5HighPopulation(): any[] {
    return [...this.filteredSortedCountries].sort((first, second) => (second.population ?? 0) - (first.population ?? 0)).slice(0, 5);
  }

  get top5LowPopulation(): any[] {
    return [...this.filteredSortedCountries].sort((first, second) => (first.population ?? 0) - (second.population ?? 0)).slice(0, 5);
  }

  get selectedCountryRank(): number | string {
    const index = [...this.countries].sort((first, second) => (second.population ?? 0) - (first.population ?? 0))
      .findIndex((country) => country.codes?.alpha_2 === this.selectedCountryCode);
    return index < 0 ? '—' : index + 1;
  }

  get selectedRegionName(): string {
    return this.additionalInfo?.region ?? this.additionalInfo?.continents?.[0] ?? '';
  }

  get selectedDensity(): string {
    return this.selectedDensityValue !== undefined
      ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(this.selectedDensityValue)
      : 'Not available';
  }

  get selectedDensityValue(): number | undefined {
    const area = Number(this.additionalInfo?.area?.kilometers ?? this.additionalInfo?.area);
    return area > 0 && this.countryPopulation !== undefined ? this.countryPopulation / area : undefined;
  }

  get comparedCountries(): any[] {
    return this.comparedCodes.map((code) => this.countries.find((country) => country.codes?.alpha_2 === code)).filter(Boolean);
  }

  get chartRows(): Array<{ label: string; value: number }> {
    const source = this.comparedCountries.length
      ? this.comparedCountries
      : this.countries.filter((country) => country.codes?.alpha_2 === this.selectedCountryCode);
    return source.map((country) => ({ label: country.names?.common ?? 'Unknown', value: country.population ?? 0 }));
  }

  get chartDescription(): string {
    return this.chartRows.map((row) => `${row.label}: ${row.value.toLocaleString()}`).join('; ');
  }

  formatPopulation(value: number): string {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(value);
  }

  formatPopulationFull(value: number | undefined): string {
    return value === undefined ? 'Not available' : new Intl.NumberFormat().format(value);
  }

  selectCountry(code: string): void {
    this.selectedCountryCode = code;
    this.detailRequestId++;
    const selectedCountry = this.countries.find((country) => country.codes?.alpha_2 === code);
    if (selectedCountry) {
      this.selectedCountryName = selectedCountry.names?.common ?? '';
      this.countryPopulation = selectedCountry.population;
      this.additionalInfo = selectedCountry;
      this.isCountryDetailsLoading = false;
      this.errorMessage = undefined;
    } else {
      this.selectedCountryName = '';
      this.countryPopulation = undefined;
      this.additionalInfo = {};
    }
    this.cdr.markForCheck();
    this.fetchCountryPopulation();
  }

  toggleTheme(): void {
    this.themeService.toggle();
    if (this.countryPopulation !== undefined) setTimeout(() => this.renderChart(), 0);
    if (this.isPopulationGraphModalOpen) setTimeout(() => this.renderPopulationChart(), 0);
  }

  async shareSelectedCountry(): Promise<void> {
    if (!this.selectedCountryCode) return;

    const urlTree = this.router.createUrlTree(['/population'], {
      queryParams: { country: this.selectedCountryCode },
    });
    this.shareUrl = new URL(this.router.serializeUrl(urlTree), window.location.origin).toString();
    this.shareCopied = false;
    this.shareStatus = 'Preparing share link...';

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable.');
      }
      await navigator.clipboard.writeText(this.shareUrl);
      this.shareCopied = true;
      this.shareStatus = 'Share link copied to clipboard.';
    } catch (error) {
      this.shareStatus = 'The link is ready below. Copy it manually to share this country profile.';
      console.warn('Unable to copy the population share link.', error);
    }
  }

  selectShareUrl(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) event.target.select();
  }

  createPopulationCsv(): string {
    const rows = this.comparedCountries.length > 0
      ? this.comparedCountries
      : this.countries.filter((country) => country.codes?.alpha_2 === this.selectedCountryCode);
    const columns = ['Country', 'Code', 'Region', 'Population', 'Land area (km2)'];
    const escapeCell = (value: unknown): string => {
      const text = String(value ?? '');
      const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const records = rows.map((country) => [
      country.names?.common ?? 'Unknown',
      country.codes?.alpha_2 ?? '',
      country.region ?? country.continents?.join(', ') ?? '',
      country.population ?? '',
      country.area?.kilometers ?? country.area ?? '',
    ]);

    return [columns, ...records].map((record) => record.map(escapeCell).join(',')).join('\r\n');
  }

  exportPopulationCsv(): void {
    const csv = this.createPopulationCsv();
    if (!csv || csv.split('\r\n').length < 2) {
      this.shareStatus = 'Select a country before exporting population data.';
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'population-data.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    this.shareStatus = 'Population data exported as CSV.';
  }

  toggleComparedCountry(code: string): void {
    if (this.comparedCodes.includes(code)) {
      this.comparedCodes = this.comparedCodes.filter((item) => item !== code);
    } else if (this.comparedCodes.length < 3) {
      this.comparedCodes = [...this.comparedCodes, code];
      this.comparisonMessage = '';
    } else {
      this.comparisonMessage = 'You can compare up to three countries at a time.';
    }
    if (this.countryPopulation !== undefined) setTimeout(() => this.renderChart(), 0);
  }

  clearComparedCountries(): void {
    this.comparedCodes = [];
    this.comparisonMessage = '';
    if (this.countryPopulation !== undefined) setTimeout(() => this.renderChart(), 0);
  }

  retryCountries(): void {
    this.errorMessage = undefined;
    this.loadCountries();
  }

  flagUrlFor(code: string | undefined): string {
    return code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : '';
  }

  private loadChartModule(): Promise<typeof import('chart.js/auto')> {
    this.chartModulePromise ??= import('chart.js/auto');
    return this.chartModulePromise;
  }

  // Add this to track if the chart should be visible
  showChart: boolean = false;

  // Modify your fetchCountryPopulation method
  fetchCountryPopulation() {
    if (!this.selectedCountryCode) return;

    const requestId = ++this.detailRequestId;
    const requestedCode = this.selectedCountryCode;
    this.showChart = false;
    this.isCountryDetailsLoading = true;
    this.errorMessage = undefined;
    this.cdr.markForCheck();

    const selectedCountry = this.countries.find(
      (country) => country.codes?.alpha_2 === requestedCode,
    );

    if (!selectedCountry) {
      this.errorMessage = 'Country not found. Please try again.';
      this.isCountryDetailsLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.selectedCountryName = selectedCountry.names?.common ?? '';
    this.recentCodes = [requestedCode, ...this.recentCodes.filter((code) => code !== requestedCode)].slice(0, 4);
    try { localStorage.setItem('population-finder-recent', JSON.stringify(this.recentCodes)); } catch { /* Storage is optional. */ }
    this.errorMessage = undefined;

    this.countryService.getCountryByCode(requestedCode).pipe(
      finalize(() => {
        if (requestId === this.detailRequestId) {
          this.isCountryDetailsLoading = false;
          this.cdr.markForCheck();
        }
      }),
    ).subscribe(
      (fullDetails) => {
        if (requestId !== this.detailRequestId) return;
        this.countryPopulation = fullDetails.population;
        this.additionalInfo = fullDetails;
        this.cdr.markForCheck();

        setTimeout(() => {
          if (requestId !== this.detailRequestId) return;
          this.renderChart();
          this.showChart = true;
          this.cdr.markForCheck();
        }, 0);
      },
      (error) => {
        if (requestId !== this.detailRequestId) return;
        this.errorMessage = 'Error fetching country details.';
        this.cdr.markForCheck();
      },
    );
  }

  private chartToken(name: string, fallback: string): string {
    const canvas = document.getElementById('myChart');
    return canvas ? getComputedStyle(canvas).getPropertyValue(name).trim() || fallback : fallback;
  }

  private get chartColors(): string[] {
    return Array.from({ length: 8 }, (_, index) => this.chartToken(`--chart-${index + 1}`, '#3157c8'));
  }
  async renderChart() {
    // Ensure we have required data
    if (!this.selectedCountryName || this.countryPopulation === undefined) {
      return;
    }

    // Get canvas element
    const canvas = document.getElementById('myChart') as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    const chartModule = await this.loadChartModule();
    const ChartConstructor = chartModule.default;
    const chartCountries = this.comparedCountries.length
      ? this.comparedCountries
      : this.countries.filter((country) => country.codes?.alpha_2 === this.selectedCountryCode);

    // Clear previous chart if exists
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Get context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Create gradient for bar chart
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, this.chartToken('--chart-1', '#3157c8'));
    gradient.addColorStop(1, this.chartToken('--chart-2', '#087f8c'));

    // Prepare data based on chart type
    const chartData = {
      labels: chartCountries.map((country) => country.names?.common ?? this.selectedCountryName),
      datasets: [
        {
          label: 'Population',
          data: chartCountries.map((country) => country.population ?? this.countryPopulation ?? 0),
          backgroundColor:
            this.chartType === 'pie' || this.chartType === 'doughnut'
              ? this.chartColors
              : chartCountries.length > 1 ? this.chartColors : gradient,
          borderColor:
            this.chartType === 'pie' || this.chartType === 'doughnut'
              ? this.chartToken('--surface', '#ffffff')
              : this.chartToken('--chart-8', '#364152'),
          borderWidth:
            this.chartType === 'pie' || this.chartType === 'doughnut' ? 2 : 1,
          hoverBackgroundColor:
            this.chartType === 'pie' || this.chartType === 'doughnut'
              ? this.chartColors
              : undefined,
        },
      ],
    };

    // Chart options based on type
    let chartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          display: this.chartType === 'pie' || this.chartType === 'doughnut',
          position: 'top' as const,
          labels: {
            color: this.chartToken('--ink', '#172033'),
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.raw;
              return `${context.label}: ${value.toLocaleString()}`;
            },
          },
        },
      },
    };

    // Add scales for bar and line charts
    if (this.chartType === 'bar' || this.chartType === 'line') {
      chartOptions.scales = {
        y: {
          beginAtZero: true,
          grid: {
            color: this.chartToken('--line', '#e2e7f0'),
            display: true,
          },
          ticks: {
            color: this.chartToken('--ink', '#172033'),
            font: { size: 11 },
            callback: function (value: any) {
              return value.toLocaleString();
            },
          },
          title: {
            display: true,
            text: 'Population',
            color: this.chartToken('--ink', '#172033'),
            font: { size: 12 },
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: this.chartToken('--ink', '#172033'),
            font: { size: 11 },
          },
          title: {
            display: true,
            text: 'Country',
            color: '#2c3e50',
            font: { size: 12 },
          },
        },
      };
    }

    // Create chart
    try {
      this.chart = new ChartConstructor(ctx, {
        type: this.chartType as ChartType,
        data: chartData,
        options: chartOptions,
      });
    } catch (error) {}
  }

  // Also add this method to handle chart type changes
  onChartTypeChange() {
    if (this.countryPopulation !== undefined && this.selectedCountryName) {
      setTimeout(() => {
        this.renderChart();
      }, 100);
    }
  }

  get selectedCountryFlagUrl(): string {
    const code = this.additionalInfo?.codes?.alpha_2?.toLowerCase();
    return code ? `https://flagcdn.com/w320/${code}.png` : '';
  }
  getCountryInfo(field: string): any {
    if (!this.additionalInfo) {
      return 'N/A';
    }

    const data = this.additionalInfo[field];

    if (data === undefined || data === null) {
      return 'N/A';
    }

    switch (field) {
      case 'flags':
        const code = this.additionalInfo['codes']?.alpha_2?.toLowerCase();
        return code ? `https://flagcdn.com/w320/${code}.png` : '';

      case 'coatOfArms':
        return data?.png || data?.svg || '';

      case 'currencies':
        if (Array.isArray(data)) {
          // Array format: [{code, name, symbol}]
          return data.length === 0
            ? 'N/A'
            : data
                .map((c: any) => `${c.name} (${c.symbol || c.code})`)
                .join(', ');
        } else if (typeof data === 'object') {
          // Object format: {"USD": {name, symbol}}
          return Object.values(data)
            .map((c: any) => `${c.name} (${c.symbol || ''})`)
            .join(', ');
        }
        return 'N/A';

      case 'languages':
        if (Array.isArray(data)) {
          // Array format: [{name, iso639_1}]
          return data.length === 0
            ? 'N/A'
            : data.map((l: any) => l.name).join(', ');
        } else if (typeof data === 'object') {
          // Object format: {"eng": "English"}
          return Object.values(data).join(', ');
        }
        return 'N/A';

      case 'capital':
        // v5: capitals is array of objects with .name
        if (Array.isArray(data)) {
          return data.length === 0
            ? 'N/A'
            : data.map((c: any) => c.name || c).join(', ');
        }
        return data || 'N/A';
      case 'continents':
        if (Array.isArray(data)) {
          return data.length === 0 ? 'N/A' : data.join(', ');
        }
        return data || 'N/A';

      case 'area':
        return data?.kilometers ? data.kilometers.toLocaleString() : 'Not available';
      default:
        if (typeof data === 'object') return Object.values(data).join(', ');
        return data ?? 'N/A';
    }
  }

  openPopulationGraphModal() {
    this.isPopulationGraphModalOpen = true;
    setTimeout(() => {
      this.modalCloseButton?.nativeElement.focus();
      this.renderPopulationChart();
    }, 0);
  }

  closePopulationGraphModal() {
    this.isPopulationGraphModalOpen = false;
    this.modalChart?.destroy();
    this.modalChart = null;
    setTimeout(() => this.globalChartButton?.nativeElement.focus(), 0);
  }

  async renderPopulationChart(): Promise<void> {
    const validCountries = this.countries.filter(
      (country) => Number.isFinite(country.population),
    );

    const labels = validCountries.map((country) => country.names?.common ?? 'Unknown');
    const populations = validCountries.map((country) => country.population);

    const canvas = this.populationChart?.nativeElement as HTMLCanvasElement | undefined;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartModule = await this.loadChartModule();
    const ChartConstructor = chartModule.default;

    if (this.modalChart) {
      this.modalChart.destroy();
      this.modalChart = null;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, this.chartToken('--chart-1', '#3157c8'));
    gradient.addColorStop(1, this.chartToken('--chart-2', '#087f8c'));

    this.modalChart = new ChartConstructor(ctx, {
      type: this.modalChartType as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Population',
            data: populations,
            backgroundColor:
              this.modalChartType === 'bar' || this.modalChartType === 'line'
                ? gradient
                : this.chartColors,
              borderColor: this.chartToken('--chart-8', '#364152'),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220, easing: 'easeOutQuart' },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: this.chartToken('--line', '#e2e7f0') },
            ticks: { color: this.chartToken('--ink', '#172033'), font: { size: 11 } },
          },
          x: {
            grid: { display: false },
            ticks: { color: this.chartToken('--ink', '#172033'), font: { size: 11 } },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: this.chartToken('--ink', '#172033'),
              font: { size: 11 },
              filter: () =>
                this.modalChartType !== 'polarArea' &&
                this.modalChartType !== 'doughnut',
            },
          },
        },
      },
    });
  }
}
