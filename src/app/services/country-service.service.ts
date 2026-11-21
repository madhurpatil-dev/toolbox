import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, retry, shareReplay, switchMap, tap } from 'rxjs/operators';

export interface CountryRecord {
  names?: { common?: string; official?: string };
  codes?: { alpha_2?: string; alpha_3?: string };
  population?: number;
  flag?: { url_png?: string; url_svg?: string; emoji?: string };
  area?: { kilometers?: number; miles?: number } | number;
  capitals?: Array<{ name?: string } | string>;
  languages?: Array<{ name?: string }> | Record<string, string>;
  currencies?: Array<{ code?: string; name?: string; symbol?: string }> | Record<string, { name?: string; symbol?: string }>;
  region?: string;
  subregion?: string;
  continents?: string[];
  borders?: string[];
  calling_codes?: string[];
  timezones?: string[];
}

interface CountriesResponse {
  data?: {
    objects?: CountryRecord[];
    meta?: { total?: number; more?: boolean };
  };
}

interface CacheEntry<T> {
  cachedAt: number;
  value: T;
}

const API_ENDPOINT = '/.netlify/functions/countries';
const LIST_CACHE_KEY = 'toolbox-country-list-v1';
const DETAIL_CACHE_KEY = 'toolbox-country-details-v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
@Injectable({ providedIn: 'root' })
export class CountryServiceService {
  private countriesCache$?: Observable<CountryRecord[]>;
  private readonly countryDetailCache = new Map<string, CountryRecord>();
  private readonly fallbackCountries: CountryRecord[] = [
    { names: { common: 'India' }, codes: { alpha_2: 'IN' }, population: 1428627663 },
    { names: { common: 'United States' }, codes: { alpha_2: 'US' }, population: 331893745 },
    { names: { common: 'China' }, codes: { alpha_2: 'CN' }, population: 1411778724 },
    { names: { common: 'Indonesia' }, codes: { alpha_2: 'ID' }, population: 276361783 },
    { names: { common: 'Pakistan' }, codes: { alpha_2: 'PK' }, population: 240485658 },
    { names: { common: 'Brazil' }, codes: { alpha_2: 'BR' }, population: 216422446 },
    { names: { common: 'Nigeria' }, codes: { alpha_2: 'NG' }, population: 223804632 },
    { names: { common: 'Bangladesh' }, codes: { alpha_2: 'BD' }, population: 172954319 },
    { names: { common: 'Russia' }, codes: { alpha_2: 'RU' }, population: 144444359 },
    { names: { common: 'Mexico' }, codes: { alpha_2: 'MX' }, population: 128455567 },
    { names: { common: 'Japan' }, codes: { alpha_2: 'JP' }, population: 123294513 },
    { names: { common: 'Ethiopia' }, codes: { alpha_2: 'ET' }, population: 126527060 },
    { names: { common: 'Philippines' }, codes: { alpha_2: 'PH' }, population: 117337368 },
    { names: { common: 'Egypt' }, codes: { alpha_2: 'EG' }, population: 112716598 },
    { names: { common: 'Vietnam' }, codes: { alpha_2: 'VN' }, population: 100300000 },
    { names: { common: 'Germany' }, codes: { alpha_2: 'DE' }, population: 84353249 },
    { names: { common: 'France' }, codes: { alpha_2: 'FR' }, population: 68497332 },
    { names: { common: 'United Kingdom' }, codes: { alpha_2: 'GB' }, population: 67736802 },
    { names: { common: 'Italy' }, codes: { alpha_2: 'IT' }, population: 58983000 },
    { names: { common: 'Canada' }, codes: { alpha_2: 'CA' }, population: 40097761 },
    { names: { common: 'Australia' }, codes: { alpha_2: 'AU' }, population: 26368805 },
    { names: { common: 'New Zealand' }, codes: { alpha_2: 'NZ' }, population: 5180000 },
    { names: { common: 'Sri Lanka' }, codes: { alpha_2: 'LK' }, population: 21893579 },
    { names: { common: 'Nepal' }, codes: { alpha_2: 'NP' }, population: 30896089 },
    { names: { common: 'Bhutan' }, codes: { alpha_2: 'BT' }, population: 787425 },
    { names: { common: 'Maldives' }, codes: { alpha_2: 'MV' }, population: 523787 },
  ];
  private readonly fallbackCountryDetails: Record<string, CountryRecord> = {
    IN: { names: { common: 'India' }, codes: { alpha_2: 'IN' }, population: 1428627663, flag: { url_png: 'https://flagcdn.com/w320/in.png' }, area: { kilometers: 3287263 }, capitals: [{ name: 'New Delhi' }], languages: [{ name: 'Hindi' }, { name: 'English' }], currencies: [{ name: 'Indian Rupee', symbol: '₹', code: 'INR' }], continents: ['Asia'] },
    US: { names: { common: 'United States' }, codes: { alpha_2: 'US' }, population: 331893745, flag: { url_png: 'https://flagcdn.com/w320/us.png' }, area: { kilometers: 9372610 }, capitals: [{ name: 'Washington, D.C.' }], languages: [{ name: 'English' }], currencies: [{ name: 'United States dollar', symbol: '$', code: 'USD' }], continents: ['North America'] },
    CN: { names: { common: 'China' }, codes: { alpha_2: 'CN' }, population: 1411778724, flag: { url_png: 'https://flagcdn.com/w320/cn.png' }, area: { kilometers: 9596960 }, capitals: [{ name: 'Beijing' }], languages: [{ name: 'Chinese' }], currencies: [{ name: 'Renminbi', symbol: '¥', code: 'CNY' }], continents: ['Asia'] },
    BR: { names: { common: 'Brazil' }, codes: { alpha_2: 'BR' }, population: 216422446, flag: { url_png: 'https://flagcdn.com/w320/br.png' }, area: { kilometers: 8515767 }, capitals: [{ name: 'Brasília' }], languages: [{ name: 'Portuguese' }], currencies: [{ name: 'Brazilian real', symbol: 'R$', code: 'BRL' }], continents: ['South America'] },
    GB: { names: { common: 'United Kingdom' }, codes: { alpha_2: 'GB' }, population: 67736802, flag: { url_png: 'https://flagcdn.com/w320/gb.png' }, area: { kilometers: 243610 }, capitals: [{ name: 'London' }], languages: [{ name: 'English' }], currencies: [{ name: 'Pound sterling', symbol: '£', code: 'GBP' }], continents: ['Europe'] },
  };
  isUsingCachedData = false;

  constructor(
    private readonly http: HttpClient,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  getAllCountries(): Observable<CountryRecord[]> {
    if (this.countriesCache$) return this.countriesCache$;

    const cachedCountries = this.readCache<CountryRecord[]>(LIST_CACHE_KEY);
    this.isUsingCachedData = Boolean(cachedCountries);

    this.countriesCache$ = this.fetchAllCountries().pipe(
      retry({
        count: 2,
        delay: (error: unknown, retryCount) => error instanceof HttpErrorResponse
          && (error.status === 0 || error.status >= 500)
          ? timer(retryCount * 400)
          : throwError(() => error),
      }),
      tap((countries) => {
        this.isUsingCachedData = false;
        this.writeCache(LIST_CACHE_KEY, countries);
      }),
      catchError((error: unknown) => {
        if (cachedCountries?.length) {
          console.warn('Using cached country data after the API request failed.', error);
          return of(cachedCountries);
        }

        console.warn('Using the bundled country fallback after the API request failed.', error);
        this.isUsingCachedData = true;
        return of(this.fallbackCountries);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.countriesCache$;
  }

  getCountryByCode(code: string): Observable<CountryRecord> {
    const normalizedCode = code.trim().toUpperCase();
    const cachedDetail = this.countryDetailCache.get(normalizedCode)
      ?? this.readDetailCache()[normalizedCode];
    if (cachedDetail) {
      this.countryDetailCache.set(normalizedCode, cachedDetail);
      return of(cachedDetail);
    }

    const fallbackDetail = this.fallbackCountryDetails[normalizedCode]
      ?? this.fallbackCountries.find((country) => country.codes?.alpha_2 === normalizedCode);
    const params = new HttpParams()
      .set('action', 'detail')
      .set('code', normalizedCode);

    return this.http.get<CountriesResponse>(API_ENDPOINT, { params }).pipe(
      retry({
        count: 2,
        delay: (error: unknown, retryCount) => error instanceof HttpErrorResponse
          && (error.status === 0 || error.status >= 500)
          ? timer(retryCount * 400)
          : throwError(() => error),
      }),
      map((response) => response.data?.objects?.[0]),
      map((detail) => {
        if (!detail) throw new Error(`No details were returned for country ${normalizedCode}.`);
        return detail;
      }),
      tap((detail) => this.saveDetail(normalizedCode, detail)),
      catchError((error: unknown) => {
        if (fallbackDetail) {
          console.warn(`Using bundled country details for ${normalizedCode}.`, error);
          return of(fallbackDetail);
        }
        return throwError(() => error);
      }),
    );
  }

  private fetchAllCountries(): Observable<CountryRecord[]> {
    const getPage = (offset: number) => this.http.get<CountriesResponse>(API_ENDPOINT, {
      params: new HttpParams()
        .set('action', 'list')
        .set('limit', '100')
        .set('offset', String(offset)),
    });

    return getPage(0).pipe(
      switchMap((firstPage) => {
        const total = firstPage.data?.meta?.total;
        const offsets = Number.isFinite(total)
          ? Array.from({ length: Math.ceil((total ?? 0) / 100) - 1 }, (_value, index) => (index + 1) * 100)
          : [100, 200];
        return (offsets.length ? forkJoin(offsets.map(getPage)) : of([])).pipe(
          map((remainingPages) => [firstPage, ...remainingPages]),
        );
      }),
      map((pages) => pages.flatMap((page) => page.data?.objects ?? [])),
      map((countries) => countries.filter(
        (country) => Boolean(country.names?.common && country.codes?.alpha_2),
      )),
      map((countries) => {
        if (!countries.length) throw new Error('The country API returned no usable records.');
        return countries;
      }),
    );
  }

  private readCache<T>(key: string): T | undefined {
    try {
      const rawValue = this.document.defaultView?.localStorage.getItem(key);
      if (!rawValue) return undefined;
      const entry = JSON.parse(rawValue) as CacheEntry<T>;
      if (!entry || !Number.isFinite(entry.cachedAt) || Date.now() - entry.cachedAt > CACHE_TTL_MS) {
        this.document.defaultView?.localStorage.removeItem(key);
        return undefined;
      }
      return entry.value;
    } catch (error) {
      console.warn('Unable to read cached country data.', error);
      return undefined;
    }
  }

  private writeCache<T>(key: string, value: T): void {
    try {
      this.document.defaultView?.localStorage.setItem(
        key,
        JSON.stringify({ cachedAt: Date.now(), value } satisfies CacheEntry<T>),
      );
    } catch (error) {
      console.warn('Unable to persist cached country data.', error);
    }
  }

  private readDetailCache(): Record<string, CountryRecord> {
    return this.readCache<Record<string, CountryRecord>>(DETAIL_CACHE_KEY) ?? {};
  }

  private saveDetail(code: string, detail: CountryRecord): void {
    this.countryDetailCache.set(code, detail);
    this.writeCache(DETAIL_CACHE_KEY, { ...this.readDetailCache(), [code]: detail });
  }
}
