import { ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { CurrencyconverterComponent } from './currencyconverter.component';
import { CurrencyConverterService } from '../../services/currency-converter.service';

describe('CurrencyconverterComponent', () => {
  it('loads rates on initialization and converts the default currencies immediately', () => {
    const converterService = {
      getConversionRates: () => of({ rates: { USD: 1, INR: 83 } }),
      convert: (amount: number, from: string, to: string, rates: Record<string, number>) =>
        amount / rates[from] * rates[to],
    } as unknown as CurrencyConverterService;
    const breakpointObserver = {
      observe: () => of({ matches: true }),
    } as unknown as BreakpointObserver;
    const changeDetectorRef = {
      markForCheck: vi.fn(),
    } as unknown as ChangeDetectorRef;

    const component = new CurrencyconverterComponent(
      converterService,
      breakpointObserver,
      changeDetectorRef,
    );
    component.ngOnInit();

    expect(component.fromCurrency).toBe('USD');
    expect(component.toCurrency).toBe('INR');
    expect(component.conversionRates).toEqual({ USD: 1, INR: 83 });
    expect(component.result).toBe(83);
    expect(component.isLoadingRates).toBe(false);
  });
});
