import { TextDiffComponent } from './text-diff.component';

describe('TextDiffComponent', () => {
  it('finds added, removed, and unchanged lines', () => {
    const component = new TextDiffComponent();
    component.leftText = 'one\ntwo\nthree';
    component.rightText = 'one\nnew\nthree';
    component.compare();
    expect(component.stats).toEqual({ added: 1, removed: 1, unchanged: 2 });
  });

  it('can ignore case and whitespace', () => {
    const component = new TextDiffComponent();
    component.ignoreCase = true;
    component.ignoreWhitespace = true;
    component.leftText = 'Hello World';
    component.rightText = 'hello world';
    component.compare();
    expect(component.stats.unchanged).toBe(1);
  });

  it('can ignore blank lines without changing displayed source lines', () => {
    const component = new TextDiffComponent();
    component.ignoreBlankLines = true;
    component.leftText = 'first\n\nlast';
    component.rightText = 'first\nlast';
    component.compare();

    expect(component.stats).toEqual({ added: 0, removed: 0, unchanged: 2 });
  });

  it('uses a bounded-memory comparison for large documents', () => {
    const component = new TextDiffComponent();
    const start = Array.from({ length: 720 }, (_value, index) => `start-${index}`);
    const end = Array.from({ length: 720 }, (_value, index) => `end-${index}`);
    component.leftText = [...start, 'old middle', ...end].join('\n');
    component.rightText = [...start, 'new middle', ...end].join('\n');
    component.compare();

    expect(component.usedLargeTextFallback).toBe(true);
    expect(component.stats.added).toBe(1);
    expect(component.stats.removed).toBe(1);
    expect(component.stats.unchanged).toBe(1440);
  });

  it('filters unchanged lines from the displayed diff', () => {
    const component = new TextDiffComponent();
    component.leftText = 'same\nold';
    component.rightText = 'same\nnew';
    component.compare();
    component.showChangesOnly = true;

    expect(component.visibleRows.map((row) => row.type)).toEqual(['removed', 'added']);
  });
});
