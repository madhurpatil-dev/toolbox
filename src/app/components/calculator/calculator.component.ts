import { Component, HostListener, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { evaluateArithmeticExpression } from './arithmetic-expression';

interface CalculatorButton {
  label: string;
  value: string;
  type: 'number' | 'operator' | 'function'; // Added type for styling
}

@Component({
    selector: 'app-calculator',
    templateUrl: './calculator.component.html',
    styleUrls: ['./calculator.component.css'],
    standalone: false
})
export class CalculatorComponent implements OnInit {
  result: string = '';
  currentInput: string = '';
  isSmallScreen: boolean | undefined;
  isLargeScreen: boolean = false;
  history: string[] = []; // Added calculation history
  copyStatus = '';

  calculatorButtons: CalculatorButton[] = [
    { label: 'C', value: 'C', type: 'function' },
    { label: '⌫', value: 'backspace', type: 'function' }, // Added backspace
    { label: '%', value: '%', type: 'operator' }, // Added percentage
    { label: '÷', value: '/', type: 'operator' },
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '×', value: '*', type: 'operator' },
    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '-', value: '-', type: 'operator' },
    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '+', value: '+', type: 'operator' },
    { label: '±', value: 'negate', type: 'function' }, // Added negate
    { label: '0', value: '0', type: 'number' },
    { label: '.', value: '.', type: 'number' },
    { label: '=', value: '=', type: 'function' } // Added equals button
  ];

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.breakpointObserver.observe([Breakpoints.Large, Breakpoints.XLarge])
    .subscribe(result => {
      this.isLargeScreen = result.matches;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth <= 768; // Adjusted breakpoint
  }
  
  handleButtonClick(value: string, type: CalculatorButton['type']): void {
    if (value === '=') {
      const currentExpression = this.currentInput;
      this.calculateResult();
      if (this.result !== 'Error') {
        this.history = [`${currentExpression} = ${this.result}`, ...this.history].slice(0, 20);
        this.currentInput = this.result;
      }
    } else if (value === 'C') {
      this.clear();
    } else if (value === 'backspace') {
      this.currentInput = this.currentInput.slice(0, -1);
      if (this.currentInput) {
        this.calculateResult();
      } else {
        this.result = '';
      }
    } else if (value === 'negate') {
      if (this.currentInput) {
        if (this.currentInput.startsWith('-')) {
          this.currentInput = this.currentInput.substring(1);
        } else {
          this.currentInput = '-' + this.currentInput;
        }
        this.calculateResult();
      }
    } else {
      this.currentInput += value;
      if (type !== 'operator') {
        this.calculateResult(); // Calculate result as the user types
      }
    }
  }

  calculateResult(): void {
    try {
      const expression = this.currentInput.replace(/%/g, '/100');
      this.result = evaluateArithmeticExpression(expression).toString();
    } catch {
      this.result = 'Error';
    }
  }

  clear(): void {
    this.result = '';
    this.currentInput = '';
  }

  clearHistory(): void {
    this.history = [];
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent): void {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if (/^\d$/.test(event.key) || event.key === '.') {
      event.preventDefault();
      this.handleButtonClick(event.key, 'number');
    } else if (['+', '-', '*', '/', '%'].includes(event.key)) {
      event.preventDefault();
      this.handleButtonClick(event.key, 'operator');
    } else if (event.key === 'Enter' || event.key === '=') {
      event.preventDefault();
      this.handleButtonClick('=', 'function');
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.handleButtonClick('backspace', 'function');
    } else if (event.key === 'Escape') {
      this.clear();
    }
  }

  async copyResult(): Promise<void> {
    if (!this.result || this.result === 'Error') return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(this.result);
      this.copyStatus = 'Result copied.';
    } catch (error) {
      this.copyStatus = 'Could not copy. Select the result and copy it manually.';
      console.warn('Unable to copy the calculator result.', error);
    }
  }
}
