import { Component } from '@angular/core';

export type DiffRow = { type: 'same' | 'removed' | 'added'; left?: string; right?: string; leftNo?: number; rightNo?: number };

@Component({
  selector: 'app-text-diff',
  templateUrl: './text-diff.component.html',
  styleUrls: ['./text-diff.component.css'],
  standalone: false,
})
export class TextDiffComponent {
  leftText = '';
  rightText = '';
  rows: DiffRow[] = [];
  ignoreWhitespace = false;
  ignoreCase = false;
  stats = { added: 0, removed: 0, unchanged: 0 };
  copyStatus = '';

  compare(): void {
    const left = this.lines(this.leftText);
    const right = this.lines(this.rightText);
    const normalizedLeft = left.map((line) => this.normalize(line));
    const normalizedRight = right.map((line) => this.normalize(line));
    const matrix = Array.from({ length: normalizedLeft.length + 1 }, () =>
      Array(normalizedRight.length + 1).fill(0),
    );

    for (let i = normalizedLeft.length - 1; i >= 0; i--) {
      for (let j = normalizedRight.length - 1; j >= 0; j--) {
        matrix[i][j] = normalizedLeft[i] === normalizedRight[j]
          ? matrix[i + 1][j + 1] + 1
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
      }
    }

    const rows: DiffRow[] = [];
    let i = 0;
    let j = 0;
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    while (i < normalizedLeft.length || j < normalizedRight.length) {
      if (i < normalizedLeft.length && j < normalizedRight.length && normalizedLeft[i] === normalizedRight[j]) {
        rows.push({ type: 'same', left: left[i], right: right[j], leftNo: i + 1, rightNo: j + 1 });
        unchanged++;
        i++;
        j++;
      } else if (j < normalizedRight.length && (i === normalizedLeft.length || matrix[i][j + 1] >= matrix[i + 1][j])) {
        rows.push({ type: 'added', right: right[j], rightNo: j + 1 });
        added++;
        j++;
      } else {
        rows.push({ type: 'removed', left: left[i], leftNo: i + 1 });
        removed++;
        i++;
      }
    }
    this.rows = rows;
    this.stats = { added, removed, unchanged };
  }

  swap(): void {
    [this.leftText, this.rightText] = [this.rightText, this.leftText];
    this.compare();
  }

  clear(): void {
    this.leftText = '';
    this.rightText = '';
    this.rows = [];
    this.stats = { added: 0, removed: 0, unchanged: 0 };
  }

  async copyAdded(): Promise<void> {
    const value = this.rows.filter((row) => row.type === 'added').map((row) => row.right ?? '').join('\n');
    await navigator.clipboard?.writeText(value);
    this.copyStatus = 'Added lines copied';
  }

  private lines(value: string): string[] {
    return value === '' ? [] : value.replace(/\r\n/g, '\n').split('\n');
  }

  private normalize(value: string): string {
    let result = value;
    if (this.ignoreWhitespace) result = result.replace(/\s+/g, '');
    if (this.ignoreCase) result = result.toLowerCase();
    return result;
  }
}
