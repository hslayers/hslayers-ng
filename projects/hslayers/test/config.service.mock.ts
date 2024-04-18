import {Subject} from 'rxjs';

export class HsConfigMock {
  reverseLayerList: boolean;
  panelsEnabled = {
    legend: false,
    measure: false,
    info: false,
    compositions: false,
    toolbar: false,
    draw: false,
    layermanager: false,
    feature_crossfilter: false,
    print: false,
    saveMap: false,
    language: false,
    share: false,
    compositionLoadingProgress: false,
    sensors: false,
    filter: false,
    search: true,
    tripPlanner: false,
    addData: false,
    mapSwipe: false,
  };
  panelWidths = {
    default: 425,
  };
  componentsEnabled = {};
  assetsPath = '/assets';
  configChanges?: Subject<void> = new Subject();
  id = 'testappid';
  constructor() {}

  setAppId(id: string) {
    this.id = id;
  }
}
