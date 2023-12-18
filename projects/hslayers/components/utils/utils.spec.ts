import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {Feature} from 'ol';
import {LineString, Polygon} from 'ol/geom';
import {Point} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';

import {HsConfig} from './../../config.service';
import {HsLayerUtilsService} from './layer-utils.service';
import {HsLogService} from './../../common/log/log.service';
import {HsUtilsService, instOf} from './utils.service';
import {mockLayerUtilsService} from './layer-utils.service.mock';

class EmptyMock {
  constructor() {}
}

describe('HsUtilsService', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      {
        teardown: {destroyAfterEach: false},
      },
    );
  });
  let hsUtilsService: HsUtilsService;
  let hsConfig: HsConfig;
  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        HsUtilsService,
        HsConfig,
        {
          provide: HsLayerUtilsService,
          useValue: mockLayerUtilsService(),
        },

        {provide: HsLogService, userValue: new EmptyMock()},
      ],
      imports: [HttpClientTestingModule],
    });
    hsUtilsService = TestBed.inject(HsUtilsService);
    hsConfig = TestBed.inject(HsConfig);
  });
  it('remove duplicates from a shallow array', () => {
    const layers = [
      {title: 'villages', features: 10},
      {title: 'villages', features: 10},
      {title: 'cities', features: 50},
      {title: 'villages', features: 100},
      {title: 'cities', features: 5},
    ];
    const unique = hsUtilsService.removeDuplicates(layers, 'title');
    expect(unique.length).toBe(2);
    expect(unique).toEqual([
      {title: 'villages', features: 10},
      {title: 'cities', features: 50},
    ]);
  });

  it('remove duplicates from a deep array', () => {
    const layers = [
      {values: {properties: {title: 'villages', features: 10}}},
      {values: {properties: {title: 'villages', features: 10}}},
      {values: {properties: {title: 'cities', features: 50}}},
      {values: {properties: {title: 'villages', features: 100}}},
      {values: {properties: {title: 'cities', features: 5}}},
    ];
    const unique = hsUtilsService.removeDuplicates(
      layers,
      'values.properties.title',
    );
    expect(unique.length).toBe(2);
    expect(unique).toEqual([
      {values: {properties: {title: 'villages', features: 10}}},
      {values: {properties: {title: 'cities', features: 50}}},
    ]);
  });

  it('remove duplicates from an array of OL objects', () => {
    const layers = [
      new VectorLayer({properties: {title: 'villages', features: 10}}),
      new VectorLayer({properties: {title: 'villages', features: 10}}),
      new VectorLayer({properties: {title: 'cities', features: 50}}),
      new VectorLayer({properties: {title: 'villages', features: 100}}),
      new VectorLayer({properties: {title: 'cities', features: 5}}),
    ];
    const unique = hsUtilsService.removeDuplicates(layers, 'title');
    expect(unique.length).toBe(2);
    expect(unique).toEqual([layers[0], layers[2]]);
  });

  it('create a deep copy of any object', () => {
    const obj = {
      date: new Date(),
      func: function (q) {
        return 1 + q;
      },
      num: 123,
      text: 'text',
      array: [1, 'text'],
      regex: new RegExp(/text/i),
      subobj: {
        num: 234,
        text: 'text',
      },
      olFeature: new Feature({
        geometry: new Point([45, 12]),
        name: 'Testing point',
      }),
    };
    const copy = hsUtilsService.structuredClone(obj);
    expect(copy).not.toBe(obj);
    expect(copy).toEqual(obj);
    delete obj.subobj;
    expect(copy.subobj).toBeDefined();
  });
  it('check if url gets proxified correctly', () => {
    const urlWMS = 'http://gisserver.domain.com/request=GetFeatureInfo';
    const simpleUrl = 'http://gisserver.domain.com';
    const base64Url =
      'data:application/octet-stream;base64,PGttbD4KICA8RG9jdW1lbnQ+CiAgICA8bmFtZT5T';
    let url = hsUtilsService.proxify(urlWMS);
    expect(url).toEqual(
      '/proxy/http://gisserver.domain.com/request=GetFeatureInfo',
    );
    hsConfig.proxyPrefix = 'http://localhost:8085/';
    url = hsUtilsService.proxify(simpleUrl);
    expect(url).toEqual('http://localhost:8085/http://gisserver.domain.com');
    url = hsUtilsService.proxify(base64Url);
    expect(url).toEqual(
      'data:application/octet-stream;base64,PGttbD4KICA8RG9jdW1lbnQ+CiAgICA8bmFtZT5T',
    );
  });
  it('check if short url gets created correctly', async () => {
    hsConfig.proxyPrefix = 'http://localhost:8085/';
    hsConfig.shortenUrl = (url) => {
      return 'http://customShortUrl.com/shorturl';
    };
    const url =
      'http://localhost:8080/?hs_x=1945211.1423359748&hs_y=6904584.935889341&hs_z=4&visible_layers=%26%2347%3BOpenStreetMap%3BSwiss%3B%3BBookmarks&hs_panel=layermanager';
    const shortUrl = await hsUtilsService.shortUrl(url);
    expect(shortUrl).toEqual('http://customShortUrl.com/shorturl');
  });
  it('try to get port number from url', () => {
    let url = 'http://localhost:';
    let portNumber = hsUtilsService.getPortFromUrl(url);
    expect(portNumber).toEqual('80');
    url = 'https://localhost:';
    portNumber = hsUtilsService.getPortFromUrl(url);
    expect(portNumber).toEqual('443');
    url = 'https://localhost:8080';
    portNumber = hsUtilsService.getPortFromUrl(url);
    expect(portNumber).toEqual('8080');
  });
  it('try to get parameters from url', () => {
    const url = 'http://localhost:8080?param1=test&param2=test2';
    const params = hsUtilsService.getParamsFromUrl(url);
    expect(params).toEqual({param1: 'test', param2: 'test2'});
  });
  it('try to create parameters for url', () => {
    const params = {'#param1': 'test', '#param2': 'test2'};
    const pairs = hsUtilsService.paramsToURL(params);
    expect(pairs).toEqual('%23param1=test&%23param2=test2');
  });
  //Causing error: Cannot read property 'assertPresent' of undefined
  // it('try to set debounce function call', fakeAsync(() => {
  //   const clock = jasmine.clock();
  //   clock.install();
  //   const spyOnGenerateUuid = spyOn(hsUtilsService, 'generateUuid');
  //   hsUtilsService.debounce(hsUtilsService.generateUuid(), 100, false, this);
  //   clock.tick(50);
  //   expect(spyOnGenerateUuid).not.toHaveBeenCalled();
  //   clock.tick(50);
  //   expect(spyOnGenerateUuid).toHaveBeenCalledTimes(1);
  //   clock.uninstall();
  // }));
  it('try to create parameters for url without encoding', () => {
    const params = {'#param1': 'test', '#param2': 'test2'};
    const pairs = hsUtilsService.paramsToURLWoEncode(params);
    expect(pairs).toEqual('#param1=test&#param2=test2');
  });
  it('try to generate Uuid', () => {
    const Uuid = hsUtilsService.generateUuid();
    expect(Uuid).toBeDefined();
  });
  it('try to generate generate vibrant color', () => {
    const numOfSteps = 5;
    const step = 1;
    const opacity = '0.5';
    const color = hsUtilsService.rainbow(numOfSteps, step, opacity);
    expect(color).toEqual('rgba(0,187,235, 0.5)');
  });
  it('check if object is a function', () => {
    const functionToCheck = function () {
      return;
    };
    const functionToCheck2 = {
      function: function () {
        return;
      },
    };
    let isFunction = hsUtilsService.isFunction(functionToCheck);
    expect(isFunction).toBe(true);
    isFunction = hsUtilsService.isFunction(functionToCheck2);
    expect(isFunction).toBe(false);
  });
  it('check if object is a object', () => {
    const objectToCheck = {name: 'object'};
    const objectToCheck2 = function () {
      return;
    };
    let isObject = hsUtilsService.isPOJO(objectToCheck);
    expect(isObject).toBe(true);
    isObject = hsUtilsService.isPOJO(objectToCheck2);
    expect(isObject).toBe(false);
  });
  it('check if object is instance of some type', () => {
    const layer = new VectorLayer();
    let isInstOf = instOf(layer, VectorLayer);
    expect(isInstOf).toBe(true);
    isInstOf = instOf(layer, Point);
    expect(isInstOf).toBe(false);
  });
  it('try to hash a string', () => {
    let str = 'This is a string';
    let hash = hsUtilsService.hashCode(str);
    expect(hash).toBeGreaterThan(0);
    expect(hash).toEqual(1599081604);
    str = '';
    hash = hsUtilsService.hashCode(str);
    expect(hash).toEqual(0);
  });
  it('try to replace all string values with replacement', () => {
    const targetStr = 'This is a string, this is a string';
    const regExSearch = 'string';
    const replacementText = 'text';
    const result = hsUtilsService.replaceAll(
      targetStr,
      regExSearch,
      replacementText,
    );
    expect(result).toEqual('This is a text, this is a text');
  });
  it('try to capitalize first string letter', () => {
    const str = 'this string will have atleast one capital letter';
    const result = hsUtilsService.capitalizeFirstLetter(str);
    expect(result).toEqual('This string will have atleast one capital letter');
  });
  it('try to undefine an empty string', () => {
    let str = 'this is now an empty string';
    let result = hsUtilsService.undefineEmptyString(str);
    expect(result).toEqual('this is now an empty string');
    str = '';
    result = hsUtilsService.undefineEmptyString(str);
    expect(result).toEqual(undefined);
    str = undefined;
    result = hsUtilsService.undefineEmptyString(str);
    expect(result).toEqual(undefined);
  });

  it('format length measurements', () => {
    let measuredLine = new LineString([
      //coordinates in the Map's default projection
      [16223, 48456],
      [234, 785],
    ]);
    let measurement = hsUtilsService.formatLength(measuredLine, 'EPSG:3857');
    expect(measurement.unit).toBe('km');
    expect(measurement.size).toBeGreaterThan(0);
    measuredLine = new LineString([
      //coordinates in the Map's default projection
      [12, 50],
      [13, 49],
    ]);
    measurement = hsUtilsService.formatLength(measuredLine, 'EPSG:3857');
    expect(measurement.unit).toBe('m');
    expect(measurement.size).toBeGreaterThan(0);
  });

  it('format area measurements', () => {
    let measuredLine = new Polygon([
      //coordinates in the Map's default projection
      [
        [1623, 47627],
        [234, 785],
        [-156, -61],
      ],
    ]);
    let measurement = hsUtilsService.formatArea(measuredLine, 'EPSG:3857');
    //expect(measurement.unit).toBe('km');
    expect(measurement.size).toBeGreaterThan(0);
    measuredLine = new Polygon([
      //coordinates in the Map's default projection
      [
        [12, 50],
        [13, 49],
        [13, 50],
      ],
    ]);
    measurement = hsUtilsService.formatArea(measuredLine, 'EPSG:4326');
    expect(measurement.unit).toBe('m');
    expect(measurement.size).toBeGreaterThan(0);
  });
});
