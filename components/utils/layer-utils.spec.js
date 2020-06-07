/* eslint-disable angular/di */
'use strict';

import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

describe('layer-utils', () => {
  let hsLayerUtils;

  beforeEach(() => {
    angular.mock.module(($provide) => {
      $provide.value('HsConfig', {});
    });
    angular.mock.module('hs.utils');
  }); //<--- Hook module

  beforeEach(inject(($injector) => {
    hsLayerUtils = $injector.get('HsLayerUtilsService');
  }));

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
