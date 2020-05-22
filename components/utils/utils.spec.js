/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
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

  it('removes duplicates from an array', () => {
    const layers = [
      {title: 'villages', features: 10},
      {title: 'villages', features: 10},
      {title: 'villages', features: 100},
      {title: 'cities', features: 5},
      {title: 'cities', features: 50},
    ];
    const unique = hsUtils.removeDuplicates(layers, 'title');
    expect(unique.length).toBe(2);
    expect(unique).toEqual([
      {title: 'villages', features: 10},
      {title: 'cities', features: 5},
    ]);
  });
});
