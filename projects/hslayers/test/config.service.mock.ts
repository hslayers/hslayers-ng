import {HsConfig} from 'hslayers-ng/config';
import {Subject} from 'rxjs';

export class HsConfigMock extends HsConfig {
  reverseLayerList: boolean;
  panelsEnabled = {
    legend: false,
    measure: false,
    info: false,
    compositions: false,
    toolbar: false,
    draw: false,
    layermanager: false,
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
  configChanges = new Subject<void>();
  id = 'testappid';

  symbolizerIcons = [
    {name: 'favourite', url: 'img/icons/favourite28.svg'},
    {name: 'gps', url: 'img/icons/gps43.svg'},
    {name: 'information', url: 'img/icons/information78.svg'},
    {name: 'wifi', url: 'img/icons/wifi8.svg'},
  ];

  constructor() {
    super();
  }

  override update?(config: any): void {
    Object.assign(this, config);
    this.configChanges.next();
  }

  override updateComponentsEnabled?(config: any): any {
    return {...this.componentsEnabled, ...config?.componentsEnabled};
  }

  override updateSymbolizers?(config: any): any {
    return this.symbolizerIcons.map((val) => ({
      ...val,
      url: (config.assetsPath ?? '') + val.url,
    }));
  }

  override checkDeprecatedCesiumConfig?(config: any): void {
    // Mock implementation
  }
}
