import { SecurityStudioComponent } from './security-studio.component';

describe('SecurityStudioComponent', () => {
  it('generates passwords and passphrases', () => {
    const component = new SecurityStudioComponent();
    component.length = 24;
    component.generatePassword();
    component.passphraseWords = 5;
    component.generatePassphrase();
    expect(component.password.length).toBe(24);
    expect(component.passphrase.split('-').length).toBe(5);
  });

  it('audits password requirements locally', () => {
    const component = new SecurityStudioComponent();
    component.auditPassword = 'Strong!Pass123';
    expect(component.auditScore).toBeGreaterThanOrEqual(83);
    expect(component.auditChecks.every((check) => check.passed)).toBe(true);
  });
});
