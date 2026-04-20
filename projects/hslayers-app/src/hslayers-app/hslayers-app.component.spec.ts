import {HsConfig} from '../../../hslayers/config/config.service';
import {HsConfigMock} from '../../../hslayers/test/config.service.mock';
import {HslayersAppComponent} from './hslayers-app.component';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
} from 'hslayers-ng/services/layer-manager';
import {HsMapService} from 'hslayers-ng/services/map';
import {
  HsOverlayConstructorService,
  HsPanelConstructorService,
} from 'hslayers-ng/services/panel-constructor';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HslayersAppComponent],
      providers: [
        {provide: HsConfig, useClass: HsConfigMock},
        {
          provide: HsOverlayConstructorService,
          useValue: {createGuiOverlay: () => undefined},
        },
        {
          provide: HsPanelConstructorService,
          useValue: {createActivePanels: () => undefined},
        },
        {
          provide: HsLayerManagerService,
          useValue: {getLayerByTitle: () => undefined},
        },
        {
          provide: HsLayerManagerVisibilityService,
          useValue: {changeLayerVisibility: () => undefined},
        },
        {provide: HsEventBusService, useValue: {}},
        {provide: HsMapService, useValue: {getMap: () => undefined}},
      ],
    }).compileComponents();
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
});
