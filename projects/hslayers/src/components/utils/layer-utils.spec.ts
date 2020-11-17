/* eslint-disable angular/di */
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from './layer-utils.service';
import {HsUtilsService} from './utils.service';
import {HsUtilsServiceMock} from './utils.service.mock';
import {TestBed} from '@angular/core/testing';

class EmptyMock {
  constructor() {}
}
describe('HsLayerUtilsService', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });
  let hsLayerUtils: HsLayerUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        HsLayerUtilsService,
        {
          provide: HsUtilsService,
          useValue: new HsUtilsServiceMock(),
        },
        {
          provide: HsLanguageService,
          useValue: new EmptyMock(),
        },
      ],
    });
    hsLayerUtils = TestBed.get(HsLayerUtilsService);
  });

  it('check if layer is clustered', () => {
    const clusteredLayer = new VectorLayer({
      title: 'villages',
      source: new Vector(),
      cluster: true,
    });
    const unclusteredLayer = new VectorLayer({
      title: 'cities',
      source: new Vector(),
    });
    let isClustered = hsLayerUtils.isLayerClustered(clusteredLayer);
    expect(isClustered).toBe(true);
    isClustered = hsLayerUtils.isLayerClustered(unclusteredLayer);
    expect(isClustered).toBe(false);
  });
});
