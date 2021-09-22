import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

import CircleStyle from 'ol/style/Circle';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Image as ImageStyle, Stroke, Style} from 'ol/style';
import {Cluster, Source, ImageStatic as Static, XYZ} from 'ol/source';
import {Geometry} from 'ol/geom';
import {Image as ImageLayer, Layer, Vector as VectorLayer} from 'ol/layer';

import {HsLayerSelectorService} from '../layermanager/layer-selector.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLegendDescriptor} from './legend-descriptor.interface';
import {HsUtilsService} from '../utils/utils.service';
import {
  getAutoLegend,
  getBase,
  getEnableProxy,
  getLegends,
  getShowInLayerManager,
  getTitle,
} from '../../common/layer-extensions';

//Following type-defs are missing in the OL export
declare type StyleFunction = (
  feature: Feature<any> | RenderFeature,
  number?: number
) => void | Style | Style[];
declare type StyleLike = Style | Array<Style> | StyleFunction;

@Injectable({
  providedIn: 'root',
})
export class HsLegendService {
  constructor(
    public hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService,
    public hsLayerSelectorService: HsLayerSelectorService,
    private sanitizer: DomSanitizer
  ) {
    this.hsLayerSelectorService.layerSelected.subscribe((layer) => {
      this.getLayerLegendDescriptor(layer.layer);
    });
  }

  /**
   * Test if layer is visible and has supported type (conditions for displaying legend)
   * @param layer - Layer to test
   * @returns Return if legend might exist for layer and layer is visible
   */
  legendValid(layer: HsLegendDescriptor): boolean {
    if (layer === undefined || layer.type == undefined) {
      return false;
    }
    if (
      ['vector', 'wms', 'static'].indexOf(layer.type) > -1 &&
      layer.lyr.getVisible()
    ) {
      return true;
    }
    return false;
  }

  /**
   * Get vector layer feature geometries
   * @param currentLayer - Layer of interest
   * @returns Array of simplified lowercase names of geometry types encountered in layer
   */
  getVectorFeatureGeometry(
    currentLayer: VectorLayer<VectorSource<Geometry> | Cluster>
  ): Array<string> {
    if (currentLayer === undefined || !currentLayer.getSource().getFeatures) {
      return;
    }
    const found = this.findFeatureGeomTypes(
      currentLayer.getSource().getFeatures()
    );
    if (this.hsLayerUtilsService.isLayerClustered(currentLayer)) {
      //Clustered layer?
      const subFeatureTypes = this.findFeatureGeomTypes(
        (currentLayer.getSource() as Cluster).getSource().getFeatures()
      );
      for (const type of Object.keys(subFeatureTypes)) {
        found[type] = subFeatureTypes[type] || found[type];
      }
    }

    const tmp = Object.keys(found).filter((key) => found[key]);
    return tmp;
  }

  findFeatureGeomTypes(features: Array<Feature<Geometry>>): {
    line: boolean;
    polygon: boolean;
    point: boolean;
  } {
    const found = {
      line: false,
      point: false,
      polygon: false,
    };
    for (const feature of features) {
      if (feature.getGeometry()) {
        const type = feature.getGeometry().getType();
        switch (type) {
          case 'LineString' || 'MultiLineString':
            found.line = true;
            break;
          case 'Polygon' || 'MultiPolygon':
            found.polygon = true;
            break;
          case 'Point' || 'MultiPoint':
            found.point = true;
            break;
          default:
        }
      }
    }
    return found;
  }

  /**
   * Get vector layer styles for first 100 features
   * @param currentLayer - Layer of interest
   * @returns Array of serialized unique style descriptions encountered when looping through first 100 features
   */
  getStyleVectorLayer(
    currentLayer: VectorLayer<VectorSource<Geometry>>
  ): Array<any> {
    if (currentLayer === undefined) {
      return;
    }
    let styleArray: Array<Style | Style[]> = [];
    if (!currentLayer.getStyle) {
      return;
    }
    const layerStyle = currentLayer.getStyle();
    if (!this.hsUtilsService.isFunction(layerStyle)) {
      styleArray.push(layerStyle as Style | Style[]);
    } else {
      if (currentLayer.getSource()?.getFeatures()?.length > 0) {
        styleArray = styleArray.concat(
          this.stylesForFeatures(
            currentLayer.getSource().getFeatures(),
            layerStyle as StyleFunction
          )
        );
        if (this.hsLayerUtilsService.isLayerClustered(currentLayer)) {
          //Clustered layer?
          styleArray = styleArray.concat(
            this.stylesForFeatures(
              (currentLayer.getSource() as Cluster).getSource().getFeatures(),
              layerStyle as StyleFunction
            )
          );
        }
      }
    }
    const filtered = styleArray.filter(
      (style) =>
        (style as Style).getText === undefined || !(style as Style).getText()
    );
    let serializedStyles = filtered
      .map((style) => this.serializeStyle(style))
      .filter((style) => style); //We don't want undefined values here, it breaks removeDuplicates
    serializedStyles = this.hsUtilsService.removeDuplicates(
      serializedStyles,
      'hashcode'
    );
    return serializedStyles;
  }

  stylesForFeatures(
    features: Array<Feature<Geometry>>,
    layerStyle: StyleFunction
  ): Style[] {
    let featureStyles = features.map((feature) => layerStyle(feature));
    if (featureStyles.length > 1000) {
      featureStyles = featureStyles.slice(0, 100);
    }
    if (Array.isArray(featureStyles[0])) {
      featureStyles = [...featureStyles];
    }
    return featureStyles as Style[];
  }

  /**
   * Serialize styles
   * @param style - OpenLayers style
   * @returns Simplified description of style used by template to draw legend
   */
  serializeStyle(style: Style | Style[]): any {
    let ch: any = {};
    if (Array.isArray(style)) {
      for (const s of style) {
        const tempCh = this.getStyleChildren(s, ch);
        ch = tempCh;
      }
    } else {
      ch = this.getStyleChildren(style, ch);
    }

    const genStyle = this.setUpLegendStyle(ch.fill, ch.stroke, ch.image);
    return genStyle;
  }

  getStyleChildren(style: Style, ch: any): any {
    const newChildren: any = {};
    style.getImage && style.getImage()
      ? (newChildren.image = style.getImage())
      : (newChildren.image = ch.image);
    style.getFill && style.getFill()
      ? (newChildren.fill = style.getFill())
      : (newChildren.fill = ch.fill);
    style.getStroke && style.getStroke()
      ? (newChildren.stroke = style.getStroke())
      : (newChildren.stroke = ch.stroke);
    return newChildren;
  }

  /**
   * Create object of parameters used for creation of svg content for legend using retrieved styles
   * @param fill - Fill description
   * @param stroke - Stroke description
   * @param image - Image description
   * @returns Simplified description of style used by template to draw legend
   */
  setUpLegendStyle(fill: Fill, stroke: Stroke, image: ImageStyle): any {
    const row: any = {};
    row.style = {maxWidth: '35px', maxHeight: '35px', marginBottom: '10px'};
    if (image && this.hsUtilsService.instOf(image, Icon)) {
      const icon = image as Icon;
      row.icon = {
        type: 'icon',
        src: this.sanitizer.bypassSecurityTrustResourceUrl(icon.getSrc()),
      };
    } else if (
      image &&
      (this.hsUtilsService.instOf(image, Circle) ||
        this.hsUtilsService.instOf(image, CircleStyle))
    ) {
      const circle = image as Circle | CircleStyle;
      row.customCircle = {
        fill: 'white',
        type: 'circle',
        cx: '17.5px',
        cy: '17.5px',
        r: '15px',
      };
      if (circle.getStroke()) {
        Object.assign(row.customCircle, {
          fill: circle.getFill().getColor(),
          stroke: circle.getStroke().getColor(),
          strokeWidth: circle.getStroke().getWidth(),
        });
      }
      if (circle.getFill()) {
        Object.assign(row.customCircle, {
          fill: circle.getFill().getColor(),
        });
      }
    }
    if (!stroke && !fill) {
      row.defaultLine = {type: 'line', stroke: 'blue', strokeWidth: '1'};
      row.defaultPolygon = {
        type: 'polygon',
        fill: 'blue',
        stroke: 'purple',
        strokeWidth: '1',
      };
    } else if (stroke && fill) {
      row.fullPolygon = {
        type: 'polygon',
        stroke: stroke.getColor(),
        strokeWidth: stroke.getWidth() / 2,
        fill: fill.getColor(),
      };
      row.line = {
        type: 'line',
        stroke: stroke.getColor(),
        strokeWidth: stroke.getWidth() / 2,
      };
    } else {
      if (fill) {
        row.polygon = {type: 'polygon', fill: fill.getColor()};
        row.defaultLine = {type: 'line', stroke: 'blue', strokeWidth: '1'};
      } else {
        row.line = {
          type: 'line',
          stroke: stroke.getColor(),
          strokeWidth: stroke.getWidth() / 2,
        };
        row.defaultPolygon = {
          type: 'polygon',
          fill: 'blue',
          stroke: 'purple',
          strokeWidth: '1',
        };
      }
    }
    row.hashcode = this.hsUtilsService.hashCode(JSON.stringify(row));
    return row;
  }

  /**
   * Generate url for GetLegendGraphic request of WMS service for selected layer
   * @param source - Source of wms layer
   * @param layer_name - Name of layer for which legend is requested
   * @param layer - Layer to get legend for
   * @returns Url of the legend graphics
   */
  getLegendUrl(
    source: Source,
    layer_name: string,
    layer: Layer<Source>
  ): string {
    if (!this.hsLayerUtilsService.isLayerWMS(layer)) {
      return '';
    }
    const params = this.hsLayerUtilsService.getLayerParams(layer);
    const version = params.VERSION || '1.3.0';
    let source_url = this.hsLayerUtilsService.getURL(layer);
    if (source_url.indexOf('proxy4ows') > -1) {
      const params = this.hsUtilsService.getParamsFromUrl(source_url);
      source_url = params.OWSURL;
    }
    const legendImage = getLegends(layer);
    if (legendImage !== undefined) {
      if (typeof legendImage == 'string') {
        return legendImage;
      }
      if (Array.isArray(legendImage)) {
        return legendImage[0];
      }
    }
    source_url +=
      (source_url.indexOf('?') > 0 ? '' : '?') +
      '&version=' +
      version +
      '&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=' +
      layer_name +
      '&format=image%2Fpng';
    if (getEnableProxy(layer) === undefined || getEnableProxy(layer) == true) {
      source_url = this.hsUtilsService.proxify(source_url, false);
    }
    return source_url;
  }

  /**
   * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
   * @param layer - OpenLayers layer
   * @returns Description of layer to be used for creating the legend. It contains type of layer, sublayer legends, title, visibility etc.
   */
  getLayerLegendDescriptor(
    layer: Layer<Source>
  ): HsLegendDescriptor | undefined {
    if (getBase(layer)) {
      return;
    }
    if (this.hsLayerUtilsService.isLayerWMS(layer)) {
      const subLayerLegends = this.hsLayerUtilsService
        .getLayerParams(layer)
        .LAYERS.split(',');
      for (let i = 0; i < subLayerLegends.length; i++) {
        subLayerLegends[i] = this.getLegendUrl(
          layer.getSource(),
          subLayerLegends[i],
          layer
        );
      }
      return {
        title: getTitle(layer),
        lyr: layer,
        type: 'wms',
        subLayerLegends: subLayerLegends,
        visible: layer.getVisible(),
      };
    } else if (
      this.hsUtilsService.instOf(layer, VectorLayer) &&
      (getShowInLayerManager(layer) === undefined ||
        getShowInLayerManager(layer) == true)
    ) {
      return {
        autoLegend: getAutoLegend(layer) ?? true,
        title: getTitle(layer),
        lyr: layer,
        type: 'vector',
        visible: layer.getVisible(),
      };
    } else if (
      this.hsUtilsService.instOf(layer, ImageLayer) &&
      this.hsUtilsService.instOf(layer.getSource(), Static)
    ) {
      return {
        title: getTitle(layer),
        lyr: layer,
        type: 'static',
        visible: layer.getVisible(),
      };
    } else if (this.hsUtilsService.instOf(layer.getSource(), XYZ)) {
      return {
        title: getTitle(layer),
        lyr: layer,
        type: 'static',
        visible: layer.getVisible(),
      };
    } else {
      return undefined;
    }
  }
}
