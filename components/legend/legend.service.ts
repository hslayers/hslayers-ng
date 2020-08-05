import Static from 'ol/source/ImageStatic';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Icon} from 'ol/style';
import {Fill, Image as ImageStyle, Stroke, Style} from 'ol/style';
import {HsLayerSelectorService} from '../layermanager/layer-selector.service';
import {HsLegendDescriptor} from './legend-descriptor.interface';
import {HsUtilsService} from '../utils/utils.service';
import {Image as ImageLayer, Layer} from 'ol/layer';
import {ImageWMS, Source} from 'ol/source';
import {Injectable} from '@angular/core';
import {TileWMS, XYZ} from 'ol/source';

@Injectable({
  providedIn: 'root',
})
export class HsLegendService {
  /**
   * @param HsUtilsService
   * @param HsLayerSelectorService
   */
  constructor(
    private HsUtilsService: HsUtilsService,
    private HsLayerSelectorService: HsLayerSelectorService,
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe((layer) => {
      this.getLayerLegendDescriptor(layer.layer);
    });
  }

  /**
   * Test if layer is visible and has supported type (conditions for displaying legend)
   *
   * @memberof HsLegendService
   * @function isLegendable
   * @param {object} layer Layer to test
   * @returns {boolean} Return if legend might exist for layer and layer is visible
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
   *
   * @memberof HsLegendService
   * @function getVectorFeatureGeometry
   * @param {Layer} currentLayer Layer of interest
   * @returns {Array<string>} Array of simplified lowercase names of geometry types encountered in layer
   */
  getVectorFeatureGeometry(currentLayer: Layer): string[] {
    if (currentLayer === undefined) {
      return;
    }
    let foundPoint = false;
    let foundLine = false;
    let foundPolygon = false;
    for (const feature of currentLayer.getSource().getFeatures()) {
      if (feature.getGeometry()) {
        const type = feature.getGeometry().getType();
        switch (type) {
          case 'LineString' || 'MultiLineString':
            foundLine = true;
            break;
          case 'Polygon' || 'MultiPolygon':
            foundPolygon = true;
            break;
          case 'Point' || 'MultiPoint':
            foundPoint = true;
            break;
          default:
        }
      }
    }
    const tmp = [];
    if (foundLine) {
      tmp.push('line');
    }
    if (foundPolygon) {
      tmp.push('polygon');
    }
    if (foundPoint) {
      tmp.push('point');
    }
    return tmp;
  }

  /**
   * Get vector layer styles for first 100 features
   *
   * @memberof HsLegendService
   * @function getStyleVectorLayer
   * @param {Layer} currentLayer Layer of interest
   * @returns {Array} Array of serialized unique style descriptions encountered when looping through first 100 features
   */
  getStyleVectorLayer(currentLayer: Layer): Array<any> {
    if (currentLayer === undefined) {
      return;
    }
    let styleArray = [];
    const layerStyle = currentLayer.getStyle();
    if (!this.HsUtilsService.isFunction(layerStyle)) {
      styleArray.push(layerStyle);
    } else {
      if (currentLayer.getSource().getFeatures().length > 0) {
        let featureStyle = currentLayer
          .getSource()
          .getFeatures()
          .map((feature) => layerStyle(feature));
        if (featureStyle.length > 1000) {
          featureStyle = featureStyle.slice(0, 100);
        }
        if (featureStyle[0].length) {
          featureStyle = [].concat.apply([], featureStyle);
        }
        styleArray = styleArray.concat(featureStyle);
      }
    }
    const filtered = styleArray.filter(
      (style) => style.getText == undefined || !style.getText()
    );
    let serializedStyles = filtered.map((style) => this.serializeStyle(style));
    serializedStyles = this.HsUtilsService.removeDuplicates(
      serializedStyles,
      'hashcode'
    );
    return serializedStyles;
  }

  /**
   * Serialize styles
   *
   * @memberof HsLegendService
   * @function serializeStyle
   * @param {Style} style Openlayers style
   * @returns {object} Simplified description of style used by template to draw legend
   */
  serializeStyle(style: Style) {
    const styleToSerialize = style[0] ? style[0] : style;
    const image = styleToSerialize.getImage();
    const stroke = styleToSerialize.getStroke();
    const fill = styleToSerialize.getFill();
    const genStyle = this.setUpLegendStyle(fill, stroke, image);
    return genStyle;
  }

  /**
   * Create object of parameters used for creation of svg content for legend using retreived styles
   *
   * @memberof HsLegendService
   * @function setUpLegendStyle
   * @param {Fill} fill Fill description
   * @param {Stroke} stroke Stroke description
   * @param {ImageStyle} image Image description
   * @returns {object} Simplified description of style used by template to draw legend
   */
  setUpLegendStyle(fill: Fill, stroke: Stroke, image: any) {
    const row: any = {};
    row.style = {maxWidth: '35px', maxHeight: '35px', marginBottom: '10px'};
    if (image && this.HsUtilsService.instOf(image, Icon)) {
      row.icon = {type: 'icon', src: image.getSrc()};
    } else if (image && this.HsUtilsService.instOf(image, Circle)) {
      if (image.getStroke() && image.getFill()) {
        row.customCircle = {
          type: 'circle',
          cx: '17.5px',
          cy: '17.5px',
          r: '15px',
          fill: image.getFill().getColor(),
          stroke: image.getStroke().getColor(),
          strokeWidth: image.getStroke().getWidth(),
        };
      } else if (image.getStroke()) {
        row.customCircle = {
          type: 'circle',
          cx: '17.5px',
          cy: '17.5px',
          r: '15px',
          fill: 'blue',
          stroke: image.getStroke().getColor(),
          strokeWidth: image.getStroke().getWidth(),
        };
      }
    } else {
      row.defaultCircle = {
        fill: 'blue',
        cx: '17.5px',
        cy: '17.5px',
        r: '15px',
      };
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
   *
   * @memberof HsLegendService
   * @function getLegendUrl
   * @param {Source} source Source of wms layer
   * @param {string} layer_name Name of layer for which legend is requested
   * @param {Layer} layer Layer to get legend for
   * @returns {string} Url of the legend graphics
   */
  getLegendUrl(source: Source, layer_name: string, layer: Layer): string {
    let source_url = '';
    if (this.HsUtilsService.instOf(source, TileWMS)) {
      source_url = source.getUrls()[0];
    } else if (this.HsUtilsService.instOf(source, ImageWMS)) {
      source_url = source.getUrl();
    } else {
      return '';
    }
    if (source_url.indexOf('proxy4ows') > -1) {
      const params = this.HsUtilsService.getParamsFromUrl(source_url);
      source_url = params.OWSURL;
    }
    let version = '1.3.0';
    if (source.getParams().VERSION) {
      version = source.getParams().VERSION;
    }
    source_url +=
      (source_url.indexOf('?') > 0 ? '' : '?') +
      '&version=' +
      version +
      '&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=' +
      layer_name +
      '&format=image%2Fpng';
    if (
      layer.get('enableProxy') === undefined ||
      layer.get('enableProxy') == true
    ) {
      source_url = this.HsUtilsService.proxify(source_url, false);
    }
    return source_url;
  }

  /**
   * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
   *
   * @memberof HsLegendService
   * @function getLegendUrl
   * @returns {object} Description of layer to be used for creating the legend. It contains type of layer, sublayer legends, title, visibility etc.
   * @param {Layer} layer Openlayers layer
   */
  getLayerLegendDescriptor(layer: Layer): HsLegendDescriptor | undefined {
    if (layer.get('base')) {
      return;
    }
    if (
      this.HsUtilsService.instOf(layer.getSource(), TileWMS) ||
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS)
    ) {
      const subLayerLegends = layer.getSource().getParams().LAYERS.split(',');
      for (let i = 0; i < subLayerLegends.length; i++) {
        subLayerLegends[i] = this.getLegendUrl(
          layer.getSource(),
          subLayerLegends[i],
          layer
        );
      }
      return {
        title: layer.get('title'),
        lyr: layer,
        type: 'wms',
        subLayerLegends: subLayerLegends,
        visible: layer.getVisible(),
      };
    } else if (
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      (layer.get('show_in_manager') === undefined ||
        layer.get('show_in_manager') == true)
    ) {
      return {
        title: layer.get('title'),
        lyr: layer,
        type: 'vector',
        visible: layer.getVisible(),
      };
    } else if (
      this.HsUtilsService.instOf(layer, ImageLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), Static)
    ) {
      return {
        title: layer.get('title'),
        lyr: layer,
        type: 'static',
        visible: layer.getVisible(),
      };
    } else if (this.HsUtilsService.instOf(layer.getSource(), XYZ)) {
      return {
        title: layer.get('title'),
        lyr: layer,
        type: 'static',
        visible: layer.getVisible(),
      };
    } else {
      return undefined;
    }
  }
}
