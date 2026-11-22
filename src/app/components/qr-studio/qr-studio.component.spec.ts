import { QrStudioComponent } from './qr-studio.component';

describe('QrStudioComponent', () => {
  it('builds text, URL, Wi-Fi, and contact payloads', () => {
    const component = new QrStudioComponent();

    component.qrType = 'text';
    component.textValue = 'Hello QR';
    expect(component.payload).toBe('Hello QR');

    component.qrType = 'url';
    component.urlValue = 'example.com';
    expect(component.payload).toBe('https://example.com');

    component.qrType = 'wifi';
    component.wifiName = 'Office';
    component.wifiPassword = 'secret';
    component.wifiSecurity = 'WPA';
    expect(component.payload).toBe('WIFI:T:WPA;S:Office;P:secret;;');

    component.qrType = 'contact';
    component.contactName = 'Alex';
    component.contactPhone = '+123';
    component.contactEmail = 'alex@example.com';
    expect(component.payload).toContain('BEGIN:VCARD');
    expect(component.payload).toContain('TEL:+123');
  });

  it('clears the generated code when the payload is empty', async () => {
    const component = new QrStudioComponent();
    component.qrDataUrl = 'existing';
    component.textValue = '';
    await component.generate();
    expect(component.qrDataUrl).toBe('');
  });
});
