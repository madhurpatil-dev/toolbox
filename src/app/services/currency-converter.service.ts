// currency-converter.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ConversionRatesResponse {
  rates?: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyConverterService {
  private apiUrl = environment.apiUrl;
  private cache?: ConversionRatesResponse;

  constructor(private http: HttpClient) {}

  getConversionRates(): Observable<ConversionRatesResponse> {
    if (this.cache) {
      return of(this.cache);
    }
    return this.http.get<ConversionRatesResponse>(this.apiUrl).pipe(
      map(response => {
        if (!response?.rates || Object.keys(response.rates).length === 0) {
          throw new Error('The currency service returned no exchange rates.');
        }
        this.cache = response;
        return response;
      }),
    );
  }

  convert(amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number {
    if (!Number.isFinite(amount) || amount < 0) return 0;
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (Number.isFinite(fromRate) && fromRate > 0 && Number.isFinite(toRate) && toRate > 0) {
      const baseAmount = amount / fromRate;
      return baseAmount * toRate;
    }

    return 0;
  }
}
