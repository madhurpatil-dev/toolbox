import { UnitConverterComponent } from './unit-converter.component';

describe('UnitConverterComponent', () => {
  it('converts length and temperature units', () => {
    const component = new UnitConverterComponent();
    component.value = 1;
    component.from = 'm';
    component.to = 'km';
    component.convert();
    expect(component.result).toBeCloseTo(0.001);

    component.category = 'Temperature';
    component.value = 32;
    component.from = '°F';
    component.to = '°C';
    component.convert();
    expect(component.result).toBeCloseTo(0);
  });
});
