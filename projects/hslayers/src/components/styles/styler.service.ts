import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import OpenLayersParser from 'geostyler-openlayers-parser';
import QGISStyleParser from 'geostyler-qgis-parser';
import SLDParser from 'geostyler-sld-parser';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import colormap from 'colormap';
import {Cluster} from 'ol/source';
import {
  FillSymbolizer,
  Filter,
  Style as GeoStylerStyle,
  Rule,
} from 'geostyler-style';
import {Geometry} from 'ol/geom';
import {Icon, Style} from 'ol/style';
import {StyleFunction, StyleLike} from 'ol/style/Style';
import {Subject} from 'rxjs';
import {createDefaultStyle} from 'ol/style/Style';
import {getUid} from 'ol';

import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerDescriptor} from '../layermanager/layer-descriptor.interface';
import {HsLayerSynchronizerService} from '../save-map/layer-synchronizer.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsUtilsService} from '../utils/utils.service';
import {defaultStyle} from './styles';
import {
  getCluster,
  getQml,
  getSld,
  getTitle,
  setSld,
} from '../../common/layer-extensions';
import {getHighlighted} from '../../common/feature-extensions';
import {parseStyle} from './backwards-compatibility';

class HsStylerParams {
  layer: VectorLayer<VectorSource<Geometry>> = null;
  layerBeingMonitored: boolean;
  onSet: Subject<VectorLayer<VectorSource<Geometry>>> = new Subject();
  layerTitle: string;
  styleObject: GeoStylerStyle;
  sldParser = (SLDParser as any).default
    ? new (SLDParser as any).default()
    : new SLDParser();
  qmlParser = (QGISStyleParser as any).default
    ? new (QGISStyleParser as any).default()
    : new QGISStyleParser();

  sld: string;
  isAuthorized: boolean;

  pin_white_blue;
  pin_white_blue_highlight;
  colorMapDialogVisible = false;
  unsavedChange = false;
  changesStore = new Map();
}

@Injectable({
  providedIn: 'root',
})
export class HsStylerService {
  apps: {
    [id: string]: HsStylerParams;
  } = {default: new HsStylerParams()};

  constructor(
    public hsQueryVectorService: HsQueryVectorService,
    public hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsEventBusService: HsEventBusService,
    private hsLogService: HsLogService,
    public sanitizer: DomSanitizer,
    private hsMapService: HsMapService,
    private hsSaveMapService: HsSaveMapService,
    private srvLanguage: HsLanguageService,
    private hsConfig: HsConfig,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsLayerSynchronizerService: HsLayerSynchronizerService
  ) {}

  get(app: string): HsStylerParams {
    if (this.apps[app ?? ''] == undefined) {
      this.apps[app ?? 'default'] = new HsStylerParams();
    }
    return this.apps[app ?? 'default'];
  }

  async init(app: string): Promise<void> {
    const appRef = this.get(app);
    const configRef = this.hsConfig.get(app);
    await this.hsMapService.loaded(app);
    appRef.pin_white_blue = new Style({
      image: new Icon({
        src: configRef.assetsPath + 'img/pin_white_blue32.png',
        crossOrigin: 'anonymous',
        anchor: [0.5, 1],
      }),
    });
    appRef.pin_white_blue_highlight = (
      feature: Feature<Geometry>,
      resolution
    ): Array<Style> => {
      return [
        new Style({
          image: new Icon({
            src:
              configRef.assetsPath + getHighlighted(feature)
                ? 'img/pin_white_red32.png'
                : 'img/pin_white_blue32.png',
            crossOrigin: 'anonymous',
            anchor: [0.5, 1],
          }),
        }),
      ];
    };
    for (const layer of this.hsMapService
      .getLayersArray(app)
      .filter((layer) => this.hsLayerUtilsService.isLayerVectorLayer(layer))) {
      this.initLayerStyle(layer as VectorLayer<VectorSource<Geometry>>, app);
    }
    this.hsEventBusService.layerAdditions.subscribe(
      (layerDescriptor: HsLayerDescriptor) => {
        if (
          this.hsLayerUtilsService.isLayerVectorLayer(layerDescriptor.layer)
        ) {
          this.initLayerStyle(
            layerDescriptor.layer as VectorLayer<VectorSource<Geometry>>,
            app
          );
        }
      }
    );

    this.hsCommonLaymanService.authChange.subscribe(({endpoint}) => {
      appRef.isAuthorized = endpoint?.authenticated;
    });
  }

  isVectorLayer(layer: any): boolean {
    if (this.hsUtilsService.instOf(layer, VectorLayer)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get a Source for any vector layer. Both clustered and un-clustered.
   * @param layer - Any vector layer
   * @param isClustered -
   * @returns Source of the input layer or source of its cluster's source
   */
  getLayerSource(
    layer: VectorLayer<VectorSource<Geometry>>,
    isClustered: boolean
  ): VectorSource<Geometry> {
    if (!layer) {
      return;
    }
    let src: VectorSource<Geometry>;
    if (isClustered) {
      src = (layer.getSource() as Cluster).getSource();
    } else {
      src = layer.getSource();
    }
    return src;
  }
  /**
   * Style clustered layer features using cluster style or individual feature style.
   * @param layer - Any vector layer
   */
  async styleClusteredLayer(
    layer: VectorLayer<VectorSource<Geometry>>,
    app: string
  ): Promise<void> {
    const appRef = this.get(app);
    await this.fill(layer, app);
    //Check if layer already has SLD style for clusters
    if (
      !appRef.styleObject.rules.find((r) => {
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
      for (const rule of appRef.styleObject.rules) {
        // Set filter so the original style is applied to features which are not clusters
        rule.filter =
          rule.filter?.length > 0
            ? ['&&', [...singleFeatureFilter], rule.filter]
            : [...singleFeatureFilter];
      }
      await this.addRule('Cluster', app);
    }
    let style = layer.getStyle();
    if (
      this.hsUtilsService.instOf(appRef.layer.getSource(), Cluster) &&
      this.hsUtilsService.isFunction(style)
    ) {
      style = this.wrapStyleForClusters(style as StyleFunction);
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
  async initLayerStyle(
    layer: VectorLayer<VectorSource<Geometry>>,
    app: string
  ): Promise<void> {
    if (!this.isVectorLayer(layer)) {
      return;
    }
    let sld = getSld(layer);
    const qml = getQml(layer);
    let style = layer.getStyle();
    if ((!style || style == createDefaultStyle) && !sld && !qml) {
      sld = defaultStyle;
      setSld(layer, defaultStyle);
    }
    if ((sld || qml) && (!style || style == createDefaultStyle)) {
      style = (await this.parseStyle(sld ?? qml, app)).style;
      if (style) {
        layer.setStyle(style);
      }
      if (getCluster(layer)) {
        await this.styleClusteredLayer(layer, app);
      }
    } else if (
      style &&
      !sld &&
      !qml &&
      !this.hsUtilsService.isFunction(style) &&
      !Array.isArray(style)
    ) {
      const customJson = this.hsSaveMapService.serializeStyle(
        style as Style,
        app
      );
      const sld = (await this.parseStyle(customJson, app)).sld;
      if (sld) {
        setSld(layer, sld);
      }
    }
    this.get(app).sld = sld;
  }

  /**
   * Parse style encoded as custom JSON or SLD and return OL style object.
   * This function is used to support backwards compatibility with custom format.
   * @param style -
   * @returns OL style object
   */
  async parseStyle(
    style: any,
    app: string
  ): Promise<{sld?: string; qml?: string; style: StyleLike}> {
    if (!style) {
      return {
        sld: defaultStyle,
        style: await this.sldToOlStyle(defaultStyle, app),
      };
    }
    if (
      typeof style == 'string' &&
      (style as string).includes('StyledLayerDescriptor')
    ) {
      return {sld: style, style: await this.sldToOlStyle(style, app)};
    }
    if (typeof style == 'string' && (style as string).includes('<qgis')) {
      return {qml: style, style: await this.qmlToOlStyle(style, app)};
    } else if (
      typeof style == 'object' &&
      !this.hsUtilsService.instOf(style, Style)
    ) {
      //Backwards compatibility with style encoded in custom JSON object
      return parseStyle(style);
    } else {
      return {style};
    }
  }

  /**
   * Prepare current layers style for editing by converting
   * SLD attribute string to JSON and reading layers title
   *
   * @param layer - OL layer
   */
  async fill(
    layer: VectorLayer<VectorSource<Geometry>>,
    app: string
  ): Promise<void> {
    const appRef = this.get(app);
    const blankStyleObj = {name: 'untitled style', rules: []};
    try {
      if (!layer) {
        return;
      }
      appRef.layer = layer;
      console.log('Layer uid', getUid(appRef.layer));
      appRef.layerBeingMonitored =
        !!this.hsLayerSynchronizerService.syncedLayers.find((l) => l == layer);
      appRef.unsavedChange = appRef.changesStore.has(getUid(layer));
      appRef.layerTitle = getTitle(layer);
      const sld = appRef.unsavedChange
        ? appRef.changesStore.get(getUid(layer))
        : getSld(layer);
      const qml = getQml(layer);
      if (sld != undefined) {
        appRef.styleObject = await this.sldToJson(sld, app);
      } else if (qml != undefined) {
        appRef.styleObject = await this.qmlToJson(qml, app);
      } else {
        appRef.styleObject = blankStyleObj;
      }
      this.geostylerWorkaround(app);
      if (appRef.unsavedChange) {
        //Update appRef.sld string in case styler for layer with unsaved changes was opened.
        //Could have been changed by styling other layer in the meantime
        this.save(app);
      }
    } catch (ex) {
      appRef.styleObject = blankStyleObj;
      this.hsLogService.error(ex.message);
    }
  }

  /**
   * Tweak geostyler object attributes to mitigate
   * some discrepancies between opacity and fillOpacity usage
   */
  geostylerWorkaround(app: string): void {
    const appRef = this.get(app);
    if (appRef.styleObject.rules) {
      for (const rule of appRef.styleObject.rules) {
        if (rule.symbolizers) {
          for (const symbol of rule.symbolizers.filter(
            (symb) => symb.kind == 'Fill'
          ) as FillSymbolizer[]) {
            symbol.opacity = symbol.fillOpacity;
          }
        }
      }
    }
  }

  /**
   * Convert SLD to OL style object
   */
  async sldToOlStyle(sld: string, app: string): Promise<StyleLike> {
    try {
      const sldObject = await this.sldToJson(sld, app);
      return await this.geoStylerStyleToOlStyle(sldObject);
    } catch (ex) {
      this.hsLogService.error(ex);
    }
  }

  /**
   * Convert QML to OL style object
   */
  async qmlToOlStyle(qml: string, app: string): Promise<StyleLike> {
    try {
      const styleObject = await this.qmlToJson(qml, app);
      return await this.geoStylerStyleToOlStyle(styleObject);
    } catch (ex) {
      this.hsLogService.error(ex);
    }
  }

  public async geoStylerStyleToOlStyle(
    sldObject: GeoStylerStyle
  ): Promise<StyleLike> {
    const olConverter = (OpenLayersParser as any).default
      ? new (OpenLayersParser as any).default()
      : new OpenLayersParser();
    const {output: style} = await olConverter.writeStyle(sldObject);
    return style;
  }

  /**
   * Convert SLD text to JSON which is easier to edit in Angular.
   * @param sld -
   * @returns
   */
  private async sldToJson(sld: string, app: string): Promise<GeoStylerStyle> {
    const {output: sldObject} = await this.get(app).sldParser.readStyle(sld);
    return sldObject;
  }

  /**
   * Convert QML text to JSON which is easier to edit in Angular.
   * @param qml -
   * @returns
   */
  private async qmlToJson(qml: string, app: string): Promise<GeoStylerStyle> {
    const result = await this.get(app).qmlParser.readStyle(qml);
    if (result.output) {
      return result.output;
    } else {
      this.hsLogService.error(result.errors);
    }
  }

  private async jsonToSld(
    styleObject: GeoStylerStyle,
    app: string
  ): Promise<string> {
    const {output: sld} = await this.get(app).sldParser.writeStyle(styleObject);
    return sld;
  }

  async addRule(
    kind:
      | 'Simple'
      | 'ByScale'
      | 'ByFilter'
      | 'ByFilterAndScale'
      | 'Cluster'
      | 'ColorMap',
    app: string,
    options?: {
      min?: number;
      max?: number;
      colorMapName?: string;
      attribute?: string;
    }
  ): Promise<void> {
    const appRef = this.get(app);
    switch (kind) {
      case 'ColorMap':
        const colors = colormap({
          colormap: options.colorMapName,
          nshades: 11,
          format: 'hex',
          alpha: 1,
        });
        const step = (options.max - options.min) / 10.0;
        appRef.styleObject.rules = colors.map((color) => {
          const ix = colors.indexOf(color);
          const from = options.min + ix * step;
          const till = options.min + (ix + 1) * step;
          return {
            name: `${from.toFixed(2)} - ${till.toFixed(2)} ${
              options.attribute
            }`,
            filter: [
              '&&',
              ['>=', options.attribute, from],
              ['<', options.attribute, till],
            ],
            symbolizers: [
              {
                kind: 'Mark',
                color: color,
                strokeOpacity: 0.41,
                strokeColor: 'white',
                strokeWidth: 0.3,
                wellKnownName: 'circle',
                radius: 5,
              },
              {
                kind: 'Fill',
                color: color,
                strokeOpacity: 0.2,
              },
            ],
          };
        });
        break;
      case 'Cluster':
        appRef.styleObject.rules.push({
          name: 'Cluster rule',
          filter: [
            '&&',
            ['!=', 'features', 'undefined'],
            ['!=', 'features', '[object Object]'],
          ],
          symbolizers: [
            {
              kind: 'Mark',
              color: '#FFFFFF',
              strokeOpacity: 0.41,
              strokeColor: '#0099ff',
              strokeWidth: 2,
              wellKnownName: 'circle',
              radius: 10,
            },
            {
              kind: 'Text',
              label: '{{features}}',
              size: 12,
              haloColor: '#fff',
              color: '#000',
              offset: [0, 0],
            },
          ],
        });
        break;
      case 'Simple':
      default:
        appRef.styleObject.rules.push({
          name: 'Untitled rule',
          symbolizers: [],
        });
    }
    await this.save(app);
  }

  async removeRule(rule: Rule, app: string): Promise<void> {
    const appRef = this.get(app);
    appRef.styleObject.rules.splice(appRef.styleObject.rules.indexOf(rule), 1);
    await this.save(app);
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

  /**
   * Checks whether SLD should be indicated or saved right away.
   * Indicate only when user is logged in Layman and layer is being monitored otherwise save
   */
  resolveSldChange(appRef: HsStylerParams, app: string) {
    if (appRef.isAuthorized && appRef.layerBeingMonitored) {
      appRef.changesStore.set(getUid(appRef.layer), appRef.sld);
      appRef.unsavedChange = true;
    } else {
      this.setSld(app);
    }
  }

  /**Set SLD parameter of layer*/
  setSld(app: string) {
    const appRef = this.get(app);
    setSld(appRef.layer, appRef.sld);
    appRef.changesStore.delete(getUid(appRef.layer));
    appRef.unsavedChange = false;
  }

  async save(app: string): Promise<void> {
    try {
      const appRef = this.get(app);
      let style: Style | Style[] | StyleFunction =
        await this.geoStylerStyleToOlStyle(appRef.styleObject);
      if (appRef.styleObject.rules.length == 0) {
        this.hsLogService.warn('Missing style rules for layer', appRef.layer);
        style = createDefaultStyle;
      }
      /* style is a function when text symbolizer is used. We need some hacking 
      for cluster layer in that case to have the correct number of features in 
      cluster display over the label */
      if (
        this.hsUtilsService.instOf(appRef.layer.getSource(), Cluster) &&
        this.hsUtilsService.isFunction(style)
      ) {
        style = this.wrapStyleForClusters(style as StyleFunction);
      }
      appRef.layer.setStyle(style);
      const sld = await this.jsonToSld(appRef.styleObject, app);
      appRef.sld = sld;
      this.resolveSldChange(appRef, app);
      appRef.onSet.next(appRef.layer);
    } catch (ex) {
      this.hsLogService.error(ex);
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
   * @param style -
   * @returns
   */
  wrapStyleForClusters(style: StyleFunction): StyleFunction {
    return (feature, resolution) => {
      const tmp = style(feature, resolution);
      if (!tmp) {
        return;
      }
      if (Array.isArray(tmp)) {
        for (const evaluatedStyle of tmp as Style[]) {
          if (
            evaluatedStyle.getText &&
            evaluatedStyle.getText()?.getText()?.includes('[object Object]')
          ) {
            const featureListSerialized = evaluatedStyle.getText().getText();
            const fCount = (featureListSerialized as string)
              .split(',')
              .length.toString();
            evaluatedStyle.getText().setText(fCount);
          }
        }
      }
      return tmp;
    };
  }

  async reset(app: string): Promise<void> {
    const appRef = this.get(app);
    setSld(appRef.layer, undefined);
    appRef.layer.setStyle(createDefaultStyle);
    await this.initLayerStyle(appRef.layer, app);
    await this.fill(appRef.layer, app);
    await this.save(app);
  }

  async loadSld(sld: string, app: string): Promise<void> {
    try {
      const appRef = this.get(app);
      await appRef.sldParser.readStyle(sld);
      setSld(appRef.layer, sld);
      await this.fill(appRef.layer, app);
      await this.save(app);
    } catch (err) {
      console.warn('SLD could not be parsed');
    }
  }
}
