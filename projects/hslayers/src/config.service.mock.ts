import {Subject} from 'rxjs';

import {HsConfig} from './config.service';

export class HsConfigMock {
  reverseLayerList: boolean;
  panelsEnabled = {
    legend: false,
    measure: false,
    info: false,
    composition_browser: false,
    toolbar: false,
    draw: false,
    datasource_selector: false,
    layermanager: false,
    feature_crossfilter: false,
    print: false,
    saveMap: false,
    language: false,
    permalink: false,
    compositionLoadingProgress: false,
    sensors: false,
    filter: false,
    search: true,
    tripPlanner: false,
    addData: false,
    mapSwipe: false,
  };
  componentsEnabled = {};
  assetsPath = '/assets';
  configChanges?: Subject<HsConfig> = new Subject();
  constructor() {}
}
