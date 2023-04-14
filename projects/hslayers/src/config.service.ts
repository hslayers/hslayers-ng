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
import {HsEndpoint} from './common/endpoints/endpoint.interface';
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
  mobileBreakpoint?: number;
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
  shortenUrl?: (url) => any;
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
  datasources?: HsEndpoint[];
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
   * Triggered when config is updated using 'update' function of HsConfig.
   * The full resulting config is provided in the subscriber as a parameter
   */
  timeDisplayFormat?: string;

  /**
   * Determines behavior of exclusive layers (layer.exclusive = true) visibility
   * If set to true, only layers with same path are affected by exclusivity
   */
  pathExclusivity?: boolean;
  ngRouter?: boolean;
  /**
   * Path of image to ajax loader animation,
   * which is calculated automatically from assetPath
   * TODO: REMOVE in 12.0
   * @deprecated - replace the image with <span class="hs-loader"></span> or <span class="hs-loader hs-loader-dark"></span>
   */
  _ajaxLoaderPath?: string;

  constructor() {
    this.pathExclusivity = false;
    this.panelsEnabled = {
      legend: true,
      info: true,
      composition_browser: true,
      toolbar: true,
      measure: true,
      /**
       * @deprecated Panel not available
       * TODO: Remove in 12
       */
      mobile_settings: false,
      draw: true,
      layermanager: true,
      print: true,
      saveMap: true,
      language: true,
      permalink: true,
      compositionLoadingProgress: false,
      sensors: true,
      /**
       * @deprecated Panel not available
       * TODO: Remove in 12
       */
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
    this.mobileBreakpoint = 767;
  }
}

@Injectable({
  providedIn: 'root',
})
export class HsConfig extends HsConfigObject {
  id: string;
  configChanges?: Subject<void> = new Subject();
  private defaultSymbolizerIcons? = [
    {name: 'favourite', url: 'img/icons/favourite28.svg'},
    {name: 'gps', url: 'img/icons/gps43.svg'},
    {name: 'information', url: 'img/icons/information78.svg'},
    {name: 'wifi', url: 'img/icons/wifi8.svg'},
  ];

  constructor() {
    super();
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

  update?(newConfig: HsConfigObject): void {
    this.checkDeprecatedCesiumConfig(newConfig);
    if (newConfig.sidebarPosition === 'bottom') {
      /**Set hight enough value to make sure class setting mobile-view is not toggled*/
      newConfig.mobileBreakpoint = 9999;
    }
    this.symbolizerIcons = this.defaultSymbolizerIcons.map((val) => {
      val.url = (this.assetsPath ?? '') + val.url;
      return val;
    });
    Object.assign(this.componentsEnabled, newConfig.componentsEnabled);
    //Delete since we assign the whole object later and don't want it replaced, but merged
    delete newConfig.componentsEnabled;
    Object.assign(this.panelWidths, newConfig.panelWidths);
    delete newConfig.panelWidths;
    //See componentsEnabled ^
    Object.assign(this.panelsEnabled, newConfig.panelsEnabled);
    delete newConfig.panelsEnabled;
    this.symbolizerIcons = [
      ...this.updateSymbolizers(newConfig),
      ...(newConfig.symbolizerIcons ?? []),
    ];
    delete newConfig.symbolizerIcons;
    Object.assign(this, newConfig);

    if (this.assetsPath == undefined) {
      this.assetsPath = '';
    }
    this.assetsPath += this.assetsPath.endsWith('/') ? '' : '/';
    this._ajaxLoaderPath = this.assetsPath + 'img/ajax-loader.gif';

    this.configChanges.next();
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

  /**
   * Sets app id
   */
  setAppId(id: string) {
    this.id = id;
  }
}
