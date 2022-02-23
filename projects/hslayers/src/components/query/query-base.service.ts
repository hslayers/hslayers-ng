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

@Injectable({
  providedIn: 'root',
})
export class HsQueryBaseService {
  data = {
    attributes: [],
    features: [],
    featureInfoHtmls: [],
    customFeatures: [],
    coordinates: [],
    selectedProj: undefined,
  };

  queryActive = false;
  popupClassname = '';
  selector = null;
  currentQuery = null;
  dataCleared = true;
  queryPoint = new Point([0, 0]);
  featureLayersUnderMouse = [];
  nonQueryablePanels = [
    'measure',
    'composition_browser',
    'analysis',
    'sensors',
    // 'draw',
    'tripPlanner',
  ];
  last_coordinate_clicked: any;
  getFeatureInfoStarted: Subject<{evt; app: string}> = new Subject();
  getFeatureInfoCollected: Subject<number[] | void> = new Subject();
  queryStatusChanges: Subject<boolean> = new Subject();
  vectorSelectorCreated: Subject<Select> = new Subject();
  apps: {[key: string]: {queryLayer}} = {};

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
    this.vectorSelectorCreated.subscribe((selector) => {
      this.selector = selector;
    });
  }
  /**
   *
   */
  async init(app): Promise<void> {
    await this.hsMapService.loaded(app);
    if (this.apps[app] == undefined) {
      this.apps[app] = {
        queryLayer: new VectorLayer({
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
          style: () => this.pointClickedStyle(app),
        }),
      };
    }
    this.activateQueries(app);
    this.hsMapService.getMap(app).on('singleclick', (evt) => {
      this.zone.run(() => {
        this.hsEventBusService.mapClicked.next(
          Object.assign(evt, {
            coordinates: this.getCoordinate(evt.coordinate),
            app,
          })
        );
        if (!this.queryActive) {
          return;
        }
        this.popupClassname = '';
        if (!this.dataCleared) {
          this.clearData();
        }
        this.dataCleared = false;
        this.currentQuery = (Math.random() + 1).toString(36).substring(7);
        this.setData(this.getCoordinate(evt.coordinate), 'coordinates', true);
        this.last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
        this.data.selectedProj = this.data.coordinates[0].projections[0];
        this.getFeatureInfoStarted.next({evt, app});
      });
    });
  }

  getFeaturesUnderMouse(map: Map, pixel: any, app: string) {
    return map
      .getFeaturesAtPixel(pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.hsMapService.getLayerForFeature(feature);
        return layer && layer != this.apps[app].queryLayer;
      });
  }

  setData(data: any, type: string, overwrite?: boolean): void {
    if (type) {
      if (overwrite) {
        this.data[type].length = 0;
      }
      if (Array.isArray(data)) {
        this.data[type] = this.data[type].concat(data);
      } else {
        this.data[type].push(data);
      }
      this.hsEventBusService.queryDataUpdated.next(this.data);
    } else if (console) {
      console.log('Query.BaseService.setData type not passed');
    }
  }

  clearData(type?: string): void {
    if (type) {
      this.data[type].length = 0;
    } else {
      this.data.attributes.length = 0;
      this.data.features.length = 0;
      this.data.coordinates.length = 0;
      this.data.featureInfoHtmls = [];
      this.data.customFeatures = [];
    }
    const invisiblePopup: any = this.getInvisiblePopup();
    if (invisiblePopup) {
      invisiblePopup.contentDocument.body.innerHTML = '';
      invisiblePopup.style.height = '0px';
      invisiblePopup.style.width = '0px';
    }
    this.dataCleared = true;
  }

  getInvisiblePopup(): HTMLIFrameElement {
    if (this.hsUtilsService.runningInBrowser()) {
      return <HTMLIFrameElement>document.getElementById('invisible_popup');
    }
  }

  pushFeatureInfoHtml(html): void {
    this.data.featureInfoHtmls.push(
      this.domSanitizer.bypassSecurityTrustHtml(html)
    );
    this.dataCleared = false;
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
  getCoordinate(coordinate) {
    this.queryPoint.setCoordinates(coordinate, 'XY');
    const epsg4326Coordinate = transform(
      coordinate,
      this.hsMapService.getCurrentProj(),
      'EPSG:4326'
    );
    const coords = {
      name: this.hsLanguageService.getTranslation('QUERY.coordinates'),
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
          name: this.hsMapService.getCurrentProj().getCode(),
          value: createStringXY(7)(coordinate),
        },
      ],
    };
    return coords;
  }

  activateQueries(app: string): void {
    if (this.queryActive) {
      return;
    }
    this.queryActive = true;
    this.hsMapService.getMap(app).addLayer(this.apps[app].queryLayer);
    this.hsSaveMapService.internalLayers.push(this.apps[app].queryLayer);
    this.queryStatusChanges.next(true);
  }

  deactivateQueries(app: string): void {
    if (!this.queryActive) {
      return;
    }
    this.queryActive = false;
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
        if (this.selector.getFeatures().getLength() > 0) {
          circle.setRadius(0);
        }
      }
    }
    return defaultStyle;
  }
}
