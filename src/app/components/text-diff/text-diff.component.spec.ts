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
});
