import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {createDefaultStyle} from 'ol/style/Style';
@Injectable({
  providedIn: 'root',
})
export class HsStylerService {
  layer: VectorLayer = null;
  newLayerStyleSet: Subject<{
    layerTitle: string;
    layer: VectorLayer;
  }> = new Subject();
  newFeatureStyleSet: Subject<{
    layerTitle: string;
    source: VectorSource;
  }> = new Subject();
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
      src: this.HsUtilsService.resolveEsModule(
        '../../img/pin_white_blue32.png'
      ),
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
  constructor(
    private HsQueryVectorService: HsQueryVectorService,
    private HsUtilsService: HsUtilsService
  ) {}

  pin_white_blue_highlight(feature: Feature, resolution): Array<Style> {
    return [
      new Style({
        image: new Icon({
          src: feature.get('highlighted')
            ? this.HsUtilsService.resolveEsModule(
                require('../../img/pin_white_red32.png')
              )
            : this.HsUtilsService.resolveEsModule(
                require('../../img/pin_white_blue32.png')
              ),
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
    ];
  }
  /**
   * @description Gets layers style object for any vector layer.
   * @param {VectorLayer} layer Any vector layer
   * @returns {any} Returns layer style object
   */
  getLayerStyleObject(layer: VectorLayer): any {
    let features: any;
    if (layer?.getSource()?.getSource) {
      features = layer.getSource().getSource().getFeatures();
    } else {
      features = layer.getSource().getFeatures();
    }
    const style = layer.getStyle();
    if (typeof style == 'function' && features.length > 0) {
      return style(features[0]);
    } else {
      return style;
    }
  }
  /**
   * @description Get a Source for any vector layer. Both clustered and un-clustered.
   * @param {VectorLayer} layer Any vector layer
   * @returns {VectorSource} Source of the input layer or source of its cluster's source
   */
  getLayerSource(layer: VectorLayer): VectorSource {
    let src = [];
    if (layer.getSource().getSource !== undefined) {
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
      const size = feature.get('features')?.length || 0;
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
    const featureStyle = feature.get('features')
      ? feature.get('features')[0].getStyle()
      : feature.getStyle();

    const originalStyle = featureStyle
      ? featureStyle
      : layer.get('hsOriginalStyle')
      ? layer.get('hsOriginalStyle')
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
    if (feature.get('features')) {
      return this.isSelectedFeature(feature.get('features')[0]);
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
    const originalFeature = clusteredContainerFeature.get('features') || [
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
   * @ngdoc method
   * @public
   * @param {object} j Style definition object
   * @returns {ol.style.Style} Valid Ol style object
   * @description Parse style definition object to create valid Style
   */
  parseStyle(j) {
    const style_json: any = {};
    if (j.fill) {
      style_json.fill = new Fill({
        color: j.fill,
      });
    }
    if (j.stroke) {
      style_json.stroke = new Stroke({
        color: j.stroke.color,
        width: j.stroke.width,
      });
    }
    if (j.image) {
      if (j.image.type == 'circle') {
        const circle_json: any = {};

        if (j.image.radius) {
          circle_json.radius = j.image.radius;
        }

        if (j.image.fill) {
          circle_json.fill = new Fill({
            color: j.image.fill,
          });
        }
        if (j.image.stroke) {
          circle_json.stroke = new Stroke({
            color: j.image.stroke.color,
            width: j.image.stroke.width,
          });
        }
        style_json.image = new Circle(circle_json);
      }
      if (j.image.type == 'icon') {
        const img = new Image();
        img.src = j.image.src;
        if (img.width == 0) {
          img.width = 43;
        }
        if (img.height == 0) {
          img.height = 41;
        }
        const icon_json = {
          img: img,
          imgSize: [img.width, img.height],
          crossOrigin: 'anonymous',
        };
        style_json.image = new Icon(icon_json);
      }
    }
    return new Style(style_json);
  }
}
