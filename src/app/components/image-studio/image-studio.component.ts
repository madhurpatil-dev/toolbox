import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';

export type ImageOutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageDimensions {
  width: number;
  height: number;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_DIMENSION = 10_000;
const SUPPORTED_INPUT_TYPES = new Set([
  'image/avif',
  'image/bmp',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function calculateOutputDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
  preserveAspectRatio: boolean,
): ImageDimensions | undefined {
  const sourceIsValid = Number.isInteger(sourceWidth)
    && Number.isInteger(sourceHeight)
    && sourceWidth > 0
    && sourceHeight > 0
    && sourceWidth * sourceHeight <= MAX_IMAGE_PIXELS;
  const targetIsValid = [maxWidth, maxHeight].every(
    (value) => Number.isInteger(value) && value > 0 && value <= MAX_DIMENSION,
  );
  if (!sourceIsValid || !targetIsValid) {
    return undefined;
  }

  if (!preserveAspectRatio) {
    return maxWidth * maxHeight <= MAX_IMAGE_PIXELS ? { width: maxWidth, height: maxHeight } : undefined;
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
  const width = Math.max(1, Math.floor(sourceWidth * scale));
  const height = Math.max(1, Math.floor(sourceHeight * scale));
  return width * height <= MAX_IMAGE_PIXELS ? { width, height } : undefined;
}

export function formatImageSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

@Component({
  selector: 'app-image-studio',
  templateUrl: './image-studio.component.html',
  styleUrls: ['./image-studio.component.css'],
  standalone: false,
})
export class ImageStudioComponent implements OnDestroy {
  fileName = '';
  originalFileSize = 0;
  sourceImage?: HTMLImageElement;
  sourceUrl = '';
  outputUrl = '';
  outputFileName = '';
  outputFileSize = 0;
  maxWidth = 0;
  maxHeight = 0;
  preserveAspectRatio = true;
  outputFormat: ImageOutputFormat = 'image/webp';
  quality = 0.85;
  isLoading = false;
  isProcessing = false;
  isDragOver = false;
  statusMessage = '';
  errorMessage = '';

  private fileSelectionId = 0;
  private processingId = 0;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  get outputDimensions(): ImageDimensions | undefined {
    if (!this.sourceImage) return undefined;
    return calculateOutputDimensions(
      this.sourceImage.naturalWidth,
      this.sourceImage.naturalHeight,
      Number(this.maxWidth),
      Number(this.maxHeight),
      this.preserveAspectRatio,
    );
  }

  get outputFormatExtension(): string {
    return this.outputFormat.slice('image/'.length);
  }

  get sizeChange(): string {
    if (!this.outputFileSize || !this.originalFileSize) return '';
    const change = ((this.originalFileSize - this.outputFileSize) / this.originalFileSize) * 100;
    return change >= 0
      ? `${change.toFixed(1)}% smaller`
      : `${Math.abs(change).toFixed(1)}% larger`;
  }

  ngOnDestroy(): void {
    this.fileSelectionId++;
    this.processingId++;
    this.clearSource();
    this.clearOutput();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    input.value = '';
    if (file) await this.loadFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) await this.loadFile(file);
  }

  invalidateOutput(): void {
    this.processingId++;
    this.clearOutput();
    this.statusMessage = this.sourceImage ? 'Settings changed. Process the image to create a new output.' : '';
  }

  async processImage(): Promise<void> {
    const image = this.sourceImage;
    const dimensions = this.outputDimensions;
    if (!image || !dimensions) {
      this.errorMessage = 'Enter valid dimensions within the 10,000 px and 40-megapixel limits.';
      this.statusMessage = '';
      return;
    }

    const requestId = ++this.processingId;
    this.clearOutput();
    this.errorMessage = '';
    this.statusMessage = 'Processing locally in your browser...';
    this.isProcessing = true;

    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is unavailable.');

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      if (this.outputFormat === 'image/jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, dimensions.width, dimensions.height);
      }
      context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('The browser could not encode this image.')),
          this.outputFormat,
          Number(this.quality),
        );
      });

      if (requestId !== this.processingId) return;
      if (blob.type !== this.outputFormat) {
        throw new Error(`This browser cannot export ${this.outputFormatExtension.toUpperCase()} images.`);
      }

      this.outputUrl = URL.createObjectURL(blob);
      this.outputFileSize = blob.size;
      this.outputFileName = `${this.fileName.replace(/\.[^.]+$/, '') || 'image'}.${this.outputFormatExtension}`;
      this.statusMessage = 'Image ready. Re-encoding removes common embedded metadata when supported by the browser.';
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      if (requestId !== this.processingId) return;
      console.error('Unable to process the selected image.', error);
      this.errorMessage = error instanceof Error
        ? error.message
        : 'The image could not be processed. Try another image or format.';
      this.statusMessage = '';
      this.changeDetectorRef.detectChanges();
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      if (requestId === this.processingId) {
        this.isProcessing = false;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  download(): void {
    if (!this.outputUrl || !this.outputFileName) return;
    const link = document.createElement('a');
    link.href = this.outputUrl;
    link.download = this.outputFileName;
    document.body.append(link);
    link.click();
    link.remove();
  }

  formatSize(bytes: number): string {
    return formatImageSize(bytes);
  }

  private async loadFile(file: File): Promise<void> {
    const requestId = ++this.fileSelectionId;
    this.processingId++;
    this.isProcessing = false;
    this.isLoading = false;
    this.clearSource();
    this.clearOutput();
    this.errorMessage = '';
    this.statusMessage = '';
    this.fileName = '';
    this.originalFileSize = 0;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.errorMessage = 'Choose an image smaller than 20 MB.';
      return;
    }
    if (file.type && !SUPPORTED_INPUT_TYPES.has(file.type.toLowerCase())) {
      this.errorMessage = 'Choose a JPEG, PNG, WebP, AVIF, or BMP image. SVG and animated images are not supported.';
      return;
    }
    if (!file.type && /\.svg$/i.test(file.name)) {
      this.errorMessage = 'SVG images are not supported. Choose a JPEG, PNG, WebP, AVIF, or BMP image.';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Opening image...';
    let sourceUrl = '';

    try {
      sourceUrl = URL.createObjectURL(file);
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('The image could not be decoded.'));
        image.src = sourceUrl;
      });
      if (requestId !== this.fileSelectionId) {
        URL.revokeObjectURL(sourceUrl);
        return;
      }
      const pixels = image.naturalWidth * image.naturalHeight;
      if (!image.naturalWidth || !image.naturalHeight || pixels > MAX_IMAGE_PIXELS) {
        URL.revokeObjectURL(sourceUrl);
        this.errorMessage = 'This image exceeds the 40-megapixel processing limit.';
        this.statusMessage = '';
        return;
      }

      this.sourceImage = image;
      this.sourceUrl = sourceUrl;
      this.fileName = file.name;
      this.originalFileSize = file.size;
      this.maxWidth = Math.min(image.naturalWidth, MAX_DIMENSION);
      this.maxHeight = Math.min(image.naturalHeight, MAX_DIMENSION);
      this.statusMessage = 'Image loaded. Adjust the settings and process it when ready.';
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (requestId !== this.fileSelectionId) return;
      console.warn('Unable to open the selected image.', error);
      this.errorMessage = 'This file could not be decoded as a supported image.';
      this.statusMessage = '';
      this.changeDetectorRef.detectChanges();
    } finally {
      if (requestId === this.fileSelectionId) {
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  private clearSource(): void {
    if (this.sourceUrl) URL.revokeObjectURL(this.sourceUrl);
    this.sourceUrl = '';
    this.sourceImage = undefined;
  }

  private clearOutput(): void {
    if (this.outputUrl) URL.revokeObjectURL(this.outputUrl);
    this.outputUrl = '';
    this.outputFileName = '';
    this.outputFileSize = 0;
  }
}
