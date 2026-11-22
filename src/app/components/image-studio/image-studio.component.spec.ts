import { describe, expect, it } from 'vitest';
import { calculateOutputDimensions, formatImageSize } from './image-studio.component';

describe('ImageStudioComponent helpers', () => {
  it('resizes within the requested bounds while preserving the original ratio', () => {
    expect(calculateOutputDimensions(4000, 2000, 1000, 1000, true)).toEqual({
      width: 1000,
      height: 500,
    });
  });

  it('does not upscale images and rejects output beyond the pixel limit', () => {
    expect(calculateOutputDimensions(400, 200, 1000, 1000, true)).toEqual({
      width: 400,
      height: 200,
    });
    expect(calculateOutputDimensions(10000, 10000, 10000, 10000, false)).toBeUndefined();
  });

  it('formats byte sizes for image summaries', () => {
    expect(formatImageSize(512)).toBe('512 B');
    expect(formatImageSize(1536)).toBe('1.5 KB');
    expect(formatImageSize(-1)).toBe('Unknown size');
  });
});
