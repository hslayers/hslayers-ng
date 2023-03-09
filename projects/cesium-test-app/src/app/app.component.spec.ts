import {TestBed, waitForAsync} from '@angular/core/testing';

import {HsCesiumConfig} from 'hslayers-cesium';
import {HsConfig} from 'hslayers-ng';

import {AppComponent} from './app.component';
class HsConfigMock {
  constructor() {}
}
class HsCesiumConfigMock {
  constructor() {}
}
describe('AppComponent', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AppComponent],
        providers: [
          {provide: HsConfig, useValue: new HsConfigMock()},
          {provide: HsCesiumConfig, useValue: new HsCesiumConfigMock()},
        ],
      }).compileComponents();
    })
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect().toBeTruthy();
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
