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
import {Filter, Style as GeoStylerStyle, Rule} from 'geostyler-style';
import {StyleFunction} from 'ol/style';
import {createDefaultStyle} from 'ol/style/Style';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from '../layermanager/layer-descriptor.interface';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  getCluster,
  getSld,
  getTitle,
  setSld,
} from '../../common/layer-extensions';
import {getHighlighted} from '../../common/feature-extensions';
import {parseStyle} from './backwards-compatibility';

@Injectable({
  providedIn: 'root',
})
export class HsStylerService {
  layer: VectorLayer = null;
  onSet: Subject<VectorLayer> = new Subject();
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
    private HsLogService: HsLogService,
    public sanitizer: DomSanitizer,
    private HsMapService: HsMapService,
    private HsSaveMapService: HsSaveMapService
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
   * Style clustered layer features using cluster style or individual feature style.
   * @param layer - Any vector layer
   */
  async styleClusteredLayer(layer: VectorLayer): Promise<void> {
    await this.fill(layer);
    //Check if layer already has SLD style for clusters
    if (
      !this.styleObject.rules.find((r) => {
        try {
          /* 
          For clusters SLD styles created by Hslayers have 'AND' rule where the 
          first condition checks if 'features' attribute of a feature is set. 
          See addRule function 
          */
          return r.filter[1][1] == 'features';
        } catch (ex) {
          return false;
        }
      })
    ) {
      // Remember to clone singleFeatureFilter on usage so the filters
      // don't share the same reference
      const singleFeatureFilter: string | Filter = [
        '||',
        ['==', 'features', 'undefined'],
        ['==', 'features', '[object Object]'],
      ];
      for (const rule of this.styleObject.rules) {
        // Set filter so the original style is applied to features which are not clusters
        rule.filter =
          rule.filter?.length > 0
            ? ['&&', [...singleFeatureFilter], rule.filter]
            : [...singleFeatureFilter];
      }
      await this.addRule('Cluster');
    }
    let style = layer.getStyle();
    if (
      this.layer.getSource().getSource &&
      this.HsUtilsService.isFunction(style)
    ) {
      style = this.wrapStyleForClusters(style);
      layer.setStyle(style);
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
      style = (await this.parseStyle(sld)).style;
      if (style) {
        layer.setStyle(style);
      }
      if (getCluster(layer)) {
        await this.styleClusteredLayer(layer);
      }
    } else if (style && !sld && !this.HsUtilsService.isFunction(style)) {
      const customJson = this.HsSaveMapService.serializeStyle(style);
      const sld = (await this.parseStyle(customJson)).sld;
      if (sld) {
        setSld(layer, sld);
      }
    }
  }

  /**
   * Parse style encoded as custom JSON or SLD and return OL style object.
   * This function is used to support backwards compatibility with custom format.
   * @param style
   * @returns OL style object
   */
  async parseStyle(style: any): Promise<{sld?: string; style: Style}> {
    if (typeof style == 'string') {
      return {sld: style, style: await this.sldToOlStyle(style)};
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
  async fill(layer: VectorLayer): Promise<void> {
    try {
      if (!layer) {
        return;
      }
      this.layer = layer;
      this.layerTitle = getTitle(layer);
      const sld = getSld(layer);
      if (sld != undefined) {
        this.styleObject = await this.sldToJson(sld);
      } else {
        this.styleObject = {name: 'untitled style', rules: []};
      }
    } catch (ex) {
      this.HsLogService.error(ex.message);
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
      this.HsLogService.error(ex);
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

  async addRule(
    kind: 'Simple' | 'ByScale' | 'ByFilter' | 'ByFilterAndScale' | 'Cluster'
  ): Promise<void> {
    switch (kind) {
      case 'Cluster':
        this.styleObject.rules.push({
          name: 'Cluster rule',
          filter: [
            '&&',
            ['!=', 'features', 'undefined'],
            ['!=', 'features', '[object Object]'],
          ],
          symbolizers: [
            {
              kind: 'Mark',
              color: 'rgba(255, 255, 255, 0.41)',
              strokeColor: 'rgba(0, 153, 255, 1)',
              strokeWidth: 2,
              wellKnownName: 'circle',
              radius: 10,
            },
            {
              kind: 'Text',
              label: '{{features}}',
              haloColor: '#fff',
              color: '#000',
              offset: [0, 0],
            },
          ],
        });
        break;
      case 'Simple':
      default:
        this.styleObject.rules.push({
          name: 'Untitled rule',
          symbolizers: [],
        });
    }
    await this.save();
  }

  removeRule(rule: Rule): void {
    this.styleObject.rules.splice(this.styleObject.rules.indexOf(rule), 1);
    this.save();
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
      let style = await this.geoStylerStyleToOlStyle(this.styleObject);
      if (this.styleObject.rules.length == 0) {
        this.HsLogService.warn('Missing style rules for layer', this.layer);
        style = createDefaultStyle;
      }
      /* style is a function when text symbolizer is used. We need some hacking 
      for cluster layer in that case to have the correct number of features in 
      cluster display over the label */
      if (
        this.layer.getSource().getSource &&
        this.HsUtilsService.isFunction(style)
      ) {
        style = this.wrapStyleForClusters(style);
      }
      this.layer.setStyle(style);
      const sld = await this.jsonToSld(this.styleObject);
      setSld(this.layer, sld);
      this.onSet.next(this.layer);
    } catch (ex) {
      this.HsLogService.error(ex);
    }
  }

  /**
   * HACK is needed to style cluster layers. It wraps existing OL style function
   * in a function which searches for for Text styles and in them for serialized
   * feature arrays and instead sets the length of this array as the label.
   * If the geostyler text symbolizer had {{features}} as the text label template
   * (which returns the "features" attribute of the parent/cluster feature) and returned
   * '[object Object], [object Object]' the result would become "2".
   * See https://github.com/geostyler/geostyler-openlayers-parser/issues/227
   * @param style
   * @returns
   */
  wrapStyleForClusters(style: StyleFunction): StyleFunction {
    return (feature, resolution) => {
      const tmp: Style[] = style(feature, resolution);
      for (const evaluatedStyle of tmp) {
        if (
          evaluatedStyle.getText &&
          evaluatedStyle.getText()?.getText()?.includes('[object Object]')
        ) {
          const featureListSerialized = evaluatedStyle.getText().getText();
          const fCount = featureListSerialized.split(',').length.toString();
          evaluatedStyle.getText().setText(fCount);
        }
      }
      return tmp;
    };
  }
}
