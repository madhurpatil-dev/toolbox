import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CountryServiceService {
  private readonly BASE_URL = 'https://api.restcountries.com/countries/v5';
  private readonly API_KEY = 'rc_live_960b8d0b0dc84a30b10577a8f29dbc9c';
  private countriesCache$: Observable<any[]> | undefined;
  private countryDetailCache: Map<string, any> = new Map(); // cache per country code

  private readonly fallbackCountries = [
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

  private readonly fallbackCountryDetails: Record<string, any> = {
    IN: { names: { common: 'India' }, codes: { alpha_2: 'IN' }, population: 1428627663, flag: { url_png: 'https://flagcdn.com/w320/in.png' }, area: { kilometers: 3287263, miles: 1269000 }, capitals: [{ name: 'New Delhi' }], languages: [{ name: 'Hindi' }, { name: 'English' }], currencies: [{ name: 'Indian Rupee', symbol: '₹', code: 'INR' }], continents: ['Asia'] },
    US: { names: { common: 'United States' }, codes: { alpha_2: 'US' }, population: 331893745, flag: { url_png: 'https://flagcdn.com/w320/us.png' }, area: { kilometers: 9372610, miles: 3618783.5 }, capitals: [{ name: 'Washington, D.C.' }], languages: [{ name: 'English' }], currencies: [{ name: 'United States dollar', symbol: '$', code: 'USD' }], continents: ['North America'] },
    CN: { names: { common: 'China' }, codes: { alpha_2: 'CN' }, population: 1411778724, flag: { url_png: 'https://flagcdn.com/w320/cn.png' }, area: { kilometers: 9596960, miles: 3705400 }, capitals: [{ name: 'Beijing' }], languages: [{ name: 'Chinese' }], currencies: [{ name: 'Renminbi', symbol: '¥', code: 'CNY' }], continents: ['Asia'] },
    BR: { names: { common: 'Brazil' }, codes: { alpha_2: 'BR' }, population: 216422446, flag: { url_png: 'https://flagcdn.com/w320/br.png' }, area: { kilometers: 8515767, miles: 3287597 }, capitals: [{ name: 'Brasília' }], languages: [{ name: 'Portuguese' }], currencies: [{ name: 'Brazilian real', symbol: 'R$', code: 'BRL' }], continents: ['South America'] },
    GB: { names: { common: 'United Kingdom' }, codes: { alpha_2: 'GB' }, population: 67736802, flag: { url_png: 'https://flagcdn.com/w320/gb.png' }, area: { kilometers: 243610, miles: 94200 }, capitals: [{ name: 'London' }], languages: [{ name: 'English' }], currencies: [{ name: 'Pound sterling', symbol: '£', code: 'GBP' }], continents: ['Europe'] },
  };

  constructor(private http: HttpClient) {}

  getAllCountries(): Observable<any[]> {
    if (!this.countriesCache$) {
      this.countriesCache$ = of(this.fallbackCountries).pipe(
        map((countries) => countries.filter(Boolean)),
        shareReplay(1),
      );
    }
    return this.countriesCache$;
  }

  getCountryByCode(code: string): Observable<any> {
    const normalizedCode = code.toUpperCase();

    if (this.countryDetailCache.has(normalizedCode)) {
      return of(this.countryDetailCache.get(normalizedCode));
    }

    const fallbackDetail = this.fallbackCountryDetails[normalizedCode] ?? this.fallbackCountries.find((country) => country.codes.alpha_2 === normalizedCode);
    if (fallbackDetail) {
      this.countryDetailCache.set(normalizedCode, fallbackDetail);
      return of(fallbackDetail);
    }

    const fields = 'names.common,codes.alpha_2,population,flag,area,capitals,languages,currencies,continents,coat_of_arms';
    const url = `${this.BASE_URL}/codes.alpha_2/${normalizedCode}?response_fields=${fields}&api-key=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(
      map((response) => response?.data?.objects?.[0] ?? fallbackDetail),
      tap((detail) => this.countryDetailCache.set(normalizedCode, detail)),
      catchError(() => of(fallbackDetail)),
    );
  }
}