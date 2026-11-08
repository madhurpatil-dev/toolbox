export function evaluateArithmeticExpression(expression: string): number {
  const compactExpression = expression.replace(/\s+/g, '');
  const tokens = compactExpression.match(/\d+(?:\.\d*)?|\.\d+|[()+\-*/]/g) ?? [];
  if (!compactExpression || tokens.join('') !== compactExpression) {
    throw new Error('Invalid arithmetic expression.');
  }

  let position = 0;
  const parsePrimary = (): number => {
    const token = tokens[position++];
    if (token === '+') return parsePrimary();
    if (token === '-') return -parsePrimary();
    if (token === '(') {
      const value = parseExpression();
      if (tokens[position++] !== ')') throw new Error('Unclosed parenthesis.');
      return value;
    }
    if (token === undefined || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) {
      throw new Error('Expected a number.');
    }
    return Number(token);
  };

  const parseTerm = (): number => {
    let value = parsePrimary();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position++];
      const right = parsePrimary();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };

  const parseExpression = (): number => {
    let value = parseTerm();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++];
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };

  const result = parseExpression();
  if (position !== tokens.length || !Number.isFinite(result)) {
    throw new Error('Invalid arithmetic expression.');
  }
  return result;
}
