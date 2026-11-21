import { evaluateArithmeticExpression } from './arithmetic-expression';
import { CalculatorComponent } from './calculator.component';

describe('evaluateArithmeticExpression', () => {
  it('respects standard operator precedence and parentheses', () => {
    expect(evaluateArithmeticExpression('2 + 3 * (4 - 1)')).toBe(11);
  });

  describe('CalculatorComponent keyboard input', () => {
    it('accepts calculator keys and records an evaluated expression', () => {
      const component = new CalculatorComponent({ observe: vi.fn() } as any);
      ['2', '+', '3', 'Enter'].forEach((key) => {
        component.handleKeyboardInput(new KeyboardEvent('keydown', { key, cancelable: true }));
      });

      expect(component.result).toBe('5');
      expect(component.currentInput).toBe('5');
      expect(component.history).toEqual(['2+3 = 5']);
    });
  });

  it('supports unary signs and decimals', () => {
    expect(evaluateArithmeticExpression('-1.5 * 2')).toBe(-3);
  });

  it('rejects invalid input and non-finite results', () => {
    expect(() => evaluateArithmeticExpression('1 + alert(1)')).toThrow();
    expect(() => evaluateArithmeticExpression('1 / 0')).toThrow();
  });
});
