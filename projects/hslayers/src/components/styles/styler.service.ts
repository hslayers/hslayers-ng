import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import BaseLayer from 'ol/layer/Base';
import Feature from 'ol/Feature';
import OpenLayersParser from 'geostyler-openlayers-parser';
import SLDParser from 'geostyler-sld-parser';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {Style as GeoStylerStyle} from 'geostyler-style';
import {createDefaultStyle} from 'ol/style/Style';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from '../layermanager/layer-descriptor.interface';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsUtilsService} from '../utils/utils.service';
import {getFeatures, getHighlighted} from '../../common/feature-extensions';
import {
  getHsOriginalStyle,
  getSld,
  getTitle,
  setSld,
} from '../../common/layer-extensions';
import {parseStyle} from './backwards-compatibility';

@Injectable({
  providedIn: 'root',
})
export class HsStylerService {
  layer: VectorLayer = null;
  newLayerStyleSet: Subject<VectorLayer> = new Subject();
  newFeatureStyleSet: Subject<VectorLayer> = new Subject();
  measure_style = new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2,
    }),
    image: new Circle({
      radius: 7,
      fill: new Fill({
        color: '#ffcc33',
      }),
    }),
  });

  simple_style = new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 1,
    }),
    image: new Circle({
      radius: 7,
      fill: new Fill({
        color: '#ffcc33',
      }),
    }),
  });

  pin_white_blue = new Style({
    image: new Icon({
      src: this.HsUtilsService.getAssetsPath() + 'img/pin_white_blue32.png',
      crossOrigin: 'anonymous',
      anchor: [0.5, 1],
    }),
  });
  clusterStyle = new Style({
    stroke: new Stroke({
      color: '#fff',
    }),
    fill: new Fill({
      color: '#3399CC',
    }),
  });
  layerTitle: string;
  styleObject: GeoStylerStyle;
  parser = new SLDParser();

  constructor(
    public HsQueryVectorService: HsQueryVectorService,
    public HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    private HsMapService: HsMapService
  ) {
    this.HsMapService.loaded().then(() => this.init());
  }

  async init() {
    for (const layer of this.HsMapService.getLayersArray()) {
      this.initLayerStyle(layer);
    }
    this.HsEventBusService.layerAdditions.subscribe(
      (layerDescriptor: HsLayerDescriptor) => {
        this.initLayerStyle(layerDescriptor.layer);
      }
    );
  }

  pin_white_blue_highlight = (feature: Feature, resolution): Array<Style> => {
    return [
      new Style({
        image: new Icon({
          src: getHighlighted(feature)
            ? this.HsUtilsService.getAssetsPath() + 'img/pin_white_red32.png'
            : this.HsUtilsService.getAssetsPath() + 'img/pin_white_blue32.png',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
    ];
  };

  isVectorLayer(layer: any): boolean {
    if (this.HsUtilsService.instOf(layer, VectorLayer)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @description Get a Source for any vector layer. Both clustered and un-clustered.
   * @param isClustered
   * @param {VectorLayer} layer Any vector layer
   * @returns {VectorSource} Source of the input layer or source of its cluster's source
   */
  getLayerSource(layer: VectorLayer, isClustered: boolean): VectorSource {
    if (!layer) {
      return;
    }
    let src = [];
    if (isClustered) {
      src = layer.getSource().getSource();
    } else {
      src = layer.getSource();
    }
    return src;
  }
  /**
   * @description Style clustered layer features using cluster style or induvidual feature style.
   * @param {VectorLayer} layer Any vector layer
   */
  styleClusteredLayer(layer: VectorLayer): void {
    const styleCache = {};
    layer.setStyle((feature: Feature, resolution: number) => {
      const size = getFeatures(feature)?.length || 0;
      if (size > 1) {
        return this.makeClusterMarker(styleCache, size);
      } else {
        return this.makeSingleFeatureClusterMarker(feature, resolution, layer);
      }
    });
  }
  /**
   * @description Create marker for single feature.
   * @param {VectorLayer} layer Any vector layer
   * @param {number} resolution Displayed feature resolution
   * @param {Feature} feature Any vector layer feature
   */
  private makeSingleFeatureClusterMarker(
    feature: Feature,
    resolution: number,
    layer: VectorLayer
  ) {
    const featureStyle = getFeatures(feature)
      ? getFeatures(feature)[0].getStyle()
      : feature.getStyle();

    const originalStyle = featureStyle
      ? featureStyle
      : getHsOriginalStyle(layer)
      ? getHsOriginalStyle(layer)
      : createDefaultStyle;

    let appliedStyle = this.applyStyleIfNeeded(
      originalStyle,
      feature,
      resolution
    );
    if (this.isSelectedFeature(feature)) {
      if (Array.isArray(appliedStyle)) {
        appliedStyle = appliedStyle[0];
      }
      appliedStyle = appliedStyle.clone();
      appliedStyle.setFill(
        new Fill({
          color: [255, 255, 255, 0.5],
        })
      );
      appliedStyle.setStroke(
        new Stroke({
          color: [0, 153, 255, 1],
          width: 3,
        })
      );
    }
    return this.useStyleOnFirstFeature(appliedStyle, feature);
  }

  private isSelectedFeature(feature: Feature): boolean {
    if (getFeatures(feature)) {
      return this.isSelectedFeature(getFeatures(feature)[0]);
    }
    return (
      this.HsQueryVectorService.selector
        .getFeatures()
        .getArray()
        .indexOf(feature) > -1
    );
  }

  private makeClusterMarker(styleCache: any, size: any) {
    let textStyle = styleCache[size];
    if (!textStyle) {
      textStyle = new Style({
        image: new Circle({
          radius: 10,
          stroke: this.clusterStyle.getStroke(),
          fill: this.clusterStyle.getFill(),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#000',
          }),
        }),
      });
      styleCache[size] = textStyle;
    }
    return textStyle;
  }

  private applyStyleIfNeeded(
    style: any,
    feature: Feature,
    resolution: number
  ): any {
    if (typeof style == 'function') {
      return style(feature, resolution);
    } else {
      return style;
    }
  }

  private useStyleOnFirstFeature(
    style: any,
    clusteredContainerFeature: Feature
  ): Style | Style[] {
    const originalFeature = getFeatures(clusteredContainerFeature) || [
      clusteredContainerFeature,
    ];
    let newStyle;
    if (style.length) {
      newStyle = style[0].clone();
      newStyle.setGeometry(originalFeature[0].getGeometry());
      return [newStyle];
    } else {
      newStyle = style.clone();
      newStyle.setGeometry(originalFeature[0].getGeometry());
      return newStyle;
    }
  }

  /**
   * Parse style from 'sld' attribute defined in SLD format and convert to OL
   * style which is set on the layer. Also do the opposite if no SLD is defined,
   * because SLD is used in the styler panel.
   *
   * @param layer - OL layer to fill the missing style info
   */
  async initLayerStyle(layer: BaseLayer): Promise<void> {
    if (!this.isVectorLayer(layer)) {
      return;
    }
    const sld = getSld(layer);
    let style = layer.getStyle();
    if (sld && (!style || style == createDefaultStyle)) {
      style = await this.parseStyle(sld);
      if (style) {
        layer.setStyle(style);
      }
    } else if (style && !sld) {
      //TODO
    }
  }

  /**
   * Parse style encoded as custom JSON or SLD and return OL style object.
   * This function is used to support backwards compatibility with custom format.
   * @param style
   * @returns OL style object
   */
  async parseStyle(style: any): Promise<Style> {
    if (typeof style == 'string') {
      return await this.sldToOlStyle(style);
    } else if (typeof style == 'object') {
      //Backwards compatibility with style encoded in custom JSON object
      return parseStyle(style);
    }
  }

  /**
   * Prepare current layers style for editing by converting
   * SLD attribute string to JSON and reading layers title
   *
   * @param layer - OL layer
   */
  async fill(layer: BaseLayer): Promise<void> {
    try {
      if (!layer) {
        return;
      }
      this.layerTitle = getTitle(layer);
      const sld = getSld(layer);
      if (sld != undefined) {
        this.styleObject = await this.sldToJson(sld);
      } else {
        this.styleObject = {name: 'untitled style', rules: []};
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  /**
   * Convert SLD to OL style object
   */
  async sldToOlStyle(sld: string): Promise<Style> {
    try {
      const sldObject = await this.sldToJson(sld);
      return await this.geoStylerStyleToOlStyle(sldObject);
    } catch (ex) {
      console.error(ex);
    }
  }

  public async geoStylerStyleToOlStyle(
    sldObject: GeoStylerStyle
  ): Promise<Style> {
    const olConverter = new OpenLayersParser();
    const style = await olConverter.writeStyle(sldObject);
    return style;
  }

  /**
   * Convert SLD text to JSON which is easier to edit in Angular.
   * @param sld
   * @returns
   */
  private async sldToJson(sld: string): Promise<GeoStylerStyle> {
    const sldObject = await this.parser.readStyle(sld);
    return sldObject;
  }

  private async jsonToSld(styleObject: GeoStylerStyle): Promise<string> {
    const sld = await this.parser.writeStyle(styleObject);
    return sld;
  }

  addRule(kind: 'Simple' | 'ByScale' | 'ByFilter' | 'ByFilterAndScale'): void {
    switch (kind) {
      case 'Simple':
      default:
        this.styleObject.rules.push({name: 'Untitled rule', symbolizers: []});
    }
  }

  encodeTob64(str: string): string {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }

  decodeToUnicode(str: string): string {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  }

  async save(): Promise<void> {
    try {
      const style = await this.geoStylerStyleToOlStyle(this.styleObject);
      this.layer.setStyle(style);
      const sld = await this.jsonToSld(this.styleObject);
      setSld(this.layer, sld);
    } catch (ex) {
      console.error(ex);
    }
  }

  /**
   * Force repainting of clusters by reapplying cluster style which
   * was created in cluster method
   *
   * @param layer - Vector layer
   */
  repaintCluster(layer: VectorLayer): void {
    layer.setStyle(layer.getStyle());
  }
}
