import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModule } from '../../app.module';
import { StringManipulatorComponent } from './string-manipulator.component';

describe('StringManipulatorComponent', () => {
  let component: StringManipulatorComponent;
  let fixture: ComponentFixture<StringManipulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StringManipulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
