// currency-converter.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrencyConverterService {
  private apiUrl = environment.apiUrl;
  private cache: { [key: string]: any } = {};

  constructor(private http: HttpClient) {}

  getConversionRates(): Observable<any> {
    if (this.cache['conversionRates']) {
      return of(this.cache['conversionRates']);
    }
    return this.http.get(this.apiUrl).pipe(
      map(response => {
        this.cache['conversionRates'] = response;
        return response;
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  convert(amount: number, fromCurrency: string, toCurrency: string, rates: any): number {
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (fromRate && toRate) {
      const baseAmount = amount / fromRate;
      return baseAmount * toRate;
    }

    return 0;
  }
}
