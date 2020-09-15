/* eslint-disable prefer-arrow-callback */
/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
import '../core/core-ajs.mock';
import 'angular-mocks';
import * as angular from 'angular';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import {Vector as VectorSource} from 'ol/source';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';


import {HsConfig} from '../../config.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapComponent} from './map.component';
import {HsMapHostDirective} from './map.directive';
import {HsMapService} from './map.service';
import {HsUtilsService} from '../utils/utils.service';
import {WINDOW_PROVIDERS} from '../utils/window'

class HsConfigMock {
  constructor() {}
}
const mockLayoutService = jasmine.createSpyObj('HsLayoutService', [
  'sidebarBottom',
  'panelVisible',
]);
const mockHsUtilsService = jasmine.createSpyObj('HsUtilsService', ['instOf']);

describe('hs.map', function () {

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });
  let fixture: ComponentFixture<HsMapComponent>;
  let component: HsMapComponent;
  let service: HsMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateModule.forRoot()],
      declarations: [
        HsMapComponent
      ],
      providers: [
        HsMapService,
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsLayoutService, useValue: mockLayoutService},
        {provide: HsUtilsService, useValue: mockHsUtilsService},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsMapComponent);
    service = TestBed.get(HsMapService);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('Map component should be available', () => {
    expect(component).toBeTruthy();
  });
});
// beforeEach(function () {
//   // /* Mocks start ===== */
//   // angular
//   //   .module('hs.utils', [])
//   //   .service('HsUtilsService', function () {
//   //     this.debounce = function () {};
//   //     this.instOf = function (obj, klass) {
//   //       if (this.isFunction(klass)) {
//   //         return obj instanceof klass;
//   //       }
//   //       obj = Object.getPrototypeOf(obj);
//   //       while (obj !== null) {
//   //         if (obj.constructor.name === klass) {
//   //           return true;
//   //         }
//   //         obj = Object.getPrototypeOf(obj);
//   //       }
//   //       return false;
//   //     };
//   //     this.isFunction = function(functionToCheck){
//   //       return (
//   //         functionToCheck &&
//   //         {}.toString.call(functionToCheck) === '[object Function]'
//   //       );
//   //     }
//   //     this.generateUuid = function(){
//   //       return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//   //         const r = (Math.random() * 16) | 0,
//   //           v = c == 'x' ? r : (r & 0x3) | 0x8;
//   //         return v.toString(16);
//   //       });
//   //     }
//   //   })
//   //   .service('HsLayerUtilsService', function () {});
//   // angular.module('hs.layout', []).service('HsLayoutService', function () {});
//   // angular.module('gettext').filter('translate', (gettextCatalog) => {
//   //   /**
//   //    * @param input
//   //    * @param context
//   //    */
//   //   function filter(input, context) {
//   //     return gettextCatalog.getString(input, null, context);
//   //   }
//   //   filter.$stateful = true;
//   //   return filter;
//   // });
//   // /* Mocks end ===== */
//   // angular
//   //   .module('hs.map', [
//   //     'hs',
//   //     'ng',
//   //     'hs.utils',
//   //     'hs.layout',
//   //     'gettext',
//   //     'hs.core',
//   //   ])
//   //   .service('HsMapService', HsMapService);
//   // angular.mock.module('hs.map');
// });

// beforeEach(
//   angular.mock.inject(($injector) => {
//     hsMap = $injector.get('HsMapService');
//     hsMap.init();
//   })
// );

// it('should create map object', async function () {
//   const map = await hsMap.loaded();
//   expect(map).toBeDefined();
// });

// it('should not add duplicate layers', async function () {
//   await hsMap.loaded();
//   const layer1 = new VectorLayer({
//     title: 'Bookmarks',
//     source: new VectorSource({}),
//   });
//   hsMap.map.addLayer(layer1);

//   const layer2 = new VectorLayer({
//     title: 'Bookmarks',
//     source: new VectorSource({}),
//   });
//   const exists = hsMap.layerAlreadyExists(layer2);
//   expect(exists).toBe(true);
// });

// it('find layer for feature', async function () {
//   await hsMap.loaded();
//   const featureLayer = new VectorLayer({
//     title: 'Feature layer',
//     source: new VectorSource({}),
//   });
//   hsMap.map.addLayer(featureLayer);
//   const feature = new Feature({geometry: new Point([0, 0]), name: 'test'});
//   featureLayer.getSource().addFeatures([feature]);
//   const foundLayer = hsMap.getLayerForFeature(feature);
//   expect(foundLayer).toBe(featureLayer);
// });
