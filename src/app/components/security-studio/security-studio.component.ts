import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-security-studio',
  templateUrl: './security-studio.component.html',
  styleUrls: ['./security-studio.component.css'],
  standalone: false,
})
export class SecurityStudioComponent implements OnInit {
  password = '';
  length = 20;
  uppercase = true;
  lowercase = true;
  numbers = true;
  symbols = true;
  excludeAmbiguous = true;
  passphraseWords = 5;
  passphraseSeparator = '-';
  passphrase = '';
  auditPassword = '';

  private readonly words = [
    'amber','anchor','apricot','bamboo','bridge','canyon','cedar','cobalt','comet','coral',
    'dawn','delta','ember','falcon','forest','galaxy','harbor','iris','island','jacket',
    'lagoon','lantern','lotus','maple','marble','meadow','mint','nebula','olive','orbit',
    'paper','pebble','pepper','pixel','river','rocket','saffron','shadow','summit','sunset',
    'thunder','tiger','valley','violet','walnut','willow','winter','yellow','zenith',
  ];

  ngOnInit(): void {
    this.generatePassword();
    this.generatePassphrase();
  }

  generatePassword(): void {
    const alphabet: string[] = [];
    if (this.lowercase) alphabet.push(...this.expand('abcdefghijkmnopqrstuvwxyz'));
    if (this.uppercase) alphabet.push(...this.expand('ABCDEFGHJKLMNPQRSTUVWXYZ'));
    if (this.numbers) alphabet.push(...this.expand('23456789'));
    if (this.symbols) alphabet.push(...this.expand('!@#$%^&*_-+='));
    if (alphabet.length === 0) {
      alphabet.push(...this.expand('abcdefghijkmnopqrstuvwxyz'));
    }
    const length = Math.min(128, Math.max(4, Math.round(this.length)));
    this.password = Array.from({ length }, () => alphabet[this.randomIndex(alphabet.length)]).join('');
  }

  generatePassphrase(): void {
    const count = Math.min(12, Math.max(3, Math.round(this.passphraseWords)));
    this.passphrase = Array.from({ length: count }, () => this.words[this.randomIndex(this.words.length)])
      .join(this.passphraseSeparator);
  }

  copyPassword(): void {
    void navigator.clipboard?.writeText(this.password);
  }

  copyPassphrase(): void {
    void navigator.clipboard?.writeText(this.passphrase);
  }

  get entropy(): number {
    const pool = this.estimatePool(this.password);
    return pool > 0 ? Math.round(this.password.length * Math.log2(pool)) : 0;
  }

  get strength(): 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong' {
    const score = this.entropy;
    if (score < 28) return 'Very weak';
    if (score < 45) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Strong';
    return 'Very strong';
  }

  get strengthPercent(): number {
    return Math.min(100, Math.round(this.entropy / 1.28));
  }

  get auditChecks(): Array<{ label: string; passed: boolean }> {
    const value = this.auditPassword;
    return [
      { label: 'At least 12 characters', passed: value.length >= 12 },
      { label: 'Contains uppercase letter', passed: /[A-Z]/.test(value) },
      { label: 'Contains lowercase letter', passed: /[a-z]/.test(value) },
      { label: 'Contains a number', passed: /\d/.test(value) },
      { label: 'Contains a symbol', passed: /[^A-Za-z0-9]/.test(value) },
      { label: 'Avoids repeats', passed: !/(.)\1{2,}/.test(value) },
    ];
  }

  get auditScore(): number {
    const passed = this.auditChecks.filter((check) => check.passed).length;
    return this.auditPassword ? Math.round(passed / this.auditChecks.length * 100) : 0;
  }

  private expand(value: string): string[] {
    return Array.from(value);
  }

  private randomIndex(max: number): number {
    if (globalThis.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      globalThis.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  private estimatePool(value: string): number {
    let pool = 0;
    if (/[a-z]/.test(value)) pool += 26;
    if (/[A-Z]/.test(value)) pool += 26;
    if (/\d/.test(value)) pool += 10;
    if (/[^A-Za-z0-9]/.test(value)) pool += 32;
    return pool;
  }
}
