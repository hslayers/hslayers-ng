import {DomSanitizer} from '@angular/platform-browser';
import {Injectable, NgZone} from '@angular/core';

import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Circle as CircleStyle} from 'ol/style';
import {Coordinate, createStringXY, toStringHDMS} from 'ol/coordinate';
import {Feature, Map} from 'ol';
import {FeatureLike} from 'ol/Feature';
import {Geometry, Point} from 'ol/geom';
import {Select} from 'ol/interaction';
import {Subject} from 'rxjs';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {transform} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsUtilsService} from '../utils/utils.service';

class HsQueryData {
  attributes = [];
  features = [];
  featureInfoHtmls = [];
  customFeatures = [];
  coordinates = [];
  selectedProj;
  queryLayer;
  featureLayersUnderMouse = [];
  dataCleared = true;
  hsEventBusService;
  invisiblePopup;
  queryPoint = new Point([0, 0]);
  selector = null;
  last_coordinate_clicked: any;
  queryActive = false;
  currentQuery = null;

  constructor(queryLayerStyle, hsEventBusService, invisiblePopup) {
    this.queryLayer = new VectorLayer({
      properties: {
        title: 'Point clicked',
        queryable: false,
        showInLayerManager: false,
        removable: false,
      },
      source: new Vector({
        features: [
          new Feature({
            geometry: this.queryPoint,
          }),
        ],
      }),
      style: queryLayerStyle,
    });
    this.hsEventBusService = hsEventBusService;
    this.invisiblePopup = invisiblePopup;
  }

  set(data: any, type: string, overwrite?: boolean): void {
    if (type) {
      if (overwrite) {
        this[type].length = 0;
      }
      if (Array.isArray(data)) {
        this[type] = this[type].concat(data);
      } else {
        this[type].push(data);
      }
      this.hsEventBusService.queryDataUpdated.next(this);
    } else if (console) {
      console.log('Query.BaseService.setData type not passed');
    }
  }

  clear(type?: string): void {
    if (type) {
      this[type].length = 0;
    } else {
      this.attributes.length = 0;
      this.features.length = 0;
      this.coordinates.length = 0;
      this.featureInfoHtmls = [];
      this.customFeatures = [];
    }
    if (this.invisiblePopup) {
      this.invisiblePopup.contentDocument.body.innerHTML = '';
      this.invisiblePopup.style.height = '0px';
      this.invisiblePopup.style.width = '0px';
    }
    this.dataCleared = true;
  }
}

@Injectable({
  providedIn: 'root',
})
export class HsQueryBaseService {
  popupClassname = '';
  nonQueryablePanels = [
    'measure',
    'composition_browser',
    'analysis',
    'sensors',
    // 'draw',
    'tripPlanner',
  ];
  getFeatureInfoStarted: Subject<{evt; app: string}> = new Subject();
  getFeatureInfoCollected: Subject<number[] | void> = new Subject();
  queryStatusChanges: Subject<{status: boolean; app: string}> = new Subject();
  vectorSelectorCreated: Subject<{selector: Select; app: string}> =
    new Subject();
  apps: {[key: string]: HsQueryData} = {};

  constructor(
    private hsMapService: HsMapService,
    private hsConfig: HsConfig,
    private hsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private hsUtilsService: HsUtilsService,
    private hsEventBusService: HsEventBusService,
    private hsSaveMapService: HsSaveMapService,
    private domSanitizer: DomSanitizer,
    private zone: NgZone
  ) {
    this.vectorSelectorCreated.subscribe((data) => {
      this.get(data.app).selector = data.selector;
    });
  }

  /**
   * Get the params saved by the query base service for the current app
   * @param app - App identifier
   * @returns Query base service data for the app
   */
  get(app: string): HsQueryData {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsQueryData(
        () => this.pointClickedStyle(app),
        this.hsEventBusService,
        this.getInvisiblePopup()
      );
    }
    return this.apps[app ?? 'default'];
  }
  /**
   * Initialize the query base service data and subscribers
   * @param app - App identifier
   */
  async init(app: string): Promise<void> {
    await this.hsMapService.loaded(app);
    const appRef = this.get(app);
    this.activateQueries(app);
    this.hsMapService.getMap(app).on('singleclick', (evt) => {
      this.zone.run(() => {
        this.hsEventBusService.mapClicked.next(
          Object.assign(evt, {
            coordinates: this.getCoordinate(evt.coordinate, app),
            app,
          })
        );
        if (!appRef.queryActive) {
          return;
        }
        this.popupClassname = '';
        if (!appRef) {
          appRef.clear();
        }
        appRef.dataCleared = false;
        appRef.currentQuery = (Math.random() + 1).toString(36).substring(7);
        appRef.set(
          this.getCoordinate(evt.coordinate, app),
          'coordinates',
          true
        );
        appRef.last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
        appRef.selectedProj = appRef.coordinates[0].projections[0];
        this.getFeatureInfoStarted.next({evt, app});
      });
    });
  }

  /**
   * Get features under the mouse pointer on the map
   * @param map - Current map object
   * @param pixel - Target pixel
   * @param app - App identifier
   * @returns Array with features
   */
  getFeaturesUnderMouse(map: Map, pixel: number[], app: string): FeatureLike[] {
    return map
      .getFeaturesAtPixel(pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature, app);
        return layer && layer != this.get(app).queryLayer;
      });
  }

  /**
   * Get invisible popup element
   * @returns HTML frame element, if the app is running in a browser
   */
  getInvisiblePopup(): HTMLIFrameElement {
    if (this.hsUtilsService.runningInBrowser()) {
      return <HTMLIFrameElement>document.getElementById('invisible_popup');
    }
  }

  /**
   * Push a new feature info html content to other htmls array
   * @param html - Feature info html content
   * @param app - App identifier
   */
  pushFeatureInfoHtml(html: string, app: string): void {
    const appRef = this.get(app);
    appRef.featureInfoHtmls.push(
      this.domSanitizer.bypassSecurityTrustHtml(html)
    );
    appRef.dataCleared = false;
  }

  /**
   * Fill popup iframe and resize it to fit the content
   * @param response - Response of GetFeatureInfoRequest
   * @param append - If true, the response will be appended to iframe's inner HTML, otherwise its content will be replaced
   * @param app - App identifier
   */
  fillIframeAndResize(response: string, append: boolean, app: string): void {
    const iframe = this.getInvisiblePopup();
    if (append) {
      iframe.contentDocument.body.innerHTML += response;
    } else {
      iframe.contentDocument.body.innerHTML = response;
    }
    let tmp_width = iframe.contentWindow.innerWidth;
    if (
      tmp_width >
      this.hsLayoutService.get(app).contentWrapper.querySelector('.hs-ol-map')
        .clientWidth -
        60
    ) {
      tmp_width =
        this.hsLayoutService.get(app).contentWrapper.querySelector('.hs-ol-map')
          .clientWidth - 60;
    }
    iframe.style.width = tmp_width + 'px';
    let tmp_height = iframe.contentWindow.innerHeight;
    if (tmp_height > 700) {
      tmp_height = 700;
    }
    iframe.style.height = tmp_height + 'px';
  }

  /**
   * Get coordinates in multiple projections
   * @param coordinate - Coordinates from map single click interaction
   * @param app - App identifier
   * @returns Object with coordinates in multiple projections
   */
  getCoordinate(
    coordinate: Coordinate,
    app: string
  ): {
    name: string;
    mapProjCoordinate: Coordinate;
    epsg4326Coordinate: Coordinate;
    projections: {name: string; value: any}[];
  } {
    this.get(app).queryPoint.setCoordinates(coordinate, 'XY');
    const epsg4326Coordinate = transform(
      coordinate,
      this.hsMapService.getCurrentProj(app),
      'EPSG:4326'
    );
    const coords = {
      name: this.hsLanguageService.getTranslation(
        'QUERY.coordinates',
        undefined,
        app
      ),
      mapProjCoordinate: coordinate,
      epsg4326Coordinate,
      projections: [
        {
          name: 'EPSG:4326',
          value: toStringHDMS(epsg4326Coordinate),
        },
        {
          name: 'EPSG:4326',
          value: createStringXY(7)(epsg4326Coordinate),
        },
        {
          name: this.hsMapService.getCurrentProj(app).getCode(),
          value: createStringXY(7)(coordinate),
        },
      ],
    };
    return coords;
  }

  /**
   * Activate queries for the current OL map
   * @param app - App identifier
   */
  activateQueries(app: string): void {
    const appRef = this.get(app);
    if (appRef.queryActive) {
      return;
    }
    appRef.queryActive = true;
    this.hsMapService.getMap(app).addLayer(appRef.queryLayer);
    this.hsSaveMapService.internalLayers.push(appRef.queryLayer);
    this.queryStatusChanges.next({status: true, app});
  }

  /**
   * Deactivate queries for the current OL map
   * @param app - App identifier
   */
  deactivateQueries(app: string): void {
    const appRef = this.get(app);
    if (!appRef.queryActive) {
      return;
    }
    appRef.queryActive = false;
    this.hsMapService.getMap(app).removeLayer(appRef.queryLayer);
    this.queryStatusChanges.next({status: false, app});
  }

  /**
   * Check if current app panel is queryable
   * @param app - App identifier
   * @returns - True or false
   */
  currentPanelQueryable(app: string): boolean {
    return (
      !this.nonQueryablePanels.includes(
        this.hsLayoutService.get(app).mainpanel
      ) && !this.nonQueryablePanels.includes('*')
    );
  }

  /**
   * Get style for point clicked on the map
   * @param app - App identifier
   * @returns - OL style
   */
  pointClickedStyle(app: string): Style {
    const defaultStyle = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'rgba(255, 156, 156, 0.4)',
        }),
        stroke: new Stroke({
          color: '#cc3333',
          width: 1,
        }),
        radius: 5,
      }),
    });
    if (this.hsConfig.get(app).queryPoint) {
      const circle = defaultStyle.getImage() as CircleStyle;
      if (this.hsConfig.get(app).queryPoint == 'hidden') {
        circle.setRadius(0);
      } else if (this.hsConfig.get(app).queryPoint == 'notWithin') {
        if (this.get(app).selector.getFeatures().getLength() > 0) {
          circle.setRadius(0);
        }
      }
    }
    return defaultStyle;
  }
}
