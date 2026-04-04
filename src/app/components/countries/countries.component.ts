import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartType, registerables } from 'chart.js';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { debounceTime, Subject } from 'rxjs';
import { CountryServiceService } from '../../services/country-service.service';

@Component({
    selector: 'app-root',
    templateUrl: './countries.component.html',
    styleUrls: ['./countries.component.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
        ]),
        trigger('cardAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(-20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
            ]),
        ]),
        trigger('modalAnimation', [
            state('open', style({ opacity: 1, visibility: 'visible' })),
            state('closed', style({ opacity: 0, visibility: 'hidden' })),
            transition('closed => open', animate('300ms ease-out')),
            transition('open => closed', animate('300ms ease-in')),
        ]),
    ],
    standalone: false
})
export class CountriesComponent implements OnInit {
  countries: any[] = [];
  selectedCountryCode: string = '';
  selectedCountryName: string = '';
  countryPopulation: number | undefined;
  errorMessage: string | undefined;
  chartType: string = 'bar';
  modalChartType: string = 'bar';
  chart: any;
  top5HighPopulation: any[] = [];
  top5LowPopulation: any[] = [];
  additionalInfo: any = {};
  isPopulationGraphModalOpen: boolean = false;
  isLoading: boolean = false;
  isGraphButtonBlinking: boolean = true;

  @ViewChild('populationChart') populationChart!: ElementRef;

  private countrySelectionSubject = new Subject<string>();

  constructor(private countryService: CountryServiceService) {
    Chart.register(...registerables);
    this.countrySelectionSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchCountryPopulation();
    });
  }

  ngOnInit() {
    this.isLoading = true;
    this.countryService.getAllCountries().subscribe(
      (countries) => {
        this.countries = countries;
        this.findTop5HighPopulation();
        this.findTop5LowPopulation();
        this.isLoading = false;
      },
      (error) => {
        this.errorMessage = 'Error fetching countries. Please try again.';
        this.isLoading = false;
      }
    );
  }

  colors: string[] = [
    '#3498db',
    '#2ecc71',
    '#e74c3c',
    '#f1c40f',
    '#9b59b6',
    '#1abc9c',
    '#e67e22',
    '#34495e',
    '#ff6b6b',
    '#00cec9',
  ];

  onCountrySelectionChange() {
    this.countrySelectionSubject.next(this.selectedCountryCode);
  }

  // Add this to track if the chart should be visible
showChart: boolean = false;

// Modify your fetchCountryPopulation method
fetchCountryPopulation() {
  if (!this.selectedCountryCode) return;

  this.showChart = false;
  this.isLoading = true;

  // Step 1: get population from already-loaded list (fast)
  const selectedCountry = this.countries.find(
    (country) => country.cca2 === this.selectedCountryCode
  );

  if (!selectedCountry) {
    this.errorMessage = 'Country not found. Please try again.';
    this.isLoading = false;
    return;
  }

  this.selectedCountryName = selectedCountry.name.common;
  this.errorMessage = undefined;

  // Step 2: fetch FULL details separately (has all fields)
  this.countryService.getCountryByCode(this.selectedCountryCode).subscribe(
    (fullDetails) => {
      this.countryPopulation = fullDetails.population;
      this.additionalInfo = fullDetails; // ← full object with all fields

      setTimeout(() => {
        this.renderChart();
        this.showChart = true;
      }, 100);

      this.isLoading = false;
    },
    (error) => {
      this.errorMessage = 'Error fetching country details.';
      this.isLoading = false;
    }
  );
}
renderChart() {
  // Ensure we have required data
  if (!this.selectedCountryName || this.countryPopulation === undefined) {
    return;
  }

  // Get canvas element
  const canvas = document.getElementById('myChart') as HTMLCanvasElement;
  if (!canvas) {
    return;
  }

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
  gradient.addColorStop(0, '#3498db');
  gradient.addColorStop(1, '#2ecc71');

  // Prepare data based on chart type
  const chartData = {
    labels: [this.selectedCountryName],
    datasets: [{
      label: 'Population',
      data: [this.countryPopulation],
      backgroundColor: this.chartType === 'pie' || this.chartType === 'doughnut' 
        ? ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6'] 
        : gradient,
      borderColor: this.chartType === 'pie' || this.chartType === 'doughnut'
        ? '#ffffff'
        : '#2c3e50',
      borderWidth: this.chartType === 'pie' || this.chartType === 'doughnut' ? 2 : 1,
      hoverBackgroundColor: this.chartType === 'pie' || this.chartType === 'doughnut'
        ? ['#2980b9', '#27ae60', '#c0392b', '#f39c12', '#8e44ad']
        : undefined
    }]
  };

  // Chart options based on type
  let chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: this.chartType === 'pie' || this.chartType === 'doughnut',
        position: 'top' as const,
        labels: {
          color: '#2c3e50',
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${context.label}: ${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  // Add scales for bar and line charts
  if (this.chartType === 'bar' || this.chartType === 'line') {
    chartOptions.scales = {
      y: {
        beginAtZero: true,
        grid: { 
          color: '#ecf0f1',
          display: true 
        },
        ticks: { 
          color: '#2c3e50', 
          font: { size: 11 },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        title: {
          display: true,
          text: 'Population',
          color: '#2c3e50',
          font: { size: 12 }
        }
      },
      x: {
        grid: { display: false },
        ticks: { 
          color: '#2c3e50', 
          font: { size: 11 } 
        },
        title: {
          display: true,
          text: 'Country',
          color: '#2c3e50',
          font: { size: 12 }
        }
      }
    };
  }

  // Create chart
  try {
    this.chart = new Chart(ctx, {
      type: this.chartType as ChartType,
      data: chartData,
      options: chartOptions
    });
  } catch (error) {
  }
}

// Also add this method to handle chart type changes
onChartTypeChange() {
  if (this.countryPopulation !== undefined && this.selectedCountryName) {
    setTimeout(() => {
      this.renderChart();
    }, 100);
  }
}

  findTop5HighPopulation() {
    this.top5HighPopulation = this.countries
      .filter((country) => country.population !== undefined)
      .sort((a, b) => b.population - a.population)
      .slice(0, 5);
  }

  findTop5LowPopulation() {
    this.top5LowPopulation = this.countries
      .filter((country) => country.population !== undefined)
      .sort((a, b) => a.population - b.population)
      .slice(0, 5);
  }

get selectedCountryFlagUrl(): string {
  const code = this.additionalInfo?.cca2?.toLowerCase();
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
      const code = this.additionalInfo['cca2']?.toLowerCase();
      return code ? `https://flagcdn.com/w320/${code}.png` : '';

    case 'coatOfArms':
      return data?.png || data?.svg || '';

    case 'currencies':
      if (Array.isArray(data)) {
        // Array format: [{code, name, symbol}]
        return data.length === 0 ? 'N/A' : data.map((c: any) => `${c.name} (${c.symbol || c.code})`).join(', ');
      } else if (typeof data === 'object') {
        // Object format: {"USD": {name, symbol}}
        return Object.values(data).map((c: any) => `${c.name} (${c.symbol || ''})`).join(', ');
      }
      return 'N/A';

    case 'languages':
      if (Array.isArray(data)) {
        // Array format: [{name, iso639_1}]
        return data.length === 0 ? 'N/A' : data.map((l: any) => l.name).join(', ');
      } else if (typeof data === 'object') {
        // Object format: {"eng": "English"}
        return Object.values(data).join(', ');
      }
      return 'N/A';

    case 'capital':
    case 'continents':
      if (Array.isArray(data)) {
        return data.length === 0 ? 'N/A' : data.join(', ');
      }
      return data || 'N/A';

    case 'area':
      if (data === 0) return '0';
      return data ? data.toLocaleString() : 'N/A';

    default:
      if (typeof data === 'object') return Object.values(data).join(', ');
      return data ?? 'N/A';
  }
}

  openPopulationGraphModal() {
    this.isPopulationGraphModalOpen = true;
    setTimeout(() => this.renderPopulationChart(), 0);
  }

  closePopulationGraphModal() {
    this.isPopulationGraphModalOpen = false;
  }

  renderPopulationChart(): void {
    this.isLoading = true;
    this.countryService.getAllCountries().subscribe((countries) => {
      const labels = countries.map((country) => country.name.common);
      const populations = countries.map((country) => country.population);

      const ctx = this.populationChart.nativeElement.getContext('2d');
      if (ctx) {
        if (this.chart) {
          this.chart.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2ecc71');

        this.chart = new Chart(ctx, {
          type: this.modalChartType as ChartType,
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Population',
                data: populations,
                backgroundColor:
                  this.modalChartType === 'bar' || this.modalChartType === 'line'
                    ? gradient
                    : this.colors,
                borderColor: '#2c3e50',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 800,
              easing: 'easeOutQuart',
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#ecf0f1' },
                ticks: { color: '#2c3e50', font: { size: 11 } },
              },
              x: {
                grid: { display: false },
                ticks: { color: '#2c3e50', font: { size: 11 } },
              },
            },
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: '#2c3e50',
                  font: { size: 11 },
                  filter: (legendItem: any, data: any) => {
                    if (
                      this.modalChartType === 'polarArea' ||
                      this.modalChartType === 'doughnut'
                    ) {
                      return false;
                    }
                    return true;
                  },
                },
              },
            },
          },
        });
      }
      this.isLoading = false;
    });
  }
}