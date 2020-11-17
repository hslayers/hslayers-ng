import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';

import VectorLayer from 'ol/layer/Vector';
import {Feature} from 'ol';
import {Point} from 'ol/geom';

import {HsConfig} from './../../config.service';
import {HsLayerUtilsService} from './layer-utils.service';
import {HsLayerUtilsServiceMock} from './layer-utils.service.mock';
import {HsLogService} from './../../common/log/log.service';
import {HsUtilsService} from './utils.service';
import {WINDOW_PROVIDERS} from './window';
class HsConfigMock {
  constructor() {}
}
class EmptyMock {
  constructor() {}
}

describe('HsUtilsService', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });
  let hsUtilsService: HsUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        HsUtilsService,
        WINDOW_PROVIDERS[0],
        {provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsLogService, userValue: new EmptyMock()},
        {provide: HttpClient, useValue: new EmptyMock()},
      ],
    });
    hsUtilsService = TestBed.inject(HsUtilsService);
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
      'values.properties.title'
    );
    expect(unique.length).toBe(2);
    expect(unique).toEqual([
      {values: {properties: {title: 'villages', features: 10}}},
      {values: {properties: {title: 'cities', features: 50}}},
    ]);
  });

  it('remove duplicates from an array of OL objects', () => {
    const layers = [
      new VectorLayer({title: 'villages', features: 10}),
      new VectorLayer({title: 'villages', features: 10}),
      new VectorLayer({title: 'cities', features: 50}),
      new VectorLayer({title: 'villages', features: 100}),
      new VectorLayer({title: 'cities', features: 5}),
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
      text: 'asdasd',
      array: [1, 'asd'],
      regex: new RegExp(/aaa/i),
      subobj: {
        num: 234,
        text: 'asdsaD',
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
});
