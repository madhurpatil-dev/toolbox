import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AgeCalculatorComponent } from './age-calculator.component';
import { ToolsModule } from '../../tools.module';

describe('AgeCalculatorComponent', () => {
  let component: AgeCalculatorComponent;
  let fixture: ComponentFixture<AgeCalculatorComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 4, 17, 12));

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, ToolsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgeCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows residual months and days while keeping total elapsed time values', () => {
    component.birthDate = new Date(2024, 2, 14);

    component.calculateAge();

    expect(component.age).toMatchObject({
      years: 1,
      months: 2,
      days: 3
    });
    const elapsedMilliseconds = new Date(2025, 4, 17, 12).getTime() - component.birthDate.getTime();
    expect(component.age.hours).toBe(Math.floor(elapsedMilliseconds / (1000 * 60 * 60)));
    expect(component.age.minutes).toBe(Math.floor(elapsedMilliseconds / (1000 * 60)));
    expect(component.age.seconds).toBe(Math.floor(elapsedMilliseconds / 1000));
  });

  it('clears its timer when the screen is destroyed', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    fixture.destroy();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
