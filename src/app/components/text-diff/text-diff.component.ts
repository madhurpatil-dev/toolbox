import { Component } from '@angular/core';

export type DiffRow = { type: 'same' | 'removed' | 'added'; left?: string; right?: string; leftNo?: number; rightNo?: number };
type DiffView = 'split' | 'unified';

@Component({
  selector: 'app-text-diff',
  templateUrl: './text-diff.component.html',
  styleUrls: ['./text-diff.component.css'],
  standalone: false,
})
export class TextDiffComponent {
  private readonly maxMatrixCells = 500_000;
  leftText = '';
  rightText = '';
  rows: DiffRow[] = [];
  ignoreWhitespace = false;
  ignoreCase = false;
  ignoreBlankLines = false;
  showChangesOnly = false;
  view: DiffView = 'split';
  stats = { added: 0, removed: 0, unchanged: 0 };
  copyStatus = '';
  inputStatus = '';
  leftFileName = '';
  rightFileName = '';
  usedLargeTextFallback = false;

  compare(): void {
    const allLeftLines = this.lines(this.leftText);
    const allRightLines = this.lines(this.rightText);
    const leftLineNumbers = allLeftLines.map((_line, index) => index + 1);
    const rightLineNumbers = allRightLines.map((_line, index) => index + 1);
    const left = this.ignoreBlankLines
      ? allLeftLines.filter((line) => line.trim() !== '')
      : allLeftLines;
    const right = this.ignoreBlankLines
      ? allRightLines.filter((line) => line.trim() !== '')
      : allRightLines;
    const visibleLeftLineNumbers = this.ignoreBlankLines
      ? allLeftLines.map((line, index) => line.trim() === '' ? -1 : index + 1).filter((lineNumber) => lineNumber > 0)
      : leftLineNumbers;
    const visibleRightLineNumbers = this.ignoreBlankLines
      ? allRightLines.map((line, index) => line.trim() === '' ? -1 : index + 1).filter((lineNumber) => lineNumber > 0)
      : rightLineNumbers;
    const normalizedLeft = left.map((line) => this.normalize(line));
    const normalizedRight = right.map((line) => this.normalize(line));
    this.usedLargeTextFallback = normalizedLeft.length * normalizedRight.length > this.maxMatrixCells;

    let rows: DiffRow[];
    if (this.usedLargeTextFallback) {
      rows = this.buildLargeDiff(left, right, visibleLeftLineNumbers, visibleRightLineNumbers, normalizedLeft, normalizedRight);
    } else {
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

      rows = [];
      let i = 0;
      let j = 0;
      while (i < normalizedLeft.length || j < normalizedRight.length) {
        if (i < normalizedLeft.length && j < normalizedRight.length && normalizedLeft[i] === normalizedRight[j]) {
          rows.push({ type: 'same', left: left[i], right: right[j], leftNo: visibleLeftLineNumbers[i], rightNo: visibleRightLineNumbers[j] });
          i++;
          j++;
        } else if (j < normalizedRight.length && (i === normalizedLeft.length || matrix[i][j + 1] > matrix[i + 1][j])) {
          rows.push({ type: 'added', right: right[j], rightNo: visibleRightLineNumbers[j] });
          j++;
        } else {
          rows.push({ type: 'removed', left: left[i], leftNo: visibleLeftLineNumbers[i] });
          i++;
        }
      }
    }

    let added = 0;
    let removed = 0;
    let unchanged = 0;
    for (const row of rows) {
      if (row.type === 'added') added++;
      else if (row.type === 'removed') removed++;
      else unchanged++;
    }
    this.rows = rows;
    this.stats = { added, removed, unchanged };
    this.copyStatus = '';
    this.inputStatus = '';
  }

  get visibleRows(): DiffRow[] {
    return this.showChangesOnly ? this.rows.filter((row) => row.type !== 'same') : this.rows;
  }

  async onFileSelected(event: Event, side: 'left' | 'right'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.inputStatus = 'Choose a text file smaller than 5 MB.';
      return;
    }

    try {
      const content = await file.text();
      if (side === 'left') {
        this.leftText = content;
        this.leftFileName = file.name;
      } else {
        this.rightText = content;
        this.rightFileName = file.name;
      }
      this.compare();
      this.inputStatus = `${file.name} loaded`;
    } catch (error) {
      console.error('Unable to read text diff file.', error);
      this.inputStatus = `Could not read ${file.name}. Select a text file and try again.`;
    }
  }

  downloadDiff(): void {
    if (!this.rows.length) return;
    const leftName = this.safeFilename(this.leftFileName || 'original.txt');
    const rightName = this.safeFilename(this.rightFileName || 'changed.txt');
    const body = this.rows.map((row) => {
      if (row.type === 'same') return ` ${row.left ?? ''}`;
      if (row.type === 'removed') return `-${row.left ?? ''}`;
      return `+${row.right ?? ''}`;
    }).join('\n');
    const patch = [
      `--- ${leftName}`,
      `+++ ${rightName}`,
      `@@ -1,${this.lineCount(this.leftText)} +1,${this.lineCount(this.rightText)} @@`,
      body,
      '',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([patch], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'text-diff.patch';
    link.click();
    URL.revokeObjectURL(url);
  }

  swap(): void {
    [this.leftText, this.rightText] = [this.rightText, this.leftText];
    [this.leftFileName, this.rightFileName] = [this.rightFileName, this.leftFileName];
    this.compare();
  }

  clear(): void {
    this.leftText = '';
    this.rightText = '';
    this.rows = [];
    this.stats = { added: 0, removed: 0, unchanged: 0 };
    this.leftFileName = '';
    this.rightFileName = '';
    this.copyStatus = '';
    this.inputStatus = '';
    this.usedLargeTextFallback = false;
  }

  async copyAdded(): Promise<void> {
    const value = this.rows.filter((row) => row.type === 'added').map((row) => row.right ?? '').join('\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(value);
      this.copyStatus = 'Added lines copied';
    } catch (error) {
      console.warn('Unable to copy added diff lines.', error);
      this.copyStatus = 'Could not copy added lines.';
    }
  }

  private lines(value: string): string[] {
    if (value === '') return [];
    const normalized = value.replace(/\r\n?/g, '\n');
    const lines = normalized.split('\n');
    if (normalized.endsWith('\n')) lines.pop();
    return lines;
  }

  private normalize(value: string): string {
    let result = value;
    if (this.ignoreWhitespace) result = result.replace(/\s+/g, '');
    if (this.ignoreCase) result = result.toLowerCase();
    return result;
  }

  private buildLargeDiff(
    left: string[],
    right: string[],
    leftLineNumbers: number[],
    rightLineNumbers: number[],
    normalizedLeft: string[],
    normalizedRight: string[],
  ): DiffRow[] {
    let prefix = 0;
    while (prefix < left.length && prefix < right.length && normalizedLeft[prefix] === normalizedRight[prefix]) prefix++;
    let suffix = 0;
    while (
      suffix < left.length - prefix
      && suffix < right.length - prefix
      && normalizedLeft[left.length - suffix - 1] === normalizedRight[right.length - suffix - 1]
    ) suffix++;

    const rows: DiffRow[] = [];
    for (let i = 0; i < prefix; i++) {
      rows.push({ type: 'same', left: left[i], right: right[i], leftNo: leftLineNumbers[i], rightNo: rightLineNumbers[i] });
    }
    for (let i = prefix; i < left.length - suffix; i++) {
      rows.push({ type: 'removed', left: left[i], leftNo: leftLineNumbers[i] });
    }
    for (let j = prefix; j < right.length - suffix; j++) {
      rows.push({ type: 'added', right: right[j], rightNo: rightLineNumbers[j] });
    }
    for (let offset = suffix; offset > 0; offset--) {
      const i = left.length - offset;
      const j = right.length - offset;
      rows.push({ type: 'same', left: left[i], right: right[j], leftNo: leftLineNumbers[i], rightNo: rightLineNumbers[j] });
    }
    return rows;
  }

  private lineCount(value: string): number {
    return this.lines(value).length;
  }

  private safeFilename(value: string): string {
    return value.replace(/[\r\n]/g, '').replace(/[<>:"|?*]/g, '_');
  }
}
