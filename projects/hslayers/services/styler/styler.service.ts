import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import colormap from 'colormap';
import {Cluster, Vector as VectorSource} from 'ol/source';
import {
  ConstructorParams,
  SldStyleParser as SLDParser,
  SldVersion,
} from 'geostyler-sld-parser';
import {Feature, getUid} from 'ol';
import {
  Filter,
  Style as GeoStylerStyle,
  Rule,
  WellKnownName,
} from 'geostyler-style';
import {Geometry} from 'ol/geom';
import {Icon, Style} from 'ol/style';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {OlStyleParser as OpenLayersParser} from 'geostyler-openlayers-parser';
import {StyleFunction, StyleLike, createDefaultStyle} from 'ol/style/Style';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerSynchronizerService} from 'hslayers-ng/services/save-map';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsQueryVectorService} from 'hslayers-ng/services/query';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {
  awaitLayerSync,
  getLaymanFriendlyLayerName,
} from 'hslayers-ng/common/layman';
import {defaultStyle} from './default-style';
import {
  getCluster,
  getQml,
  getSld,
  getTitle,
  setQml,
  setSld,
} from 'hslayers-ng/common/extensions';
import {getHighlighted} from 'hslayers-ng/common/extensions';
import {parseStyle} from './backwards-compatibility';

@Injectable({
  providedIn: 'root',
})
export class HsStylerService {
  layer: VectorLayer<VectorSource> = null;
  layerBeingMonitored: boolean;
  onSet: Subject<VectorLayer<VectorSource>> = new Subject();
  layerTitle: string;
  styleObject: GeoStylerStyle;

  sld: string;
  qml: string;
  isAuthenticated: boolean;

  pin_white_blue;
  pin_white_blue_highlight;
  colorMapDialogVisible = false;
  unsavedChange = false;
  changesStore = new Map<string, {sld: string; qml: string}>();
  syncing = false;
  sldVersion: SldVersion = '1.0.0';

  //Cumbersome as we need to toggle it but needed to track parsing errors
  //in order to be able to sync layer style and sld prop
  sldParsingError = false;

  constructor(
    public hsQueryVectorService: HsQueryVectorService,
    public hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsEventBusService: HsEventBusService,
    private hsLogService: HsLogService,
    public sanitizer: DomSanitizer,
    private hsMapService: HsMapService,
    private hsSaveMapService: HsSaveMapService,
    private hsConfig: HsConfig,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsLayerSynchronizerService: HsLayerSynchronizerService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLanguageService: HsLanguageService,
    private hsToastService: HsToastService,
  ) {
    this.pin_white_blue = new Style({
      image: new Icon({
        src: this.hsConfig.assetsPath + 'img/pin_white_blue32.png',
        crossOrigin: 'anonymous',
        anchor: [0.5, 1],
      }),
    });
    this.pin_white_blue_highlight = (
      feature: Feature<Geometry>,
      resolution,
    ): Array<Style> => {
      return [
        new Style({
          image: new Icon({
            src:
              this.hsConfig.assetsPath + getHighlighted(feature)
                ? 'img/pin_white_red32.png'
                : 'img/pin_white_blue32.png',
            crossOrigin: 'anonymous',
            anchor: [0.5, 1],
          }),
        }),
      ];
    };

    this.hsCommonLaymanService.authChange.subscribe((endpoint) => {
      this.isAuthenticated = endpoint?.authenticated;
    });

    this.hsMapService.loaded().then((map) => {
      for (const layer of this.hsMapService
        .getLayersArray()
        .filter((layer) =>
          this.hsLayerUtilsService.isLayerVectorLayer(layer),
        )) {
        this.initLayerStyle(layer as VectorLayer<VectorSource>);
      }
      this.hsEventBusService.layerAdditions.subscribe((layerDescriptor) => {
        if (
          this.hsLayerUtilsService.isLayerVectorLayer(layerDescriptor.layer)
        ) {
          this.initLayerStyle(
            layerDescriptor.layer as VectorLayer<VectorSource>,
          );
        }
      });
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
    layer: VectorLayer<VectorSource>,
    isClustered: boolean,
  ): VectorSource {
    if (!layer) {
      return;
    }
    let src: VectorSource;
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
  async styleClusteredLayer(layer: VectorLayer<VectorSource>): Promise<void> {
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
          Array.isArray(rule.filter) && rule.filter.length > 0
            ? ['&&', [...singleFeatureFilter], rule.filter]
            : [...singleFeatureFilter];
      }
      await this.addRule('Cluster');
    }
    let style = layer.getStyle();
    if (
      this.hsUtilsService.instOf(layer.getSource(), Cluster) &&
      this.hsUtilsService.isFunction(style)
    ) {
      style = this.wrapStyleForClusters(style as StyleFunction);
      layer.setStyle(style);
    }
  }

  /**
   * Upload style created by createDefaultStyle method to layman thus syncing style of
   * vector layer added without SLD by rewriting its default value
   */
  private trySyncingStyleToLayman(layer: VectorLayer<VectorSource>) {
    if (this.hsLayerSynchronizerService.syncedLayers.includes(layer)) {
      awaitLayerSync(layer).then(() => {
        setSld(
          layer,
          getSld(layer).replace(
            '<NamedLayer>',
            '<NamedLayer>' + '<!-- This will be removed by parser -->',
          ),
        );
      });
    }
  }

  /**
   * Parse style from 'sld' attribute defined in SLD format and convert to OL
   * style which is set on the layer. Also do the opposite if no SLD is defined,
   * because SLD is used in the styler panel.
   *
   * @param layer - OL layer to fill the missing style info
   */
  async initLayerStyle(layer: VectorLayer<VectorSource>): Promise<void> {
    if (!this.isVectorLayer(layer)) {
      return;
    }
    let sld = getSld(layer);
    const qml = getQml(layer);
    const style = layer.getStyle();
    if ((!style || style == createDefaultStyle) && !sld && !qml) {
      sld = defaultStyle;
      setSld(layer, defaultStyle);
    }
    if ((sld || qml) && (!style || style == createDefaultStyle)) {
      const parsedStyle = await this.parseStyle(sld ?? qml);
      if (parsedStyle.sld !== sld) {
        sld = parsedStyle.sld;
        setSld(layer, sld);
        this.sldParsingError = false;
      }
      if (parsedStyle.style) {
        layer.setStyle(parsedStyle.style);
      }
      if (getCluster(layer)) {
        if (!this.hsUtilsService.instOf(layer.getSource(), Cluster)) {
          this.hsLogService.warn(
            `Layer ${getTitle(
              layer,
            )} is meant to be clustered but not an instance of Cluster source! Waiting for a change:source event...`,
          );
          await new Promise((resolve) => {
            layer.once('change:source', (evt) => resolve(evt.target));
          });
        }
        //await is necessary because of consecutive code (this.fill())
        await this.styleClusteredLayer(layer);
      }
      this.trySyncingStyleToLayman(layer);
    } else if (
      style &&
      !sld &&
      !qml &&
      !this.hsUtilsService.isFunction(style) &&
      !Array.isArray(style)
    ) {
      //Backwards compatibility with custom style JSON
      const customJson = this.hsSaveMapService.serializeStyle(style as Style);
      const sld = (await this.parseStyle(customJson)).sld;
      if (sld) {
        setSld(layer, sld);
      }
    }
    this.sld = sld;
    this.qml = qml;
  }

  /**
   * Parse style encoded as custom JSON or SLD and return OL style object.
   * This function is used to support backwards compatibility with custom format.
   * @param style -
   * @returns OL style object
   */
  async parseStyle(
    style: any,
  ): Promise<{sld?: string; qml?: string; style: StyleLike}> {
    if (!style) {
      return {
        sld: defaultStyle,
        style: createDefaultStyle,
      };
    }
    const styleType = this.guessStyleFormat(style);
    if (styleType == 'sld') {
      const olStyle = await this.sldToOlStyle(style);
      const sld = this.sldParsingError ? defaultStyle : style;
      return {sld: sld, style: olStyle};
    } else if (styleType == 'qml') {
      return {qml: style, style: await this.qmlToOlStyle(style)};
    } else if (
      typeof style == 'object' &&
      !this.hsUtilsService.instOf(style, Style)
    ) {
      const newLocal = await parseStyle(style);
      //Backwards compatibility with style encoded in custom JSON object
      return newLocal;
    } else {
      return {style};
    }
  }

  guessStyleFormat(style: any): 'qml' | 'sld' {
    if (typeof style == 'string') {
      if ((style as string).includes('StyledLayerDescriptor')) {
        return 'sld';
      } else if ((style as string).includes('<qgis')) {
        return 'qml';
      }
    }
  }

  /**
   * Prepare current layers style for editing by converting
   * SLD attribute string to JSON and reading layers title
   */
  async fill(layer: VectorLayer<VectorSource>): Promise<void> {
    const blankStyleObj = {name: 'untitled style', rules: []};
    try {
      if (!layer) {
        return;
      }
      this.layer = layer;
      this.layerBeingMonitored =
        !!this.hsLayerSynchronizerService.syncedLayers.find((l) => l == layer);
      this.unsavedChange = this.changesStore.has(getUid(layer));
      this.layerTitle = getTitle(layer);
      const {sld, qml} = this.unsavedChange
        ? this.changesStore.get(getUid(layer))
        : {sld: getSld(layer), qml: getQml(layer)};
      if (sld != undefined) {
        this.styleObject = await this.sldToJson(sld);
        this.sldVersion = this.guessSldVersion(sld);
      } else if (qml != undefined) {
        this.styleObject = await this.qmlToJson(qml);
        //Note: https://github.com/hslayers/hslayers-ng/issues/3431
      } else {
        this.styleObject = blankStyleObj;
      }
      this.fixSymbolizerBugs(this.styleObject);
      /**
       * Save (update OL style) layer style
       * unsavedChange - synced layman layer with changes
       * layerBeingMonitored - other vector layers
       */
      if (this.unsavedChange || !this.layerBeingMonitored) {
        //Update this.sld string in case styler for layer with unsaved changes was opened.
        //Could have been changed by styling other layer in the meantime
        this.save();
      }
    } catch (ex) {
      this.styleObject = blankStyleObj;
      this.hsLogService.error(ex.message);
    }
  }

  private fixSymbolizerBugs(styleObject: GeoStylerStyle) {
    if (styleObject.rules) {
      for (const rule of styleObject.rules) {
        if (rule?.symbolizers) {
          for (const symb of rule.symbolizers) {
            if (symb.kind == 'Mark' && symb.wellKnownName !== undefined) {
              symb.wellKnownName =
                symb.wellKnownName.toLowerCase() as WellKnownName;
            }
          }
        }
      }
    }
  }

  /**
   * Convert SLD to OL style object
   */
  async sldToOlStyle(sld: string): Promise<StyleLike> {
    try {
      const sldObject = await this.sldToJson(sld);
      this.fixSymbolizerBugs(sldObject);
      return await this.geoStylerStyleToOlStyle(sldObject);
    } catch (ex) {
      this.hsLogService.error(ex);
    }
  }

  /**
   * Convert QML to OL style object
   */
  async qmlToOlStyle(qml: string): Promise<StyleLike> {
    try {
      const styleObject = await this.qmlToJson(qml);
      this.fixSymbolizerBugs(styleObject);
      return await this.geoStylerStyleToOlStyle(styleObject);
    } catch (ex) {
      this.hsLogService.error(ex);
    }
  }

  public async geoStylerStyleToOlStyle(
    sldObject: GeoStylerStyle,
  ): Promise<StyleLike> {
    const olConverter = new OpenLayersParser();
    const {output: style} = await olConverter.writeStyle(sldObject);
    return style;
  }

  guessSldVersion(sld: string): SldVersion {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(sld, 'text/xml');
      if (
        xmlDoc.documentElement.attributes.getNamedItem('version')?.value ==
        '1.1.0'
      ) {
        return '1.1.0';
      }
      return '1.0.0';
    } catch (ex) {
      return '1.0.0';
    }
  }

  /**
   * Convert SLD text to JSON which is easier to edit in Angular.
   * @param sld -
   * @returns
   */
  async sldToJson(sld: string): Promise<GeoStylerStyle> {
    const options: ConstructorParams = {};
    options.sldVersion = this.guessSldVersion(sld);
    const sldParser = new SLDParser(options);
    const sldObject = await sldParser.readStyle(sld);
    if (!sldObject || sldObject.errors) {
      this.sldParsingError = true;
      const defaultSldObject = await sldParser.readStyle(defaultStyle);

      /**
       * NOTE: Not ideal as there is no information about which layer is affected
       */
      this.hsToastService.createToastPopupMessage(
        'STYLER.sldParsingError',
        'STYLER.sldParsingErrorMessage',
        {
          serviceCalledFrom: 'HsStylerService',
        },
      );
      return {...defaultSldObject.output, name: 'HSLayers default style'};
    }
    return sldObject.output;
  }

  /**
   * Convert QML text to JSON which is easier to edit in Angular.
   * @param qml -
   * @returns
   */
  async qmlToJson(qml: string): Promise<GeoStylerStyle> {
    const {QGISStyleParser} = await import('geostyler-qgis-parser');
    const qmlParser = new QGISStyleParser();

    const result = await qmlParser.readStyle(qml);
    if (result.output) {
      return result.output;
    } else {
      this.hsLogService.error(result.errors);
    }
  }

  private async jsonToSld(styleObject: GeoStylerStyle): Promise<string> {
    const sldParser = new SLDParser({sldVersion: this.sldVersion});
    const {output: sld} = await sldParser.writeStyle(styleObject);
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
    options?: {
      min?: number;
      max?: number;
      colorMapName?: string;
      attribute?: string;
    },
  ): Promise<void> {
    switch (kind) {
      case 'ColorMap':
        const colors = colormap({
          colormap: options.colorMapName,
          nshades: 11,
          format: 'hex',
          alpha: 1,
        });
        const step = (options.max - options.min) / 10.0;
        this.styleObject.rules = colors.map((color) => {
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
        this.styleObject.rules.push({
          name: 'Untitled rule',
          symbolizers: [],
        });
    }
    await this.save();
  }

  async removeRule(rule: Rule): Promise<void> {
    this.styleObject.rules.splice(this.styleObject.rules.indexOf(rule), 1);
    await this.save();
  }

  encodeTob64(str: string): string {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }),
    );
  }

  decodeToUnicode(str: string): string {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
  }

  /**
   * Checks whether SLD/QML should be indicated or saved right away.
   * Indicate only when user is logged in Layman and layer is being monitored otherwise save
   */
  resolveSldChange() {
    if (this.isAuthenticated && this.layerBeingMonitored) {
      this.changesStore.set(getUid(this.layer), {
        sld: this.sld,
        qml: this.qml,
      });
      this.unsavedChange = true;
    } else {
      this.setSldQml();
    }
  }

  /**Set SLD/QML parameter of layer*/
  setSldQml() {
    setSld(this.layer, this.sld);
    setQml(this.layer, this.qml);
    this.changesStore.delete(getUid(this.layer));
    this.syncing = true;

    awaitLayerSync(this.layer).then(() => {
      this.syncing = false;
      this.unsavedChange = false;
    });
  }

  async save(): Promise<void> {
    try {
      let style: Style | Style[] | StyleFunction =
        await this.geoStylerStyleToOlStyle(this.styleObject);
      if (this.styleObject.rules.length == 0) {
        this.hsLogService.warn('Missing style rules for layer', this.layer);
        style = createDefaultStyle;
      }
      /* style is a function when text symbolizer is used. We need some hacking 
      for cluster layer in that case to have the correct number of features in 
      cluster display over the label */
      if (
        this.hsUtilsService.instOf(this.layer.getSource(), Cluster) &&
        this.hsUtilsService.isFunction(style)
      ) {
        style = this.wrapStyleForClusters(style as StyleFunction);
      }
      this.layer.setStyle(style);
      const sld = await this.jsonToSld(this.styleObject);
      this.sld = sld;
      this.resolveSldChange();
      this.onSet.next(this.layer);
    } catch (ex) {
      this.hsLogService.error(ex);
    }
  }

  /**
   * HACK is needed to style cluster layers. It wraps existing OL style function
   * in a function which searches for Text styles and in them for serialized
   * feature arrays and instead sets the length of this array as the label.
   * If the geostyler text symbolizer had \{\{features\}\} as the text label template
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

  async reset(): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: 'STYLER.reallyResetStyleToDefault',
        title: 'COMMON.confirmReset',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.sld = defaultStyle;
      const style = (await this.parseStyle(defaultStyle)).style;
      if (style) {
        this.layer.setStyle(style);
      }
      this.resolveSldChange();
      this.fill(this.layer);
    }
  }

  /**
   * Load style in SLD/QML and set it to current layer
   */
  async loadStyle(styleString: string): Promise<void> {
    try {
      this.changesStore.delete(getUid(this.layer));
      const styleFmt = this.guessStyleFormat(styleString);
      if (styleFmt == 'sld') {
        const sldParser = new SLDParser({
          sldVersion: this.guessSldVersion(styleString),
        });
        await sldParser.readStyle(styleString);
        this.sld = styleString;
      } else if (styleFmt == 'qml') {
        const {QGISStyleParser} = await import('geostyler-qgis-parser');
        const qmlParser = new QGISStyleParser();

        await qmlParser.readStyle(styleString);
        this.qml = styleString;
      }
      this.resolveSldChange();
      this.fill(this.layer);
    } catch (err) {
      this.hsLogService.warn('SLD could not be parsed', err);
    }
  }

  /**
   * Calculate a stop-color value for gradient. Offset depend on number of colors (length)
   * and current index.
   * @param color - RGB(A) color definition
   * @param linearGradient - SVG Linear Gradient element
   * @param length - Offset calculation - length of an array (number of colors)
   * @param index - Index of color
   */
  private appendColorToGradient(
    color: number[],
    linearGradient: SVGLinearGradientElement,
    length: number,
    index: number,
  ): void {
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    const step = 100 / length;
    const offset = index * step;
    stop.setAttribute('offset', `${100 - offset}%`);
    const rgb = `rgb(${color[0]},${color[1]},${color[2]})`;
    stop.setAttribute('stop-color', rgb);

    linearGradient.appendChild(stop);
  }

  /**
   * Generate SVG gradient for selected color map. Used by either
   * - interpolated layer legend or
   * - color map select options
   */
  generateSVGGradientForColorMap(input: Layer<any> | number[][]) {
    const forLayer = input instanceof Layer;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', forLayer ? '75%' : '100%');
    svg.setAttribute('height', '100%');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const linearGradient = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'linearGradient',
    );

    const differentiator = Math.floor(Math.random() * 1000000000);
    const id = `idwGradient-${differentiator}${
      forLayer ? '-' + getLaymanFriendlyLayerName(input.get('name')) : ''
    }`;

    linearGradient.setAttribute('id', id);
    linearGradient.setAttribute(
      'gradientTransform',
      `rotate(${input instanceof Layer ? 90 : 0})`,
    );

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', forLayer ? '50%' : '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', `url('#${id}')`);

    //Gradient def generation
    if (input instanceof Layer) {
      const source = input.getSource();
      const arr = Array.from(Array(100).keys());
      for (const i of arr.filter((e, idx) => idx % 5 === 4).reverse()) {
        const color = source.getColor(i);
        this.appendColorToGradient(color, linearGradient, 100, i);
      }
    } else {
      for (const [i, color] of input.entries()) {
        this.appendColorToGradient(
          color,
          linearGradient,
          input.length + 1,
          input.length - i,
        );
      }
    }

    defs.appendChild(linearGradient);

    //Layout finishes. No need for labels for select option
    svg.appendChild(defs);
    svg.appendChild(rect);
    if (input instanceof Layer) {
      const max = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
      max.setAttribute('x', '50%');
      max.setAttribute('y', '10%');
      max.innerHTML = 'High';

      const min = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
      min.setAttribute('x', '50%');
      min.setAttribute('y', '95%');
      min.innerHTML = 'Low';

      svg.appendChild(max);
      svg.appendChild(min);
      svg.setAttribute('style', 'max-width: 7em');
    }

    return this.sanitizer.bypassSecurityTrustHtml(svg.outerHTML);
  }
}
