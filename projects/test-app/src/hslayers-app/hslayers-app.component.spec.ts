import {HsConfig} from '../../../hslayers/src/config.service';
import {HsConfigMock} from '../../../hslayers/src/config.service.mock';
import {HslayersAppComponent} from './hslayers-app.component';
import {TestBed, waitForAsync} from '@angular/core/testing';
describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HslayersAppComponent],
      providers: [{provide: HsConfig, useValue: new HsConfigMock()}],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(HslayersAppComponent);
    const app = fixture.componentInstance;
    expect().toBeTruthy();
  });

  it(`should have as title 'hslayers-workspace'`, () => {
    const fixture = TestBed.createComponent(HslayersAppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('hslayers-workspace');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(HslayersAppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain(
      'hslayers-workspace app is running!'
    );
  });
});
