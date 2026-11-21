import type { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CurrencyConverterService } from './currency-converter.service';

describe('CurrencyConverterService', () => {
  it('converts only finite non-negative amounts with valid rates', () => {
    const service = new CurrencyConverterService({} as HttpClient);
    const rates = { USD: 1, INR: 80 };

    expect(service.convert(2, 'USD', 'INR', rates)).toBe(160);
    expect(service.convert(-2, 'USD', 'INR', rates)).toBe(0);
    expect(service.convert(2, 'USD', 'INR', { USD: 1 })).toBe(0);
  });

  it('caches valid rates and propagates rate-loading errors', () => {
    const get = vi.fn().mockReturnValue(of({ rates: { USD: 1, INR: 80 } }));
    const service = new CurrencyConverterService({ get } as unknown as HttpClient);
    service.getConversionRates().subscribe();
    service.getConversionRates().subscribe();
    expect(get).toHaveBeenCalledOnce();

    const failedService = new CurrencyConverterService({
      get: () => throwError(() => new Error('offline')),
    } as unknown as HttpClient);
    const onError = vi.fn();
    failedService.getConversionRates().subscribe({ error: onError });
    expect(onError).toHaveBeenCalledOnce();
  });
});
