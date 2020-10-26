import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {createDefaultStyle} from 'ol/style/Style';
/**
 *
 */
export class HsStylerService {
  constructor(HsQueryVectorService) {
    'ngInject';
    Object.assign(this, {
      HsQueryVectorService,
    });
    this.pin_white_blue = new Style({
      image: new Icon({
        src: '../../img/pin_white_blue32.png',
        crossOrigin: 'anonymous',
        anchor: [0.5, 1],
      }),
    });

    this.measure_style = new Style({
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
    this.simple_style = new Style({
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
    this.clusterStyle = new Style({
      stroke: new Stroke({
        color: '#fff',
      }),
      fill: new Fill({
        color: '#3399CC',
      }),
    });
  }

  pin_white_blue_highlight(feature, resolution) {
    return [
      new Style({
        image: new Icon({
          src: feature.get('highlighted')
            ? '../../img/pin_white_red32.png'
            : '../../img/pin_white_blue32.png',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
    ];
  }
  /**
   * @description Style clustered layer features using cluster style or induvidual feature style.
   * @param {VectorLayer} layer Any vector layer
   */
  styleClusteredLayer(layer) {
    const styleCache = {};
    layer.setStyle((feature, resolution) => {
      const size = feature.get('features').length || 0;
      if (size > 1) {
        return this.makeClusterMarker(styleCache, size);
      } else {
        return this.makeSingleFeatureClusterMarker(feature, resolution, layer);
      }
    });
  }

  makeClusterMarker(styleCache, size) {
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

  applyStyleIfNeeded(style, feature, resolution) {
    if (typeof style == 'function') {
      return style(feature, resolution);
    } else {
      return style;
    }
  }

  isSelectedFeature(feature) {
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

  /**
   * @description Create marker for single feature.
   * @param {VectorLayer} layer Any vector layer
   * @param {number} resolution Displayed feature resolution
   * @param {Feature} feature Any vector layer feature
   */
  makeSingleFeatureClusterMarker(feature, resolution, layer) {
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

  useStyleOnFirstFeature(style, clusteredContainerFeature) {
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
}
