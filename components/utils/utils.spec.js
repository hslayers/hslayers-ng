/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';

import 'angular-mocks';
import VectorLayer from 'ol/layer/Vector';

describe('utils', () => {
  let hsUtils;

  beforeEach(() => {
    angular.mock.module(($provide) => {
      $provide.value('HsConfig', {});
    });
    angular.mock.module('hs.utils');
  }); //<--- Hook module

  beforeEach(inject(($injector) => {
    hsUtils = $injector.get('HsUtilsService');
  }));

  it('remove duplicates from a shallow array', () => {
    const layers = [
      {title: 'villages', features: 10},
      {title: 'villages', features: 10},
      {title: 'cities', features: 50},
      {title: 'villages', features: 100},
      {title: 'cities', features: 5},
    ];
    const unique = hsUtils.removeDuplicates(layers, 'title');
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
    const unique = hsUtils.removeDuplicates(layers, 'values.properties.title');
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
    const unique = hsUtils.removeDuplicates(layers, 'title');
    expect(unique.length).toBe(2);
    expect(unique).toEqual([layers[0], layers[2]]);
  });
});
