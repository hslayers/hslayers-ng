/* eslint-disable angular/di */
import 'angular-mocks';
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'reflect-metadata';
import 'zone.js/dist/zone';
import 'zone.js/dist/zone-testing';
import VectorLayer from 'ol/layer/Vector';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {HsConfig} from './../../config.service';
import {HsLayerUtilsService} from './layer-utils.service';
import {HsLayerUtilsServiceMock} from './layer-utils.service.mock';
import {HsLogService} from './../../common/log/log.service';
import {HsUtilsService} from './utils.service';
import {HsUtilsServiceMock} from './utils.service.mock';
import {TestBed} from '@angular/core/testing';
class HsConfigMock {
  constructor() {}
}
class HsLogServiceMock {
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
        {
          provide: HsUtilsService,
          useValue: new HsUtilsServiceMock(),
        },
        {provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsLogService, userValue: new HsLogServiceMock()},
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
});
