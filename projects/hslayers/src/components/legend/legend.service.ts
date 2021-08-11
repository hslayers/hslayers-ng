import CircleStyle from 'ol/style/Circle';
import Feature from 'ol/Feature';
import StyleFunction from 'ol/style/Style';
import {Circle, Fill, Icon, Image as ImageStyle, Stroke, Style} from 'ol/style';
import {
  Cluster,
  ImageWMS,
  Source,
  ImageStatic as Static,
  TileWMS,
  XYZ,
} from 'ol/source';
import {DomSanitizer} from '@angular/platform-browser';
import {Image as ImageLayer, Layer, Vector as VectorLayer} from 'ol/layer';
import {Injectable} from '@angular/core';

import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';
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

@Injectable({
  providedIn: 'root',
})
export class HsLegendService {
  constructor(
    public HsUtilsService: HsUtilsService,
    private HsLayerUtilsService: HsLayerUtilsService,
    public HsLayerSelectorService: HsLayerSelectorService,
    private sanitizer: DomSanitizer
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe((layer) => {
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
    if (currentLayer === undefined) {
      return;
    }
    const found = this.findFeatureGeomTypes(
      currentLayer.getSource().getFeatures()
    );
    if (this.HsLayerUtilsService.isLayerClustered(currentLayer)) {
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
    let styleArray = [];
    const layerStyle = currentLayer.getStyle();
    if (!this.HsUtilsService.isFunction(layerStyle)) {
      styleArray.push(layerStyle);
    } else {
      if (currentLayer.getSource().getFeatures().length > 0) {
        styleArray = styleArray.concat(
          this.stylesForFeatures(
            currentLayer.getSource().getFeatures(),
            layerStyle
          )
        );
        if (this.HsLayerUtilsService.isLayerClustered(currentLayer)) {
          //Clustered layer?
          styleArray = styleArray.concat(
            this.stylesForFeatures(
              (currentLayer.getSource() as Cluster).getSource().getFeatures(),
              layerStyle
            )
          );
        }
      }
    }
    const filtered = styleArray.filter(
      (style) => style.getText == undefined || !style.getText()
    );
    let serializedStyles = filtered
      .map((style) => this.serializeStyle(style))
      .filter((style) => style); //We don't want undefined values here, it breaks removeDuplicates
    serializedStyles = this.HsUtilsService.removeDuplicates(
      serializedStyles,
      'hashcode'
    );
    return serializedStyles;
  }

  stylesForFeatures(
    features: Array<Feature<Geometry>>,
    layerStyle: StyleFunction
  ): Array<Style> {
    let featureStyles = features.map((feature) => layerStyle(feature));
    if (featureStyles.length > 1000) {
      featureStyles = featureStyles.slice(0, 100);
    }
    if (featureStyles[0].length) {
      featureStyles = [...featureStyles];
    }
    return featureStyles;
  }

  /**
   * Serialize styles
   * @param style - OpenLayers style
   * @returns Simplified description of style used by template to draw legend
   */
  serializeStyle(style: Style) {
    const styleToSerialize = style[0] ? style[0] : style;
    if (styleToSerialize.getImage == undefined) {
      return;
    }
    const image = styleToSerialize.getImage();
    const stroke = styleToSerialize.getStroke();
    const fill = styleToSerialize.getFill();
    const genStyle = this.setUpLegendStyle(fill, stroke, image);
    return genStyle;
  }

  /**
   * Create object of parameters used for creation of svg content for legend using retrieved styles
   * @param fill - Fill description
   * @param stroke - Stroke description
   * @param image - Image description
   * @returns Simplified description of style used by template to draw legend
   */
  setUpLegendStyle(fill: Fill, stroke: Stroke, image: any) {
    const row: any = {};
    row.style = {maxWidth: '35px', maxHeight: '35px', marginBottom: '10px'};
    if (image && this.HsUtilsService.instOf(image, Icon)) {
      row.icon = {
        type: 'icon',
        src: this.sanitizer.bypassSecurityTrustResourceUrl(image.getSrc()),
      };
    } else if (
      image &&
      (this.HsUtilsService.instOf(image, Circle) ||
        this.HsUtilsService.instOf(image, CircleStyle))
    ) {
      row.customCircle = {
        fill: 'white',
        type: 'circle',
        cx: '17.5px',
        cy: '17.5px',
        r: '15px',
      };
      if (image.getStroke()) {
        Object.assign(row.customCircle, {
          fill: image.getFill().getColor(),
          stroke: image.getStroke().getColor(),
          strokeWidth: image.getStroke().getWidth(),
        });
      }
      if (image.getFill()) {
        Object.assign(row.customCircle, {
          fill: image.getFill().getColor(),
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
    row.hashcode = this.HsUtilsService.hashCode(JSON.stringify(row));
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
    let source_url = '';
    const isTileWms = this.HsUtilsService.instOf(layer.getSource(), TileWMS);
    const isImageWms = this.HsUtilsService.instOf(layer.getSource(), ImageWMS);
    let version = '1.3.0';
    if (isTileWms) {
      source_url = (source as TileWMS).getUrls()[0];
      version = (source as TileWMS).getParams().VERSION;
    } else if (isImageWms) {
      source_url = (source as ImageWMS).getUrl();
      version = (source as ImageWMS).getParams().VERSION;
    } else {
      return '';
    }
    if (source_url.indexOf('proxy4ows') > -1) {
      const params = this.HsUtilsService.getParamsFromUrl(source_url);
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
      source_url = this.HsUtilsService.proxify(source_url, false);
    }
    return source_url;
  }

  /**
   * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
   * @param layer - OpenLayers layer
   * @returns Description of layer to be used for creating the legend. It contains type of layer, sublayer legends, title, visibility etc.
   * @private
   */
  getLayerLegendDescriptor(
    layer: Layer<Source>
  ): HsLegendDescriptor | undefined {
    if (getBase(layer)) {
      return;
    }
    const isTileWms = this.HsUtilsService.instOf(layer.getSource(), TileWMS);
    const isImageWms = this.HsUtilsService.instOf(layer.getSource(), ImageWMS);
    if (isTileWms || isImageWms) {
      const subLayerLegends = (
        isTileWms
          ? (layer.getSource() as TileWMS)
          : (layer.getSource() as ImageWMS)
      )
        .getParams()
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
      this.HsUtilsService.instOf(layer, VectorLayer) &&
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
      this.HsUtilsService.instOf(layer, ImageLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), Static)
    ) {
      return {
        title: getTitle(layer),
        lyr: layer,
        type: 'static',
        visible: layer.getVisible(),
      };
    } else if (this.HsUtilsService.instOf(layer.getSource(), XYZ)) {
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
