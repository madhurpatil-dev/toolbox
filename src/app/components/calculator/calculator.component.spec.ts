import { evaluateArithmeticExpression } from './arithmetic-expression';

describe('evaluateArithmeticExpression', () => {
  it('respects standard operator precedence and parentheses', () => {
    expect(evaluateArithmeticExpression('2 + 3 * (4 - 1)')).toBe(11);
  });

  it('supports unary signs and decimals', () => {
    expect(evaluateArithmeticExpression('-1.5 * 2')).toBe(-3);
  });

  it('rejects invalid input and non-finite results', () => {
    expect(() => evaluateArithmeticExpression('1 + alert(1)')).toThrow();
    expect(() => evaluateArithmeticExpression('1 / 0')).toThrow();
  });
});
