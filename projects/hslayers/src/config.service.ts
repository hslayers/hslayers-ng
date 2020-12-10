import BaseLayer from 'ol/layer/Base';
import View from 'ol/View';
import { Subject } from 'rxjs';

export class HsConfig {
  cesiumTime?: any;
  componentsEnabled?: any = {toolbar: true};
  mapInteractionsEnabled?: boolean;
  allowAddExternalDatasets?: boolean;
  sidebarClosed?: boolean;
  sidebarPosition?: string;
  layer_order?: string;
  box_layers?: Array<any>;
  senslog?: any;
  cesiumdDebugShowFramesPerSecond?: boolean;
  cesiumShadows?: number;
  cesiumBase?: string;
  createWorldTerrainOptions?: any;
  terrain_provider?: any;
  cesiumTimeline?: boolean;
  cesiumAnimation?: boolean;
  creditContainer?: any;
  cesiumInfoBox?: any;
  clusteringDistance?: number;
  dss_disallow_add?: boolean;
  imageryProvider?: any;
  terrainExaggeration?: number;
  cesiumBingKey?: string;
  newTerrainProviderOptions?: any;
  terrain_providers?: any;
  cesiumAccessToken?: string;
  proxyPrefix?: string;
  defaultDrawLayerPath?: string;
  default_layers: Array<BaseLayer>;
  default_view: View;
  panelsEnabled: {
    legend?: boolean,
    info?: boolean,
    composition_browser?: boolean,
    toolbar?: boolean,
    mobile_settings?: boolean,
    draw?: boolean,
    datasource_selector?: boolean,
    layermanager?: boolean,
    feature_crossfilter?: boolean,
    print?: boolean,
    saveMap?: boolean,
    language?: boolean,
    permalink?: boolean,
    compositionLoadingProgress?: boolean,
    sensors?: boolean,
    filter?: boolean,
    search?: boolean,
    tripPlanner?: boolean,
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
  theme?: any;
  datasources?: any;
  panelWidths?: any;
  sidebarToggleable?: any;
  sizeMode?: string;
  locationButtonVisible?: any;
  openQueryPanelOnDrawEnd?: boolean;
  assetsPath?: string;

  configChanges?: Subject<HsConfig> = new Subject()
  constructor() {}

  update?(newConfig: HsConfig){
    Object.assign(this, newConfig);
    this.configChanges.next(this);
  }
}
