import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {DomSanitizer} from '@angular/platform-browser';
import {Feature, Map} from 'ol';
import {Injectable, NgZone} from '@angular/core';
import {Point} from 'ol/geom';
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
import {getFeatures} from '../../common/feature-extensions';
import {getPopUp, getTitle} from '../../common/layer-extensions';

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
  featuresUnderMouse: Feature[] = [];
  featureLayersUnderMouse = [];
  dataCleared = true;
  queryPoint = new Point([0, 0]);
  queryLayer = new VectorLayer({
    title: 'Point clicked',
    queryable: false,
    source: new Vector({
      features: [
        new Feature({
          geometry: this.queryPoint,
        }),
      ],
    }),
    showInLayerManager: false,
    removable: false,
    style: (feature) => this.pointClickedStyle(feature),
  });

  nonQueryablePanels = [
    'measure',
    'composition_browser',
    'analysis',
    'sensors',
    // 'draw',
    'tripPlanner',
  ];
  last_coordinate_clicked: any;
  hoverPopup: any;
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

    if (this.HsConfig.popUpDisplay && this.HsConfig.popUpDisplay === 'hover') {
      this.map.on(
        'pointermove',
        this.HsUtilsService.debounce(this.showPopUp, 200, false, this)
      );
    } else if (
      this.HsConfig.popUpDisplay &&
      this.HsConfig.popUpDisplay === 'click'
    ) {
      this.map.on(
        'singleclick',
        this.HsUtilsService.debounce(this.showPopUp, 200, false, this)
      );
    } /* else none */
  }

  /**
   * @param e Event, which triggered this function
   */
  showPopUp(e): void {
    // The latter case happens when hovering over the pop-up itself
    if (e.dragging || e.originalEvent?.target?.tagName != 'CANVAS') {
      return;
    }
    if (!this.queryActive) {
      return;
    }
    const map = e.map;
    const tmpFeatures = this.getFeaturesUnderMouse(map, e.pixel);
    if (
      tmpFeatures.some((f) => !this.featuresUnderMouse.includes(f)) ||
      this.featuresUnderMouse.some((f) => !tmpFeatures.includes(f))
    ) {
      this.zone.run(() => {
        this.featuresUnderMouse = tmpFeatures;
        if (this.featuresUnderMouse.length) {
          this.featureLayersUnderMouse = this.featuresUnderMouse.map((f) =>
            this.HsMapService.getLayerForFeature(f)
          );
          this.featureLayersUnderMouse = this.HsUtilsService.removeDuplicates(
            this.featureLayersUnderMouse,
            'title'
          );
          this.featureLayersUnderMouse = this.featureLayersUnderMouse.map(
            (l) => {
              const layer = {
                title: getTitle(l),
                layer: l,
                features: this.featuresUnderMouse.filter(
                  (f) => this.HsMapService.getLayerForFeature(f) == l
                ),
              };
              return layer;
            }
          );
          this.featuresUnderMouse.forEach((feature) => {
            this.serializeFeatureAttributes(feature);
            if (getFeatures(feature)) {
              getFeatures(feature).forEach((subfeature) =>
                this.serializeFeatureAttributes(subfeature)
              );
            }
          });
        } else {
          this.featuresUnderMouse = [];
        }
      });
    }
    const pixel = e.pixel;
    pixel[0] += 2;
    pixel[1] += 4;
    this.hoverPopup.setPosition(map.getCoordinateFromPixel(e.pixel));
  }

  private getFeaturesUnderMouse(map: Map, pixel: any) {
    return map.getFeaturesAtPixel(pixel).filter((feature: Feature) => {
      const layer = this.HsMapService.getLayerForFeature(feature);
      return layer && layer != this.queryLayer;
    });
  }

  /**
   * @param feature
   */
  serializeFeatureAttributes(feature: Feature): void {
    feature.attributesForHover = [];
    const layer = this.HsMapService.getLayerForFeature(feature);
    if (layer === undefined) {
      return;
    }
    let attrsConfig = [];
    if (getPopUp(layer)?.attributes) {
      //must be an array
      attrsConfig = getPopUp(layer).attributes;
    } else {
      // Layer is not configured to show pop-ups
      return;
    }
    for (const attr of attrsConfig) {
      let attrName, attrLabel;
      let attrFunction = (x) => x;
      if (typeof attr === 'string' || attr instanceof String) {
        //simple case when only attribute name is provided in the layer config
        attrName = attr;
        attrLabel = attr;
      } else {
        if (attr.attribute == undefined) {
          //implies malformed layer config - 'attribute' is obligatory in this case
          continue;
        }
        attrName = attr.attribute;
        attrLabel = attr.label != undefined ? attr.label : attr.attribute;
        if (attr.displayFunction) {
          attrFunction = attr.displayFunction;
        }
      }
      if (feature.get(attrName)) {
        feature.attributesForHover.push({
          key: attrLabel,
          value: feature.get(attrName),
          displayFunction: attrFunction,
        });
      }
    }
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
   * @param coordinate
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

  /**
   * @param feature
   */
  pointClickedStyle(feature): Style {
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
      if (this.HsConfig.queryPoint == 'hidden') {
        defaultStyle.getImage().setRadius(0);
      } else if (this.HsConfig.queryPoint == 'notWithin') {
        if (this.selector.getFeatures().getLength() > 0) {
          defaultStyle.getImage().setRadius(0);
        }
      }
    }
    return defaultStyle;
  }
}
