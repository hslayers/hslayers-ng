import {Injectable} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import {Geometry} from 'ol/geom';
import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';

import {AddDataFileType} from './components/add-data/file/types/file.type';
import {AddDataUrlType} from './components/add-data/url/types/url.type';
import {QueryPopupWidgetsType} from './components/query/widgets/widgets.type';
import {WidgetItem} from './components/query/widgets/widget-item.type';

export type SymbolizerIcon = {
  name: string;
  url: string;
};

export type MapSwipeOptions = {
  orientation?: 'vertical' | 'horizontal';
};

@Injectable()
export class HsConfig {
  private defaultSymbolizerIcons? = [
    {name: 'favourite', url: 'img/icons/favourite28.svg'},
    {name: 'gps', url: 'img/icons/gps43.svg'},
    {name: 'information', url: 'img/icons/information78.svg'},
    {name: 'wifi', url: 'img/icons/wifi8.svg'},
  ];
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
    mapSwipe: false,
  };
  clusteringDistance?: number;
  mapInteractionsEnabled?: boolean;
  sidebarClosed?: boolean;
  sidebarPosition?: string;
  box_layers?: Group[];
  senslog?: {
    url: string;
    user_id: number;
    group: string;
    user: string;
    liteApiPath?: string;
    mapLogApiPath?: string;
  };
  proxyPrefix?: string;
  defaultDrawLayerPath?: string;
  default_layers?: Layer<Source>[];
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
    feature_table?: boolean;
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
    mapSwipe?: boolean;
  };
  advancedForm?: boolean;
  project_name?: string;
  hostname?: {
    status_manager?: {
      url: string;
    };
    user?: {
      url: string;
    };
    default?: {
      url: string;
    };
  };
  mapSwipeOptions?: MapSwipeOptions = {};
  status_manager_url?: string;
  permalinkLocation?: {origin: string; pathname: string};
  social_hashtag?: string;
  useProxy?: boolean;
  layerTooltipDelay?: number;
  search_provider?: string;
  geonamesUser?: string;
  searchProvider?: any;
  language?: string;
  enabledLanguages?: string;
  query?: {multi: boolean};
  queryPoint?: string;
  popUpDisplay?: 'none' | 'click' | 'hover';
  /**
   * Configures query popup widgets, the order in which they are generated, and visibility
   */
  queryPopupWidgets?: QueryPopupWidgetsType[] | string[] = [
    'layer-name',
    'feature-info',
    'clear-layer',
  ];
  /**
   * Allows the user to add custom widgets to query popup
   */
  customQueryPopupWidgets?: WidgetItem[];
  preserveLastSketchPoint?: boolean;
  zoomWithModifierKeyOnly?: boolean;
  pureMap?: boolean;
  translationOverrides?: any;
  layersInFeatureTable?: VectorLayer<VectorSource<Geometry>>[];
  open_lm_after_comp_loaded?: boolean;
  draggable_windows?: boolean;
  connectTypes?: AddDataUrlType[];
  uploadTypes?: AddDataFileType[];
  datasources?: any;
  panelWidths?: any;
  sidebarToggleable?: boolean;
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
   * Default: true
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
  ngRouter?: boolean;
  constructor() {
    this.symbolizerIcons = this.defaultSymbolizerIcons.map((val) => {
      val.url = (this.assetsPath ?? '') + val.url;
      return val;
    });
  }

  checkDeprecatedCesiumConfig?(newConfig: any) {
    for (const prop of [
      'cesiumDebugShowFramesPerSecond',
      'cesiumShadows',
      'cesiumBase',
      'createWorldTerrainOptions',
      'terrain_provider',
      'cesiumTimeline',
      'cesiumAnimation',
      'creditContainer',
      'cesiumInfoBox',
      'imageryProvider',
      'terrainExaggeration',
      'cesiumBingKey',
      'newTerrainProviderOptions',
      'terrain_providers',
      'cesiumAccessToken',
      'cesiumTime',
    ]) {
      if (newConfig[prop] != undefined) {
        console.error(
          `HsConfig.${prop} has been moved to HsCesiumConfig service or hslayersCesiumConfig.${prop} when using hslayers-cesium-app`
        );
      }
    }
  }

  update?(newConfig: HsConfig): void {
    this.checkDeprecatedCesiumConfig(newConfig);
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

  shortenUrl?(url: string): any;
}
