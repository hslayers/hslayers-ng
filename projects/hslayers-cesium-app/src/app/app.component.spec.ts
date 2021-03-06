import {AppComponent} from './app.component';
import {HsConfig} from 'hslayers-ng';
import {TestBed, waitForAsync} from '@angular/core/testing';
class HsConfigMock {
  constructor() {}
}
describe('AppComponent', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AppComponent],
        providers: [{provide: HsConfig, useValue: new HsConfigMock()}],
      }).compileComponents();
    })
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'hslayers-workspace'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('hslayers-workspace');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain(
      'hslayers-workspace app is running!'
    );
  });
});
