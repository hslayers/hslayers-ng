import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Injectable, NgZone} from '@angular/core';
import {Subject} from 'rxjs';

import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {Coordinate, createStringXY, toStringHDMS} from 'ol/coordinate';
import {Feature, Map} from 'ol';
import {FeatureLike} from 'ol/Feature';
import {Point} from 'ol/geom';
import {Select} from 'ol/interaction';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {transform} from 'ol/proj';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsFeatureDescriptor} from 'hslayers-ng/types';

export type HsProjectedCoordinatesDescription = {
  /**
   * EPSG code name of the projection
   */
  name: string;
  /**
   * Stringified coordinate values in the named projection
   */
  value: string;
};

export type HsCoordinateDescription = {
  /**
   * Translated title "coordinates"
   */
  name: string;
  mapProjCoordinate: Coordinate;
  epsg4326Coordinate: Coordinate;
  projections: HsProjectedCoordinatesDescription[];
};

@Injectable({
  providedIn: 'root',
})
export class HsQueryBaseService {
  attributes = [];
  features: HsFeatureDescriptor[] = [];
  featureInfoHtmls: SafeHtml[] = [];
  customFeatures = [];
  coordinates: HsCoordinateDescription[] = [];
  selectedProj: HsProjectedCoordinatesDescription;
  queryLayer: VectorLayer;
  featureLayersUnderMouse = [];
  dataCleared = true;
  invisiblePopup: HTMLIFrameElement;
  queryPoint = new Point([0, 0]);
  selector: Select = null;
  last_coordinate_clicked: any;
  queryActive = false;
  currentQuery: string = null;

  popupClassname = '';
  nonQueryablePanels = [
    'measure',
    'compositions',
    'analysis',
    'sensors',
    // 'draw',
    'tripPlanner',
  ];
  getFeatureInfoStarted: Subject<any> = new Subject();
  getFeatureInfoCollected: Subject<number[] | void> = new Subject();
  queryStatusChanges: Subject<boolean> = new Subject();
  vectorSelectorCreated: Subject<Select> = new Subject();

  multiWmsQuery = false;
  wmsFeatureInfoLoading = false;

  constructor(
    private hsMapService: HsMapService,
    private hsConfig: HsConfig,
    private hsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private hsUtilsService: HsUtilsService,
    private hsEventBusService: HsEventBusService,
    private hsSaveMapService: HsSaveMapService,
    private domSanitizer: DomSanitizer,
    private zone: NgZone,
  ) {
    this.vectorSelectorCreated.subscribe((selector) => {
      this.selector = selector;
    });

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
      style: () => this.pointClickedStyle(),
    });
    this.invisiblePopup = this.getInvisiblePopup();

    this.hsMapService.loaded().then((map) => {
      this.activateQueries();
      this.hsMapService.getMap().on('singleclick', (evt) => {
        this.zone.run(() => {
          this.hsEventBusService.mapClicked.next(
            Object.assign(evt, {
              coordinates: this.getCoordinate(evt.coordinate),
            }),
          );
          if (!this.queryActive) {
            return;
          }
          this.popupClassname = '';
          if (!this) {
            this.clear();
          }
          this.dataCleared = false;
          this.currentQuery = (Math.random() + 1).toString(36).substring(7);
          this.setCoordinates(this.getCoordinate(evt.coordinate));
          this.last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
          this.selectedProj = this.coordinates[0].projections[0];
          this.getFeatureInfoStarted.next(evt);
        });
      });
    });
  }

  /**
   * Get features under the mouse pointer on the map
   * @param map - Current map object
   * @param pixel - Target pixel
   * @returns Array with features
   */
  getFeaturesUnderMouse(map: Map, pixel: number[]): FeatureLike[] {
    return map.getFeaturesAtPixel(pixel, {
      layerFilter: (layer) => layer['ol_uid'] !== this.queryLayer['ol_uid'],
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
   */
  pushFeatureInfoHtml(html: string): void {
    const sanitizedHtml = this.domSanitizer.bypassSecurityTrustHtml(html);
    if (this.multiWmsQuery) {
      this.featureInfoHtmls.push(sanitizedHtml);
    } else {
      this.featureInfoHtmls = [sanitizedHtml];
    }
    this.dataCleared = false;
  }

  /**
   * Fill popup iframe and resize it to fit the content
   * @param response - Response of GetFeatureInfoRequest
   * @param append - If true, the response will be appended to iframe's inner HTML, otherwise its content will be replaced
   */
  fillIframeAndResize(response: string, append: boolean): void {
    const iframe = this.getInvisiblePopup();
    if (append) {
      iframe.contentDocument.body.innerHTML += response;
    } else {
      iframe.contentDocument.body.innerHTML = response;
    }
    const mapElement =
      this.hsLayoutService.contentWrapper.querySelector('.hs-ol-map');
    const maxWidth = mapElement.clientWidth - 60;
    const maxHeight = 700;

    const tmp_width = Math.min(iframe.contentWindow.innerWidth, maxWidth);
    const tmp_height = Math.min(iframe.contentWindow.innerHeight, maxHeight);

    iframe.style.width = `${tmp_width}px`;
    iframe.style.height = `${tmp_height}px`;
  }

  /**
   * Get coordinates in multiple projections
   * @param coordinate - Coordinates from map single click interaction
   * @returns Object with coordinates in multiple projections
   */
  getCoordinate(coordinate: Coordinate): HsCoordinateDescription {
    this.queryPoint.setCoordinates(coordinate, 'XY');
    const epsg4326Coordinate = transform(
      coordinate,
      this.hsMapService.getCurrentProj(),
      'EPSG:4326',
    );
    const coords = {
      name: this.hsLanguageService.getTranslation(
        'QUERY.coordinates',
        undefined,
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
          name: this.hsMapService.getCurrentProj().getCode(),
          value: createStringXY(7)(coordinate),
        },
      ],
    };
    return coords;
  }

  /**
   * Activate queries for the current OL map
   */
  activateQueries(): void {
    if (this.queryActive) {
      return;
    }
    this.queryActive = true;
    this.hsMapService.loaded().then((map) => {
      map.addLayer(this.queryLayer);
    });
    this.hsSaveMapService.internalLayers.push(this.queryLayer);
    this.queryStatusChanges.next(true);
  }

  /**
   * Deactivate queries for the current OL map
   */
  deactivateQueries(): void {
    if (!this.queryActive) {
      return;
    }
    this.queryActive = false;
    this.hsMapService.loaded().then((map) => {
      map.removeLayer(this.queryLayer);
    });
    this.queryStatusChanges.next(false);
  }

  /**
   * Check if current app panel is queryable
   * @returns - True or false
   */
  currentPanelQueryable(): boolean {
    return (
      !this.nonQueryablePanels.includes(this.hsLayoutService.mainpanel) &&
      !this.nonQueryablePanels.includes('*')
    );
  }

  /**
   * Get style for point clicked on the map
   * @returns - OL style
   */
  pointClickedStyle(): Style {
    const defaultStyle = new Style({
      image: new CircleStyle({
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
    if (this.hsConfig.queryPoint) {
      const circle = defaultStyle.getImage() as CircleStyle;
      if (this.hsConfig.queryPoint == 'hidden') {
        circle.setRadius(0);
      } else if (this.hsConfig.queryPoint == 'notWithin') {
        if (this.selector.getFeatures().getLength() > 0) {
          circle.setRadius(0);
        }
      }
    }
    return defaultStyle;
  }

  /**
   * Sets latest coordinates as current descriptor
   * @param coords - Description of coordinates in HsCoordinateDescription format
   */
  setCoordinates(coords: HsCoordinateDescription): void {
    this.coordinates.length = 0;
    this.coordinates.push(coords);
    this.hsEventBusService.queryDataUpdated.next(this);
  }

  /**
   * Sets latest features as current descriptor
   * @param features - Either a description of features in HsFeatureDescription format or an array of these descriptions
   */
  setFeatures(features: HsFeatureDescriptor[] | HsFeatureDescriptor): void {
    if (Array.isArray(features)) {
      this.features = this.features.concat(features);
    } else {
      this.features.push(features);
    }
    this.hsEventBusService.queryDataUpdated.next(this);
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
