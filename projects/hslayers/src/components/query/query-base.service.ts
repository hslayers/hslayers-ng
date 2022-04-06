import {DomSanitizer} from '@angular/platform-browser';
import {Injectable, NgZone} from '@angular/core';

import CircleStyle from 'ol/style/Circle';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Feature, Map} from 'ol';
import {Geometry, Point} from 'ol/geom';
import {Select} from 'ol/interaction';
import {Subject} from 'rxjs';
import {Vector} from 'ol/source';
import {createStringXY, toStringHDMS} from 'ol/coordinate';
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
  queryStatusChanges: Subject<boolean> = new Subject();
  vectorSelectorCreated: Subject<{selector: Select; app: string}> =
    new Subject();
  apps: {[key: string]: HsQueryData} = {};

  constructor(
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService,
    private hsSaveMapService: HsSaveMapService,
    private domSanitizer: DomSanitizer,
    private zone: NgZone
  ) {
    this.vectorSelectorCreated.subscribe((data) => {
      this.get(data.app).selector = data.selector;
    });
  }

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
   *
   */
  async init(app): Promise<void> {
    await this.hsMapService.loaded(app);
    if (this.apps[app] == undefined) {
      this.apps[app] = new HsQueryData(
        () => this.pointClickedStyle(app),
        this.hsEventBusService,
        this.getInvisiblePopup()
      );
    }
    this.activateQueries(app);
    this.hsMapService.getMap(app).on('singleclick', (evt) => {
      this.zone.run(() => {
        this.hsEventBusService.mapClicked.next(
          Object.assign(evt, {
            coordinates: this.getCoordinate(evt.coordinate, app),
            app,
          })
        );
        if (!this.apps[app].queryActive) {
          return;
        }
        this.popupClassname = '';
        if (!this.apps[app]) {
          this.apps[app].clear();
        }
        this.apps[app].dataCleared = false;
        this.apps[app].currentQuery = (Math.random() + 1)
          .toString(36)
          .substring(7);
        this.apps[app].set(
          this.getCoordinate(evt.coordinate, app),
          'coordinates',
          true
        );
        this.apps[app].last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
        this.apps[app].selectedProj =
          this.apps[app].coordinates[0].projections[0];
        this.getFeatureInfoStarted.next({evt, app});
      });
    });
  }

  getFeaturesUnderMouse(map: Map, pixel: any, app: string) {
    return map
      .getFeaturesAtPixel(pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature, app);
        return layer && layer != this.apps[app].queryLayer;
      });
  }

  getInvisiblePopup(): HTMLIFrameElement {
    if (this.hsUtilsService.runningInBrowser()) {
      return <HTMLIFrameElement>document.getElementById('invisible_popup');
    }
  }

  pushFeatureInfoHtml(html, app: string): void {
    this.apps[app].featureInfoHtmls.push(
      this.domSanitizer.bypassSecurityTrustHtml(html)
    );
    this.apps[app].dataCleared = false;
  }

  fillIframeAndResize(response, append: boolean, app: string): void {
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
   * @param coordinate -
   */
  getCoordinate(coordinate, app: string) {
    this.apps[app].queryPoint.setCoordinates(coordinate, 'XY');
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

  activateQueries(app: string): void {
    const appRef = this.get(app);
    if (appRef.queryActive) {
      return;
    }
    appRef.queryActive = true;
    this.hsMapService.getMap(app).addLayer(this.apps[app].queryLayer);
    this.hsSaveMapService.internalLayers.push(this.apps[app].queryLayer);
    this.queryStatusChanges.next(true);
  }

  deactivateQueries(app: string): void {
    const appRef = this.get(app);
    if (!appRef.queryActive) {
      return;
    }
    appRef.queryActive = false;
    this.hsMapService.getMap(app).removeLayer(this.apps[app].queryLayer);
    this.queryStatusChanges.next(false);
  }

  currentPanelQueryable(app: string): boolean {
    return (
      !this.nonQueryablePanels.includes(
        this.hsLayoutService.get(app).mainpanel
      ) && !this.nonQueryablePanels.includes('*')
    );
  }

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
