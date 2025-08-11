import {EnvironmentInjector, runInInjectionContext} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {of, scan, share} from 'rxjs';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService} from '@ngx-translate/core';
import {toSignal} from '@angular/core/rxjs-interop';

import ImageLayer from 'ol/layer/Image';
import {ImageWMS} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from '../config.service.mock';
import {HsLayerDescriptor, HsLayermanagerFolder} from 'hslayers-ng/types';
import {
  HsLayerManagerFolderService,
  HsLayerManagerService,
} from 'hslayers-ng/services/layer-manager';

const HsLayerManagerServiceMock = {
  ...jasmine.createSpyObj('HsLayerManagerService', ['sortLayersByZ']),
};

HsLayerManagerServiceMock.data = {
  filter: of(''),
  baselayers: [],
  terrainLayers: [],
  layers: [],
  folders: undefined,
};
const params = {'LAYERS': 'BSS', 'TILED': true};

const layer: HsLayerDescriptor = {
  layer: new ImageLayer({
    properties: {title: 'test'},
    source: new ImageWMS({
      url: 'http://geoservices.brgm.fr/geologie',
      params,
      crossOrigin: 'anonymous',
    }),
    zIndex: 1,
  }),
  showInLayerManager: true,
};

const layer2: HsLayerDescriptor = {
  layer: new ImageLayer({
    properties: {title: 'another layer name', path: 'Path with higher zIndex'},
    source: new ImageWMS({
      url: 'http://geoservices.brgm.fr/geologie',
      params,
      crossOrigin: 'anonymous',
    }),
    zIndex: 2,
  }),
  showInLayerManager: true,
};

describe('HsLayerManagerFolderService', () => {
  let service: HsLayerManagerFolderService;
  let hsConfig: HsConfig;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        {provide: HsConfig, useClass: HsConfigMock},
        {provide: HsLayerManagerService, useValue: HsLayerManagerServiceMock},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    hsConfig = TestBed.inject(HsConfig);
    const injector = TestBed.inject(EnvironmentInjector);

    service = TestBed.inject(HsLayerManagerFolderService);

    service.data = HsLayerManagerServiceMock.data;

    // Handle the state accumulation via the reducer

    runInInjectionContext(injector, () => {
      service.data.folders = toSignal(
        service.folderAction$.pipe(
          scan(
            (acc, value) => service.foldersReducer(acc, value),
            new Map<string, HsLayermanagerFolder>(),
          ),
          share(),
        ),
      );
    });

    service.folderAction$.next(service.addLayer(layer));
    service.folderAction$.next(service.addLayer(layer2));
  });

  it('should be created with two different folders where on of them is other', () => {
    expect(service).toBeTruthy();
    const folderNames = Array.from(service.data.folders().keys());
    expect(folderNames.length).toBe(2);
    expect(folderNames).toContain('other');
  });

  it('should reorder folders by zIndex', () => {
    service.folderAction$.next(service.sortByZ({debounce: false}));
    expect(Array.from(service.data.folders().keys())[0]).toEqual(
      'Path with higher zIndex',
    );
  });

  it('should remain in the original order after reorder', () => {
    hsConfig.reverseLayerList = false;
    service.folderAction$.next(service.sortByZ({debounce: false}));
    expect(Array.from(service.data.folders().keys())[0]).toEqual('other');
  });

  it('should remove layer from folder', () => {
    service.folderAction$.next(service.removeLayer(layer));
    expect(Array.from(service.data.folders().keys()).length).toBe(1);
  });
});
