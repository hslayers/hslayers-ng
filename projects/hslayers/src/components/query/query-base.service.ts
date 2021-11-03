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
  map: Map;
  data: any = {
    attributes: [],
    features: [],
    featureInfoHtmls: [],
    customFeatures: [],
    coordinates: [],
  };
  queryActive = false;
  popupClassname = '';
  selector = null;
  currentQuery = null;
  dataCleared = true;
  queryPoint = new Point([0, 0]);
  queryLayer = new VectorLayer({
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
    style: () => this.pointClickedStyle(),
  });
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
  getFeatureInfoStarted: Subject<any> = new Subject();
  getFeatureInfoCollected: Subject<any> = new Subject();
  queryStatusChanges: Subject<boolean> = new Subject();
  vectorSelectorCreated: Subject<Select> = new Subject();

  constructor(
    public HsMapService: HsMapService,
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    private HsSaveMapService: HsSaveMapService,
    private DomSanitizer: DomSanitizer,
    private zone: NgZone
  ) {
    this.vectorSelectorCreated.subscribe((selector) => {
      this.selector = selector;
    });

    this.HsMapService.loaded().then(() => this.init());
  }
  /**
   *
   */
  init(): void {
    this.map = this.HsMapService.map;
    this.activateQueries();
    this.map.on('singleclick', (evt) => {
      this.zone.run(() => {
        this.HsEventBusService.mapClicked.next(
          Object.assign(evt, {
            coordinates: this.getCoordinate(evt.coordinate),
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
        this.getFeatureInfoStarted.next(evt);
      });
    });
  }

  getFeaturesUnderMouse(map: Map, pixel: any) {
    return map
      .getFeaturesAtPixel(pixel)
      .filter((feature: Feature<Geometry>) => {
        const layer = this.HsMapService.getLayerForFeature(feature);
        return layer && layer != this.queryLayer;
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
      this.HsEventBusService.queryDataUpdated.next(this.data);
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
    if (this.HsUtilsService.runningInBrowser()) {
      return <HTMLIFrameElement>document.getElementById('invisible_popup');
    }
  }

  pushFeatureInfoHtml(html): void {
    this.data.featureInfoHtmls.push(
      this.DomSanitizer.bypassSecurityTrustHtml(html)
    );
    this.dataCleared = false;
  }

  fillIframeAndResize(response, append: boolean): void {
    const iframe = this.getInvisiblePopup();
    if (append) {
      iframe.contentDocument.body.innerHTML += response;
    } else {
      iframe.contentDocument.body.innerHTML = response;
    }
    let tmp_width = iframe.contentWindow.innerWidth;
    if (
      tmp_width >
      this.HsLayoutService.contentWrapper.querySelector('.hs-ol-map')
        .clientWidth -
        60
    ) {
      tmp_width =
        this.HsLayoutService.contentWrapper.querySelector('.hs-ol-map')
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
      this.HsMapService.getCurrentProj(),
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
          name: this.HsMapService.getCurrentProj().getCode(),
          value: createStringXY(7)(coordinate),
        },
      ],
    };
    return coords;
  }

  activateQueries(): void {
    if (this.queryActive) {
      return;
    }
    this.queryActive = true;
    this.HsMapService.loaded().then((map) => {
      map.addLayer(this.queryLayer);
      this.HsSaveMapService.internalLayers.push(this.queryLayer);
      this.queryStatusChanges.next(true);
    });
  }

  deactivateQueries(): void {
    if (!this.queryActive) {
      return;
    }
    this.queryActive = false;
    this.HsMapService.loaded().then((map) => {
      map.removeLayer(this.queryLayer);
      this.queryStatusChanges.next(false);
    });
  }

  currentPanelQueryable(): boolean {
    return (
      !this.nonQueryablePanels.includes(this.HsLayoutService.mainpanel) &&
      !this.nonQueryablePanels.includes('*')
    );
  }

  pointClickedStyle(): Style {
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
    if (this.HsConfig.queryPoint) {
      const circle = defaultStyle.getImage() as CircleStyle;
      if (this.HsConfig.queryPoint == 'hidden') {
        circle.setRadius(0);
      } else if (this.HsConfig.queryPoint == 'notWithin') {
        if (this.selector.getFeatures().getLength() > 0) {
          circle.setRadius(0);
        }
      }
    }
    return defaultStyle;
  }
}
