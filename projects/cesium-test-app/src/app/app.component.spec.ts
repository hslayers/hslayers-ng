import {TestBed, waitForAsync} from '@angular/core/testing';

import {HsCesiumConfig} from 'hslayers-cesium/src/hscesium-config.service';
import {HsConfig} from 'hslayers-ng/config';
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
        {
          provide: HsConfig,
          useValue: {
            update: () => undefined,
          },
        },
        {
          provide: HsCesiumConfig,
          useValue: {
            cesiumBase: undefined,
            update: () => undefined,
            viewerLoaded: {subscribe: () => undefined},
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

    // Avoid pulling in the full hslayers runtime in unit tests
    TestBed.overrideComponent(AppComponent, {
      set: {
        template: '',
        imports: [],
      },
    });
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

  // NOTE: We intentionally don't run `fixture.detectChanges()` here because
  // the component is a heavy integration example that bootstraps hslayers/cesium.
});
