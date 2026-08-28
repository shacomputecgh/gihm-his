// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { qrPngDataUrl } from './qr';

// qrPngDataUrl renders the SVG onto a canvas — the browser-only tail of the QR
// encoder. jsdom can't decode images or rasterize, so the Image and canvas are
// stubbed to drive each branch: successful render, missing context, failed
// image load, and the too-long payload.

function stubImage(mode: 'load' | 'error') {
  vi.stubGlobal(
    'Image',
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private _src = '';
      set src(v: string) {
        this._src = v;
        // Fire async so the await in qrPngDataUrl settles like a real load.
        queueMicrotask(() => (mode === 'load' ? this.onload?.() : this.onerror?.()));
      }
      get src() {
        return this._src;
      }
    },
  );
}

function stubCanvas(ctx: Record<string, unknown> | null) {
  // Stubbing the global HTMLCanvasElement class does nothing: jsdom's
  // document.createElement('canvas') builds its own element whose getContext
  // returns null (no canvas rasterizer). Patch createElement instead.
  const orig = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext() {
          return ctx;
        },
        toDataURL() {
          return 'data:image/png;base64,QR-PNG';
        },
      } as unknown as HTMLElement;
    }
    return orig(tag);
  });
}

const revokeUrl = vi.fn();
beforeEach(() => {
  // jsdom lacks the object-URL methods — attach them to the real constructor.
  (URL as unknown as Record<string, unknown>).createObjectURL = vi.fn(() => 'blob:qr-svg');
  (URL as unknown as Record<string, unknown>).revokeObjectURL = revokeUrl;
  revokeUrl.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('qrPngDataUrl', () => {
  it('returns null for a payload past version-10 capacity', async () => {
    await expect(qrPngDataUrl('A'.repeat(214))).resolves.toBeNull();
  });

  it('renders the PNG via a canvas when the 2d context is available', async () => {
    const drawImage = vi.fn();
    stubImage('load');
    stubCanvas({ fillStyle: '', fillRect: vi.fn(), drawImage });
    const out = await qrPngDataUrl('MRN-000123');
    expect(out).toBe('data:image/png;base64,QR-PNG');
    expect(drawImage).toHaveBeenCalled();
    expect(revokeUrl).toHaveBeenCalledWith('blob:qr-svg');
  });

  it('returns null when the canvas context is unavailable', async () => {
    stubImage('load');
    stubCanvas(null);
    await expect(qrPngDataUrl('MRN-000123')).resolves.toBeNull();
  });

  it('rejects when the image fails to load', async () => {
    stubImage('error');
    stubCanvas({ fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() });
    await expect(qrPngDataUrl('MRN-000123')).rejects.toThrow('Could not render QR');
  });
});
