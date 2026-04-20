import {TestBed, waitForAsync} from '@angular/core/testing';
import {Subject, of} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from '../../../hslayers/test/config.service.mock';
import {HslayersAppComponent} from './hslayers-app.component';
import {HsProxyService} from 'hslayers-ng/services/utils';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HttpClient} from '@angular/common/http';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HslayersAppComponent],
      providers: [
        {provide: HsConfig, useClass: HsConfigMock},
        {provide: HsProxyService, useValue: {proxify: (u: string) => u}},
        {
          provide: HsEventBusService,
          useValue: {layerDimensionDefinitionChanges: new Subject()},
        },
        {provide: HttpClient, useValue: {get: () => of({})}},
        {provide: HsSidebarService, useValue: {}},
        {
          provide: HsPanelConstructorService,
          useValue: {
            createPanelAndButton: () => undefined,
            createActivePanels: () => undefined,
          },
        },
        {
          provide: HsOverlayConstructorService,
          useValue: {createGuiOverlay: () => undefined},
        },
        {provide: HsLayoutService, useValue: {}},
      ],
    }).compileComponents();

    // Avoid pulling in the full hslayers runtime in unit tests
    TestBed.overrideComponent(HslayersAppComponent, {
      set: {
        template: '',
        imports: [],
      },
    });
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(HslayersAppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'hslayers-workspace'`, () => {
    const fixture = TestBed.createComponent(HslayersAppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('hslayers-workspace');
  });

  // Note: this component is an integration-style example (boots hslayers);
  // we avoid DOM assertions here to keep the unit test lightweight/stable.
});
