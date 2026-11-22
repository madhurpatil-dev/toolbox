import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
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
  isCameraStarting = false;
  private stream?: MediaStream;
  private scanFrame?: number;
  private imageDecodeId = 0;
  private isCameraDetecting = false;

  constructor(private readonly changeDetectorRef?: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setTab(tab: 'generate' | 'scan'): void {
    this.activeTab = tab;
    if (tab === 'scan') this.scanStatus = '';
    this.refreshView();
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
      this.refreshView();
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
      this.refreshView();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const result = await this.decodeImageElement(image);
      if (decodeId !== this.imageDecodeId) return;
      this.scannedValue = result?.data ?? '';
      this.scanStatus = result ? 'QR code found.' : 'No QR code found in this image.';
      this.refreshView();
    } catch (error) {
      if (decodeId === this.imageDecodeId) {
        this.scanStatus = 'The image could not be read.';
        console.warn('Unable to scan uploaded QR image.', error);
        this.refreshView();
      }
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (decodeId === this.imageDecodeId) {
        this.isDecodingImage = false;
        this.refreshView();
      }
    }
  }

  async startCamera(): Promise<void> {
    if (this.isCameraStarting || this.isScanning) return;
    if (!window.isSecureContext) {
      this.scanStatus = 'Camera access requires HTTPS or localhost.';
      this.refreshView();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.scanStatus = 'Camera scanning is not supported by this browser.';
      this.refreshView();
      return;
    }

    this.isCameraStarting = true;
    this.isScanning = false;
    this.scannedValue = '';
    this.scanStatus = 'Starting camera...';
    this.refreshView();

    try {
      const streamPromise = navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const stream = await Promise.race([
        streamPromise,
        new Promise<never>((_resolve, reject) =>
          window.setTimeout(() => reject(new Error('Camera permission timed out.')), 15000),
        ),
      ]);
      this.stream = stream;
      this.isScanning = true;
      this.scanStatus = 'Point your camera at a QR code.';
      this.refreshView();

      const video = this.videoElement?.nativeElement;
      if (!video) throw new Error('Camera preview is unavailable.');

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await Promise.race([
        this.waitForVideoReady(video),
        new Promise<never>((_resolve, reject) =>
          window.setTimeout(() => reject(new Error('Camera preview timed out.')), 10000),
        ),
      ]);
      await video.play();
      this.isCameraStarting = false;
      this.refreshView();
      this.scanCameraFrame();
    } catch (error) {
      this.isScanning = false;
      this.isCameraStarting = false;
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.scanStatus = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access and try again.'
        : 'Camera could not start. Check browser permissions and try again.';
      console.warn('Unable to start QR camera.', error);
      this.refreshView();
    }
  }

  stopCamera(): void {
    if (this.scanFrame) window.clearTimeout(this.scanFrame);
    this.scanFrame = undefined;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.isScanning = false;
    this.isCameraStarting = false;
    this.isCameraDetecting = false;
    this.refreshView();
  }

  copyScannedValue(): void {
    if (this.scannedValue) void navigator.clipboard?.writeText(this.scannedValue);
  }

  private scanCameraFrame(): void {
    const video = this.videoElement?.nativeElement;
    const canvas = this.scanCanvas?.nativeElement;
    if (!this.isScanning || !video || !canvas) return;
    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      this.scanFrame = requestAnimationFrame(() => this.scanCameraFrame());
      return;
    }

    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context) {
      context.drawImage(video, 0, 0, width, height);
      void this.decodeCameraFrame(canvas, width, height);
    }
    this.scanFrame = window.setTimeout(() => this.scanCameraFrame(), 180) as unknown as number;
  }

  private async decodeCameraFrame(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
  ): Promise<void> {
    if (!this.isScanning || this.isCameraDetecting) return;
    this.isCameraDetecting = true;
    try {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      const nativeResult = await this.decodeWithBrowserDetector(canvas);
      if (nativeResult?.data) {
        this.scannedValue = nativeResult.data;
        this.scanStatus = 'QR code found.';
        this.stopCamera();
        this.refreshView();
        return;
      }

      const imageData = context.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
      if (result?.data) {
        this.scannedValue = result.data;
        this.scanStatus = 'QR code found.';
        this.stopCamera();
        this.refreshView();
      }
    } finally {
      this.isCameraDetecting = false;
    }
  }

  private waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= video.HAVE_CURRENT_DATA) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const handleReady = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error('Camera preview could not be loaded.'));
      };
      const cleanup = () => {
        video.removeEventListener('loadeddata', handleReady);
        video.removeEventListener('canplay', handleReady);
        video.removeEventListener('error', handleError);
      };
      video.addEventListener('loadeddata', handleReady);
      video.addEventListener('canplay', handleReady);
      video.addEventListener('error', handleError);
    });
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
    const nativeResult = await this.decodeWithBrowserDetector(image);
    if (nativeResult) return nativeResult;

    const scales = [
      longestSide,
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

  private async decodeWithBrowserDetector(
    image: CanvasImageSource,
  ): Promise<{ data: string } | undefined> {
    const barcodeDetectorApi = (
      window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => {
          detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;
    if (!barcodeDetectorApi) return undefined;

    try {
      const detector = new barcodeDetectorApi({ formats: ['qr_code'] });
      const results = await detector.detect(image);
      const value = results.find((result) => result.rawValue)?.rawValue;
      return value ? { data: value } : undefined;
    } catch {
      return undefined;
    }
  }

  private refreshView(): void {
    this.changeDetectorRef?.markForCheck();
    this.changeDetectorRef?.detectChanges();
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
