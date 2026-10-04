import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

export interface CountryOption {
  code: string;
  name: string;
  population?: number;
  region?: string;
  continents?: string[];
}

@Component({
  selector: 'app-country-search',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="search-control">
      <label for="country-search">Find a country</label>
      <div class="search-row">
        <div class="search-input-wrap">
          <span class="search-symbol" aria-hidden="true">⌕</span>
          <input
            id="country-search"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="country-options"
            [attr.aria-expanded]="isOpen && filteredCountries.length > 0"
            [attr.aria-activedescendant]="activeIndex >= 0 ? 'country-option-' + activeIndex : null"
            [value]="query"
            placeholder="Search by country name..."
            autocomplete="off"
            (input)="onInput($event)"
            (keydown)="onKeydown($event)"
            (focus)="isOpen = true"
          />
          @if (query) {
            <button class="clear-search" type="button" aria-label="Clear search" (click)="clearSearch()">×</button>
          }
          @if (isOpen && filteredCountries.length) {
            <ul id="country-options" class="suggestions" role="listbox" aria-label="Countries">
              @for (country of filteredCountries; track country.code; let index = $index) {
                <li role="presentation">
                  <button
                    class="suggestion"
                    [class.active]="activeIndex === index"
                    [id]="'country-option-' + index"
                    role="option"
                    [attr.aria-selected]="activeIndex === index"
                    type="button"
                    (mouseenter)="activeIndex = index"
                    (click)="choose(country)"
                  >
                    <img [src]="flagUrl(country.code)" alt="" loading="lazy" />
                    <span>{{ country.name }}</span>
                    <small>{{ country.population | number }}</small>
                  </button>
                </li>
              }
            </ul>
          }
        </div>
        <label class="select-wrap" for="country-region">
          <span class="sr-only">Filter by region</span>
          <select id="country-region" [value]="selectedRegion" [disabled]="regions.length === 0" (change)="regionChange.emit($any($event.target).value)">
            <option value="">All regions</option>
            @for (region of regions; track region) {
              <option [value]="region">{{ region }}</option>
            }
          </select>
        </label>
        <label class="select-wrap sort-wrap" for="country-sort">
          <span class="sr-only">Sort countries</span>
          <select id="country-sort" [value]="sortBy" (change)="sortChange.emit($any($event.target).value)">
            <option value="population">Population</option>
            <option value="density" [disabled]="!hasDensity">Density</option>
            <option value="growth" [disabled]="!hasGrowth">Growth rate</option>
          </select>
        </label>
      </div>
      @if (recentCountries.length) {
        <div class="recent-searches" aria-label="Recent searches">
          <span>Recent</span>
          @for (country of recentCountries; track country.code) {
            <button type="button" (click)="choose(country)">
              <img [src]="flagUrl(country.code)" alt="" loading="lazy" />{{ country.name }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display:block; min-width:0; }
    .search-control { position:relative; }
    .search-control > label { display:block; margin:0 0 8px; color:var(--ink); font-size:14px; font-weight:700; }
    .search-row { display:grid; grid-template-columns:minmax(180px,1fr) 160px 160px; gap:8px; }
    .search-input-wrap { position:relative; min-width:0; }
    input, select { width:100%; min-height:48px; border:1px solid var(--line); border-radius:10px; background:var(--surface); color:var(--ink); }
    input { padding:0 44px 0 42px; }
    input::placeholder { color:var(--muted); }
    .search-symbol { position:absolute; left:15px; top:8px; z-index:1; color:var(--muted); font-size:25px; line-height:1.1; }
    .clear-search { position:absolute; top:2px; right:3px; width:44px; height:44px; border:0; border-radius:8px; background:transparent; color:var(--muted); font-size:24px; cursor:pointer; }
    select { padding:0 32px 0 12px; cursor:pointer; }
    .suggestions { position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:10; max-height:300px; overflow:auto; margin:0; padding:6px; list-style:none; border:1px solid var(--line); border-radius:12px; background:var(--surface); box-shadow:var(--shadow-md); }
    .suggestion { display:flex; align-items:center; gap:10px; width:100%; min-height:44px; padding:7px 9px; border:0; border-radius:8px; background:transparent; color:var(--ink); text-align:left; cursor:pointer; }
    .suggestion:hover, .suggestion.active { background:var(--brand-soft); }
    .suggestion img, .recent-searches img { width:22px; height:15px; border:1px solid var(--line); border-radius:2px; object-fit:cover; }
    .suggestion span { flex:1; }
    .suggestion small { color:var(--muted); font-variant-numeric:tabular-nums; }
    .recent-searches { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:12px; }
    .recent-searches > span { color:var(--muted); font-size:12px; font-weight:700; }
    .recent-searches button { display:flex; align-items:center; gap:6px; min-height:44px; padding:4px 9px; border:1px solid var(--line); border-radius:20px; background:var(--surface); color:var(--ink); font-size:12px; cursor:pointer; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    @media(max-width:640px) { .search-row { grid-template-columns:1fr 1fr; } .search-input-wrap { grid-column:1/-1; } }
  `],
})
export class CountrySearchComponent {
  @Input() countries: CountryOption[] = [];
  @Input() regions: string[] = [];
  @Input() recentCountries: CountryOption[] = [];
  @Input() selectedRegion = '';
  @Input() sortBy = 'population';
  @Input() hasDensity = false;
  @Input() hasGrowth = false;
  @Output() countrySelected = new EventEmitter<string>();
  @Output() regionChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();

  query = '';
  isOpen = false;
  activeIndex = -1;

  get filteredCountries(): CountryOption[] {
    const normalizedQuery = this.query.trim().toLocaleLowerCase();
    return this.countries
      .filter((country) => !normalizedQuery || country.name.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }

  onInput(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
    this.activeIndex = -1;
    this.isOpen = true;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isOpen = true;
      this.activeIndex = Math.min(this.activeIndex + 1, this.filteredCountries.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    } else if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      this.choose(this.filteredCountries[this.activeIndex]);
    } else if (event.key === 'Escape') {
      this.isOpen = false;
    }
  }

  choose(country: CountryOption): void {
    this.countrySelected.emit(country.code);
    this.query = country.name;
    this.isOpen = false;
    this.activeIndex = -1;
  }

  clearSearch(): void {
    this.query = '';
    this.isOpen = true;
    this.activeIndex = -1;
  }

  flagUrl(code: string): string {
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  }
}

@Component({
  selector: 'app-country-card',
  standalone: true,
  template: `
    <article class="country-card">
      <img [src]="flagUrl" [alt]="name + ' flag'" />
      <div class="identity">
        <p class="eyebrow">{{ region || 'Country profile' }} <span aria-hidden="true">·</span> Rank #{{ rank }}</p>
        <h2>{{ name }}</h2>
      </div>
      <button type="button" [attr.aria-pressed]="compared" (click)="compareToggle.emit()">
        {{ compared ? 'Added to compare' : '＋ Compare' }}
      </button>
    </article>
  `,
  styles: [`
    :host { display:block; }
    .country-card { display:flex; align-items:center; gap:16px; min-width:0; }
    img { width:56px; height:38px; flex:0 0 auto; border:1px solid var(--line); border-radius:5px; object-fit:cover; box-shadow:var(--shadow-sm); }
    .identity { min-width:0; flex:1; }
    .eyebrow { margin:0 0 3px; color:var(--muted); font-size:12px; font-weight:600; }
    h2 { overflow-wrap:anywhere; margin:0; color:var(--ink); font-size:24px; line-height:1.2; }
    button { min-height:44px; padding:0 12px; border:1px solid var(--line); border-radius:9px; background:var(--surface); color:var(--brand-strong); font-size:13px; font-weight:700; cursor:pointer; }
    @media(max-width:480px) { .country-card { flex-wrap:wrap; } .country-card button { width:100%; } h2 { font-size:20px; } }
  `],
})
export class CountryCardComponent {
  @Input() name = '';
  @Input() region = '';
  @Input() rank: number | string = '—';
  @Input() flagUrl = '';
  @Input() compared = false;
  @Output() compareToggle = new EventEmitter<void>();
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <article class="stat-card" [class.primary]="primary">
      <span class="stat-label">{{ label }}</span>
      <strong>{{ numericValue === undefined ? value : animatedValue }}</strong>
      <span class="stat-detail">{{ detail }}</span>
    </article>
  `,
  styles: [`
    :host { display:block; min-width:0; }
    .stat-card { display:flex; flex-direction:column; min-height:124px; padding:18px; border:1px solid var(--line); border-radius:12px; background:var(--surface); box-shadow:var(--shadow-sm); }
    .stat-card.primary { border-top:3px solid var(--brand); }
    .stat-label { color:var(--muted); font-size:13px; font-weight:600; }
    strong { overflow-wrap:anywhere; margin:9px 0 4px; color:var(--ink); font-size:24px; line-height:1.15; font-variant-numeric:tabular-nums; }
    .stat-detail { color:var(--muted); font-size:12px; }
  `],
})
export class StatCardComponent implements OnChanges {
  @Input() label = '';
  @Input() value = '';
  @Input() detail = '';
  @Input() primary = false;
  @Input() numericValue?: number;
  @Input() numericFormat: 'compact' | 'full' = 'compact';

  animatedValue = '';
  private animationFrame = 0;
  private lastAnimatedValue = 0;

  constructor(private changeDetector: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (this.numericValue === undefined || !Number.isFinite(this.numericValue)) return;
    cancelAnimationFrame(this.animationFrame);
    const target = this.numericValue;
    const start = this.lastAnimatedValue;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.lastAnimatedValue = target;
      this.animatedValue = this.formatNumber(target);
      return;
    }
    const startedAt = performance.now();
    this.animatedValue = this.formatNumber(start);
    const update = (now: number): void => {
      const progress = Math.min((now - startedAt) / 240, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const current = start + (target - start) * easedProgress;
      this.animatedValue = this.formatNumber(current);
      this.changeDetector.markForCheck();
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(update);
      } else {
        this.lastAnimatedValue = target;
      }
    };
    this.animationFrame = requestAnimationFrame(update);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat(undefined, this.numericFormat === 'compact'
      ? { notation: 'compact', maximumFractionDigits: 2 }
      : { maximumFractionDigits: 1 }).format(value);
  }
}

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="chart-card" aria-labelledby="chart-card-title">
      <div class="chart-heading">
        <div><h2 id="chart-card-title">{{ title }}</h2><p>{{ description }}</p></div>
        @if (rows.length) {
          <button type="button" class="table-toggle" [attr.aria-expanded]="showTable" (click)="showTable = !showTable">
            {{ showTable ? 'Hide data' : 'View data' }}
          </button>
        }
      </div>
      <ng-content></ng-content>
      @if (showTable && rows.length) {
        <div class="table-scroll">
          <table><caption class="sr-only">{{ title }} data</caption>
            <thead><tr><th scope="col">Country</th><th scope="col">Population</th></tr></thead>
            <tbody>@for (row of rows; track row.label) { <tr><th scope="row">{{ row.label }}</th><td>{{ row.value | number }}</td></tr> }</tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display:block; min-width:0; }
    .chart-card { padding:20px; border:1px solid var(--line); border-radius:14px; background:var(--surface); box-shadow:var(--shadow-sm); }
    .chart-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
    h2 { margin:0; color:var(--ink); font-size:18px; line-height:1.25; }
    p { margin:4px 0 0; color:var(--muted); font-size:13px; }
    .table-toggle { min-height:44px; padding:0 10px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--ink); font-size:12px; font-weight:700; cursor:pointer; }
    .table-scroll { overflow:auto; margin-top:16px; }
    table { width:100%; border-collapse:collapse; text-align:left; font-size:13px; }
    th,td { padding:9px 10px; border-bottom:1px solid var(--line); }
    td { text-align:right; font-variant-numeric:tabular-nums; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  `],
})
export class ChartCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() rows: Array<{ label: string; value: number }> = [];
  showTable = false;
}

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `<div class="skeleton" role="status" aria-label="Loading population data"><span></span><span></span><span></span><span></span></div>`,
  styles: [`
    :host { display:block; }
    .skeleton { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    span { height:112px; border-radius:12px; background:linear-gradient(90deg,var(--line),var(--surface),var(--line)); background-size:200% 100%; animation:shimmer 1.3s ease-in-out infinite; }
    @keyframes shimmer { to { background-position:-200% 0; } }
    @media(max-width:640px) { .skeleton { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media(prefers-reduced-motion:reduce) { span { animation:none; } }
  `],
})
export class SkeletonLoaderComponent {}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <section class="state" role="status">
      <span class="state-mark" aria-hidden="true">◎</span>
      <h2>{{ title }}</h2><p>{{ message }}</p>
      @if (actionLabel) { <button type="button" (click)="action.emit()">{{ actionLabel }}</button> }
    </section>
  `,
  styles: [`
    :host { display:block; }
    .state { display:grid; justify-items:center; padding:42px 20px; border:1px dashed var(--line); border-radius:14px; background:var(--surface); text-align:center; }
    .state-mark { color:var(--brand); font-size:32px; }
    h2 { margin:8px 0 4px; font-size:18px; }
    p { max-width:420px; margin:0; color:var(--muted); font-size:14px; }
    button { min-height:44px; margin-top:16px; padding:0 14px; border:0; border-radius:8px; background:var(--brand); color:var(--on-brand,#fff); font-weight:700; cursor:pointer; }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'Choose a country to begin';
  @Input() message = 'Search for a country to explore its population and geography.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <section class="error-state" role="alert">
      <div><strong>We couldn't load this data</strong><p>{{ message }}</p></div>
      <button type="button" (click)="retry.emit()">Try again</button>
    </section>
  `,
  styles: [`
    :host { display:block; }
    .error-state { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px; border:1px solid var(--danger-border); border-radius:10px; background:var(--danger-soft); color:var(--danger); }
    p { margin:3px 0 0; font-size:13px; }
    button { min-height:44px; padding:0 12px; border:1px solid currentColor; border-radius:8px; background:transparent; color:inherit; font-weight:700; cursor:pointer; }
    @media(max-width:480px) { .error-state { align-items:flex-start; flex-direction:column; } }
  `],
})
export class ErrorStateComponent {
  @Input() message = 'Check your connection, then retry.';
  @Output() retry = new EventEmitter<void>();
}