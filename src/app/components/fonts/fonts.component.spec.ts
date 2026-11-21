import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModule } from '../../app.module';
import { FontExplorerModule } from '../../tools/font-explorer.module';
import { FontsComponent } from './fonts.component';

describe('FontsComponent', () => {
  let component: FontsComponent;
  let fixture: ComponentFixture<FontsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule, FontExplorerModule],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FontsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('copies escaped text with the selected style in rich clipboard data', async () => {
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const write = vi.fn(async (_items: unknown[]) => undefined);
    class ClipboardItemStub {
      constructor(readonly representations: Record<string, Blob>) {}
    }

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write, writeText: vi.fn() },
    });
    vi.stubGlobal('ClipboardItem', ClipboardItemStub);

    try {
      component.inputText = '<script>not markup</script>';
      component.convertText();
      await component.copyConvertedText();

      expect(write).toHaveBeenCalledOnce();
      const item = write.mock.calls[0][0][0] as ClipboardItemStub;
      const html = await item.representations['text/html'].text();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('&lt;script&gt;not markup&lt;/script&gt;');
      expect(component.isCopied).toBe(true);
    } finally {
      vi.unstubAllGlobals();
      if (clipboardDescriptor) {
        Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
  });
});
