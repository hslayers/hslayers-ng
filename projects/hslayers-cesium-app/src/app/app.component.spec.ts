import {TestBed, waitForAsync} from '@angular/core/testing';

import {HsCesiumConfig} from 'hslayers-cesium/src/hscesium-config.service';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/test/config.service.mock';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';

import {AppComponent} from './app.component';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {provide: HsConfig, useClass: HsConfigMock},
        {
          provide: HsCesiumConfig,
          useValue: {
            cesiumBase: undefined,
            update: () => undefined,
          },
        },
        {
          provide: HsLayoutService,
          useValue: {addMapVisualizer: () => undefined},
        },
        {
          provide: HsOverlayConstructorService,
          useValue: {createGuiOverlay: () => undefined},
        },
        {
          provide: HsPanelConstructorService,
          useValue: {createActivePanels: () => undefined},
        },
      ],
    }).compileComponents();
  }));

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
});
