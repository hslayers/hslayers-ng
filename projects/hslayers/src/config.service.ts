import BaseLayer from 'ol/layer/Base';
import View from 'ol/View';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Themes} from './components/layout/themes/theme';

export type SymbolizerIcon = {
  name: string;
  url: string;
};

@Injectable()
export class HsConfig {
  private defaultSymbolizerIcons? = [
    {name: 'favourite', url: 'img/icons/favourite28.svg'},
    {name: 'gps', url: 'img/icons/gps43.svg'},
    {name: 'information', url: 'img/icons/information78.svg'},
    {name: 'wifi', url: 'img/icons/wifi8.svg'},
  ];
  cesiumTime?: any;
  componentsEnabled?: any = {
    guiOverlay: true,
    sidebar: true,
    toolbar: true,
    drawToolbar: true,
    searchToolbar: true,
    measureToolbar: true,
    geolocationButton: true,
    defaultViewButton: true,
    mapControls: true,
    basemapGallery: false,
    themeToggle: false,
  };
  mapInteractionsEnabled?: boolean;
  allowAddExternalDatasets?: boolean;
  sidebarClosed?: boolean;
  sidebarPosition?: string;
  box_layers?: Array<any>;
  senslog?: {
    url: string;
    user_id: number;
    group: string;
    user: string;
    liteApiPath?: string;
    mapLogApiPath?: string;
  };
  cesiumDebugShowFramesPerSecond?: boolean;
  cesiumShadows?: number;
  cesiumBase?: string;
  createWorldTerrainOptions?: any;
  terrain_provider?: any;
  cesiumTimeline?: boolean;
  cesiumAnimation?: boolean;
  creditContainer?: any;
  cesiumInfoBox?: any;
  clusteringDistance?: number;
  imageryProvider?: any;
  terrainExaggeration?: number;
  cesiumBingKey?: string;
  newTerrainProviderOptions?: any;
  terrain_providers?: any;
  cesiumAccessToken?: string;
  proxyPrefix?: string;
  defaultDrawLayerPath?: string;
  default_layers?: Array<BaseLayer>;
  default_view?: View;
  panelsEnabled?: {
    legend?: boolean;
    measure?: boolean;
    info?: boolean;
    composition_browser?: boolean;
    toolbar?: boolean;
    mobile_settings?: boolean;
    draw?: boolean;
    datasource_selector?: boolean;
    layermanager?: boolean;
    feature_crossfilter?: boolean;
    print?: boolean;
    saveMap?: boolean;
    language?: boolean;
    permalink?: boolean;
    compositionLoadingProgress?: boolean;
    sensors?: boolean;
    filter?: boolean;
    search?: boolean;
    tripPlanner?: boolean;
    addData?: boolean;
  };
  advancedForm?: boolean;
  project_name?: string;
  hostname?: any;
  status_manager_url?: string;
  dsPaging?: number;
  permalinkLocation?: {origin: string; pathname: string};
  social_hashtag?: string;
  useProxy?: boolean;
  shortenUrl?: any;
  layerTooltipDelay?: number;
  search_provider?: any;
  geonamesUser?: any;
  searchProvider?: any;
  language?: string;
  enabledLanguages?: string;
  query?: any;
  queryPoint?: string;
  popUpDisplay?: string;
  preserveLastSketchPoint?: boolean;
  zoomWithModifierKeyOnly?: boolean;
  pureMap?: boolean;
  translationOverrides?: any;
  layersInFeatureTable?: any;
  open_lm_after_comp_loaded?: any;
  draggable_windows?: boolean;
  connectTypes?: any;
  theme?: Themes;
  datasources?: any;
  panelWidths?: any;
  sidebarToggleable?: any;
  sizeMode?: string;
  symbolizerIcons?: SymbolizerIcon[];
  openQueryPanelOnDrawEnd?: boolean;
  assetsPath?: string;
  reverseLayerList?: boolean;
  /**
   * When set to 'true', the map layers are stored temporarily to localStorage
   * on page reload, loaded when it starts and deleted afterwards.
   * Otherwise, nothing is stored to localStorage and only default_layers are loaded
   * after page reloads.
   * @default true
   */
  saveMapStateOnReload?: boolean;
  /**
   * Triggered when config is updated using 'update' function of HsConfig.
   * The full resulting config is provided in the subscriber as a parameter
   */
  configChanges?: Subject<HsConfig> = new Subject();
  timeDisplayFormat?: string;

  /**
   *  Determines behavior of exclusive layers (layer.exclusive = true) visibility
   *  If set to true, only layers with same path are affected by exclusivity
   */
  pathExclusivity?: boolean = false;
  constructor() {
    this.symbolizerIcons = this.defaultSymbolizerIcons.map((val) => {
      val.url = (this.assetsPath ?? '') + val.url;
      return val;
    });
  }

  update?(newConfig: HsConfig): void {
    Object.assign(this.componentsEnabled, newConfig.componentsEnabled);
    delete newConfig.componentsEnabled;
    this.symbolizerIcons = [
      ...this.updateSymbolizers(newConfig),
      ...(newConfig.symbolizerIcons ?? []),
    ];
    delete newConfig.symbolizerIcons;
    Object.assign(this, newConfig);

    this.configChanges.next(this);
  }

  /**
   * This kind of duplicates getAssetsPath() in HsUtilsService, which can't be used here due to circular dependency
   */
  updateSymbolizers?(config: HsConfig) {
    /* Removing 'private' since it makes this method non-optional */
    let assetsPath = config.assetsPath ?? '';
    assetsPath += assetsPath.endsWith('/') ? '' : '/';
    return this.defaultSymbolizerIcons.map((val) => {
      val.url = assetsPath + val.url;
      return val;
    });
  }
}
