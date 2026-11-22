import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

type QrType = 'text' | 'url' | 'wifi' | 'contact';

@Component({
  selector: 'app-qr-studio',
  templateUrl: './qr-studio.component.html',
  styleUrls: ['./qr-studio.component.css'],
  standalone: false,
})
export class QrStudioComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('scanCanvas') scanCanvas?: ElementRef<HTMLCanvasElement>;

  activeTab: 'generate' | 'scan' = 'generate';
  qrType: QrType = 'text';
  textValue = '';
  urlValue = '';
  wifiName = '';
  wifiPassword = '';
  wifiSecurity: 'WPA' | 'WEP' | 'nopass' = 'WPA';
  contactName = '';
  contactPhone = '';
  contactEmail = '';
  foreground = '#172033';
  background = '#ffffff';
  qrDataUrl = '';
  scannedValue = '';
  scanStatus = '';
  isScanning = false;
  isDecodingImage = false;
  private stream?: MediaStream;
  private scanFrame?: number;
  private imageDecodeId = 0;

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setTab(tab: 'generate' | 'scan'): void {
    this.activeTab = tab;
    if (tab === 'scan') this.scanStatus = '';
  }

  get payload(): string {
    switch (this.qrType) {
      case 'url':
        return this.normalizeUrl(this.urlValue);
      case 'wifi':
        if (!this.wifiName) return '';
        const password = this.wifiSecurity === 'nopass' ? '' : this.wifiPassword;
        return `WIFI:T:${this.wifiSecurity};S:${this.escapeWifi(this.wifiName)};P:${this.escapeWifi(password)};;`;
      case 'contact':
        if (!this.contactName && !this.contactPhone && !this.contactEmail) return '';
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${this.contactName}`,
          this.contactPhone ? `TEL:${this.contactPhone}` : '',
          this.contactEmail ? `EMAIL:${this.contactEmail}` : '',
          'END:VCARD',
        ].filter(Boolean).join('\n');
      default:
        return this.textValue;
    }
  }

  async generate(): Promise<void> {
    if (!this.payload) {
      this.qrDataUrl = '';
      return;
    }

    this.qrDataUrl = await QRCode.toDataURL(this.payload, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: this.foreground, light: this.background },
    });
  }

  async download(): Promise<void> {
    if (!this.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = `qr-code-${Date.now()}.png`;
    link.click();
  }

  async share(): Promise<void> {
    if (!this.qrDataUrl) return;
    const blob = await (await fetch(this.qrDataUrl)).blob();
    const file = new File([blob], 'qr-code.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'QR code', files: [file] });
    } else {
      await this.download();
    }
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    input.value = '';
    if (!file.type.startsWith('image/') && file.type !== '') {
      this.scanStatus = 'Please select a valid image file.';
      return;
    }

    const decodeId = ++this.imageDecodeId;
    if (this.isDecodingImage) this.stopCamera();
    this.isDecodingImage = true;
    this.scannedValue = '';
    this.scanStatus = 'Preparing image...';

    let imageUrl: string | undefined;
    try {
      imageUrl = URL.createObjectURL(file);
      const image = await this.loadImage(imageUrl);
      if (decodeId !== this.imageDecodeId) return;
      this.scanStatus = 'Scanning image...';
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const result = await this.decodeImageElement(image);
      if (decodeId !== this.imageDecodeId) return;
      this.scannedValue = result?.data ?? '';
      this.scanStatus = result ? 'QR code found.' : 'No QR code found in this image.';
    } catch (error) {
      if (decodeId === this.imageDecodeId) {
        this.scanStatus = 'The image could not be read.';
        console.warn('Unable to scan uploaded QR image.', error);
      }
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (decodeId === this.imageDecodeId) {
        this.isDecodingImage = false;
      }
    }
  }

  async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.scanStatus = 'Camera scanning is not supported by this browser.';
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.isScanning = true;
      this.scanStatus = 'Point your camera at a QR code.';
      await this.waitForVideo();
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        await this.videoElement.nativeElement.play();
        this.scanCameraFrame();
      }
    } catch (error) {
      this.isScanning = false;
      this.scanStatus = 'Camera access was blocked or unavailable.';
      console.warn('Unable to start QR camera.', error);
    }
  }

  stopCamera(): void {
    if (this.scanFrame) cancelAnimationFrame(this.scanFrame);
    this.scanFrame = undefined;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.isScanning = false;
  }

  copyScannedValue(): void {
    if (this.scannedValue) void navigator.clipboard?.writeText(this.scannedValue);
  }

  private scanCameraFrame(): void {
    const video = this.videoElement?.nativeElement;
    const canvas = this.scanCanvas?.nativeElement;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      this.scanFrame = requestAnimationFrame(() => this.scanCameraFrame());
      return;
    }

    const size = Math.min(video.videoWidth, video.videoHeight, 640);
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context) {
      const x = (video.videoWidth - size) / 2;
      const y = (video.videoHeight - size) / 2;
      context.drawImage(video, x, y, size, size, 0, 0, size, size);
      const imageData = context.getImageData(0, 0, size, size);
      const result = jsQR(imageData.data, size, size);
      if (result?.data) {
        this.scannedValue = result.data;
        this.scanStatus = 'QR code found.';
        this.stopCamera();
        return;
      }
    }
    this.scanFrame = requestAnimationFrame(() => this.scanCameraFrame());
  }

  private waitForVideo(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 50));
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = window.setTimeout(
        () => reject(new Error('Timed out while loading the image.')),
        10000,
      );
      image.onload = () => {
        window.clearTimeout(timeout);
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error('The uploaded image has no readable dimensions.'));
          return;
        }
        resolve(image);
      };
      image.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('Image decoding failed.'));
      };
      image.src = url;
    });
  }

  private async decodeImageElement(image: HTMLImageElement): Promise<{ data: string } | undefined> {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const longestSide = Math.max(sourceWidth, sourceHeight);
    const scales = [
      Math.min(longestSide, 1600),
      Math.min(longestSide, 1200),
      Math.min(longestSide, 800),
    ];

    for (const targetSize of [...new Set(scales)].filter((size) => size > 0)) {
      const scale = Math.min(1, targetSize / Math.max(sourceWidth, sourceHeight));
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
      if (!context) continue;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, width, height, {
        inversionAttempts: 'attemptBoth',
      });
      if (result?.data) return { data: result.data };
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    return undefined;
  }

  private normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  private escapeWifi(value: string): string {
    return value.replace(/([\\;,])/g, '\\$1');
  }
}
