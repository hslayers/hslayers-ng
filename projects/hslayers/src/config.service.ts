import {Injectable} from '@angular/core';

import {Geometry} from 'ol/geom';
import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {View} from 'ol';

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

/**
 * Names and corresponding numbers
 */
export interface KeyNumberDict {
  [key: string]: number;
}

export class HsConfigObject {
  componentsEnabled?: any;
  clusteringDistance?: number;
  mapInteractionsEnabled?: boolean;
  sidebarClosed?: boolean;
  sidebarPosition?: string;
  default_layers?: Layer<Source>[];
  box_layers?: Group[];
  base_layers?: {
    url: string;
    default: string;
  };
  senslog?: {
    url: string;
    user_id: number;
    group: string;
    user: string;
    liteApiPath?: string;
    mapLogApiPath?: string;
    senslog1Path?: string;
    senslog2Path?: string;
  };
  proxyPrefix?: string;
  defaultDrawLayerPath?: string;
  defaultComposition?: string;
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
  errorToastDuration?: number;
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
  shortenUrl?: any;
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
  queryPopupWidgets?: QueryPopupWidgetsType[] | string[];
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
  panelWidths?: KeyNumberDict;
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
   * Triggered when config is updated using 'update' function of HsConfig.get(app).
   * The full resulting config is provided in the subscriber as a parameter
   */
  timeDisplayFormat?: string;

  /**
   *  Determines behavior of exclusive layers (layer.exclusive = true) visibility
   *  If set to true, only layers with same path are affected by exclusivity
   */
  pathExclusivity?: boolean;
  ngRouter?: boolean;
  /*
   *   Path of image to ajax loader animation,
   *   which is calculated automatically from assetPath */
  _ajaxLoaderPath?: string;

  constructor() {
    this.pathExclusivity = false;
    this.panelsEnabled = {
      legend: true,
      info: true,
      composition_browser: true,
      toolbar: true,
      measure: true,
      mobile_settings: false,
      draw: true,
      layermanager: true,
      print: true,
      saveMap: true,
      language: true,
      permalink: true,
      compositionLoadingProgress: false,
      sensors: true,
      filter: false,
      search: false,
      tripPlanner: false,
      addData: true,
      mapSwipe: false,
    };
    this.componentsEnabled = {
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
    this.queryPopupWidgets = ['layer-name', 'feature-info', 'clear-layer'];
    this.panelWidths = {
      default: 425,
      ows: 700,
      composition_browser: 550,
      addData: 700,
      mapSwipe: 550,
    };
    this.sidebarPosition = 'right';
  }
}

@Injectable({
  providedIn: 'root',
})
export class HsConfig {
  apps: {[id: string]: HsConfigObject} = {
    default: new HsConfigObject(),
  };
  configChanges?: Subject<{app: string; config: HsConfigObject}> =
    new Subject();
  private defaultSymbolizerIcons? = [
    {name: 'favourite', url: 'img/icons/favourite28.svg'},
    {name: 'gps', url: 'img/icons/gps43.svg'},
    {name: 'information', url: 'img/icons/information78.svg'},
    {name: 'wifi', url: 'img/icons/wifi8.svg'},
  ];

  constructor() {}

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

  update?(newConfig: HsConfigObject, app?: string): void {
    if (app == undefined) {
      app = 'default';
    }
    this.checkDeprecatedCesiumConfig(newConfig);
    let appConfig = this.apps[app];
    if (appConfig == undefined) {
      this.apps[app] = new HsConfigObject();
      appConfig = this.apps[app];
    }
    appConfig.symbolizerIcons = this.defaultSymbolizerIcons.map((val) => {
      val.url = (appConfig.assetsPath ?? '') + val.url;
      return val;
    });
    Object.assign(appConfig.componentsEnabled, newConfig.componentsEnabled);
    //Delete since we assign the whole object later and don't want it replaced, but merged
    delete newConfig.componentsEnabled;
    Object.assign(appConfig.panelWidths, newConfig.panelWidths);
    delete newConfig.panelWidths;
    //See componentsEnabled ^
    Object.assign(appConfig.panelsEnabled, newConfig.panelsEnabled);
    delete newConfig.panelsEnabled;
    appConfig.symbolizerIcons = [
      ...this.updateSymbolizers(newConfig),
      ...(newConfig.symbolizerIcons ?? []),
    ];
    delete newConfig.symbolizerIcons;
    Object.assign(appConfig, newConfig);

    if (appConfig.assetsPath == undefined) {
      appConfig.assetsPath = '';
    }
    appConfig.assetsPath += appConfig.assetsPath.endsWith('/') ? '' : '/';
    appConfig._ajaxLoaderPath = appConfig.assetsPath + 'img/ajax-loader.gif';

    this.configChanges.next({app, config: appConfig});
  }

  /**
   * This kind of duplicates getAssetsPath() in HsUtilsService, which can't be used here due to circular dependency
   */
  updateSymbolizers?(config: HsConfigObject) {
    /* Removing 'private' since it makes this method non-optional */
    let assetsPath = config.assetsPath ?? '';
    assetsPath += assetsPath.endsWith('/') ? '' : '/';
    return this.defaultSymbolizerIcons.map((val) => {
      val.url = assetsPath + val.url;
      return val;
    });
  }

  get(app: string = 'default'): HsConfigObject {
    if (this.apps[app] == undefined) {
      return this.apps['default'];
    }
    return this.apps[app];
  }

  shortenUrl?(url: string): any;
}
