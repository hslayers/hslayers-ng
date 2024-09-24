import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {Feature, View} from 'ol';
import {Group, Layer, Vector as VectorLayer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';

import {AddDataFileType} from 'hslayers-ng/types';
import {AddDataUrlType} from 'hslayers-ng/types';
import {HsEndpoint} from 'hslayers-ng/types';
import {QueryPopupWidgetsType} from 'hslayers-ng/types';
import {StyleLike} from 'ol/style/Style';
import {WidgetItem} from 'hslayers-ng/types';

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

export type PanelsEnabled = {
  legend?: boolean;
  measure?: boolean;
  query?: boolean;
  compositions?: boolean;
  draw?: boolean;
  layerManager?: boolean;
  featureTable?: boolean;
  feature_crossfilter?: boolean;
  print?: boolean;
  saveMap?: boolean;
  language?: boolean;
  share?: boolean;
  sensors?: boolean;
  search?: boolean;
  tripPlanner?: boolean;
  addData?: boolean;
  mapSwipe?: boolean;
  wfsFilter?: boolean;
};
//Provides PanelsEnabled suggestions while keeping type open for custom panels
export type DefaultPanel =
  | keyof PanelsEnabled
  | (string & Record<never, never>);

export class HsConfigObject {
  componentsEnabled?: {
    guiOverlay?: boolean;
    info?: boolean;
    sidebar?: boolean;
    toolbar?: boolean;
    drawToolbar?: boolean;
    searchToolbar?: boolean;
    measureToolbar?: boolean;
    geolocationButton?: boolean;
    defaultViewButton?: boolean;
    mapControls?: boolean;
    basemapGallery?: boolean;
    mapSwipe?: boolean;
    queryPopup?: boolean;
  };
  clusteringDistance?: number;
  mapInteractionsEnabled?: boolean;
  sidebarClosed?: boolean;
  sidebarPosition?: string;
  default_layers?: Layer<Source>[];
  mobileBreakpoint?: number;
  base_layers?: {
    url: string;
    default: string;
  };
  senslog?: {
    url: string;
    user_id: number;
    group: string;
    user: string;
    /**
     * Whitelist object defining which units and which unit sensors
     * should be listed. Each key is a `unit_id`, and the value is an array
     * of `sensor_id`s to be included for that unit.
     * If the value is `all`, all sensors for that unit will be included.
     *
     * Example:
     * ```
     * {
     *   default: [1,2,3],
     *   1305167: [530040, 560030],
     *   1405167: 'all'
     * }
     *```
     * The `default` property defines a common set of sensor IDs that should be included for all units,
     * unless overridden by a specific unit's configuration.
     */
    filter?: {
      default?: number[];
      [unit_id: number]: number[] | 'all';
    };
    liteApiPath?: string;
    mapLogApiPath?: string;
    senslog1Path?: string;
    senslog2Path?: string;
    /**
     * Directory path in which objects defining vega view timeFormatLocale attribute are located.
     * Used to localize time unit of vega charts for non default languages/specific changes
     */
    timeFormatConfigPath?: string;
  };
  proxyPrefix?: string;
  defaultDrawLayerPath?: string;
  defaultComposition?: string;
  default_view?: View;
  panelsEnabled?: PanelsEnabled;
  defaultPanel?: DefaultPanel;
  errorToastDuration?: number;
  advancedForm?: boolean;
  project_name?: string;
  hostname?: {
    shareService?: {
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
  shareServiceUrl?: string;
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
  /**
   * Allows adding natively not supported languages.
   * Use it together with `enabledLanguages` and `translationOverrides`.
   * @example
   *  {
   *    'af' : 'Afrikaans'
   *  }
   */
  additionalLanguages?: {
    [key: string]: string;
  };
  query?: {multi?: boolean; style?: StyleLike};
  /**
   * Configures visibility of clicked point feature.
   *   - `'hidden'` - Hides clicked point feature at all times
   *   - `'notWithin'` - Hides clicked point feature in case it would overlap with other features
   */
  queryPoint?: 'notWithin' | 'hidden';
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
  layersInFeatureTable?: VectorLayer<VectorSource<Feature>>[];
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

  constructor() {
    this.pathExclusivity = false;
    this.panelsEnabled = {
      legend: true,
      compositions: true,
      measure: true,
      draw: true,
      layerManager: true,
      print: true,
      saveMap: true,
      language: true,
      share: true,
      query: true,
      sensors: false,
      search: true,
      tripPlanner: false,
      addData: true,
      mapSwipe: false,
      wfsFilter: false,
    };
    this.componentsEnabled = {
      guiOverlay: true,
      info: true,
      sidebar: true,
      toolbar: true,
      searchToolbar: true,
      drawToolbar: true,
      measureToolbar: true,
      geolocationButton: true,
      defaultViewButton: true,
      mapControls: true,
      basemapGallery: false,
      // Says whether it should be activated by default. Is overriden by url param
      mapSwipe: false,
      queryPopup: true,
    };
    this.queryPopupWidgets = ['layer-name', 'feature-info', 'clear-layer'];
    this.panelWidths = {
      default: 425,
      ows: 700,
      compositions: 550,
      addData: 700,
      wfsFilter: 550,
      mapSwipe: 550,
    };
    this.sidebarPosition = 'right';
    this.sidebarToggleable = true;
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
          `HsConfig.${prop} has been moved to HsCesiumConfig service or hslayersCesiumConfig.${prop} when using hslayers-cesium-app`,
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
