import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {createDefaultStyle} from 'ol/style/Style';

import {HsQueryVectorService} from '../query/query-vector.service';
import {HsUtilsService} from '../utils/utils.service';
import {getHighlighted} from '../../common/feature-extensions';
import {getHsOriginalStyle} from '../../common/layer-extensions';

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
  constructor(
    public HsQueryVectorService: HsQueryVectorService,
    public HsUtilsService: HsUtilsService,
    public sanitizer: DomSanitizer
  ) {}

  pin_white_blue_highlight(feature: Feature, resolution): Array<Style> {
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
  }
  isVectorLayer(layer: any): boolean {
    if (this.HsUtilsService.instOf(layer, VectorLayer)) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * @description Gets layers style object for any vector layer.
   * @param isClustered
   * @param {VectorLayer} layer Any vector layer
   * @returns {any} Returns layer style object
   */
  getLayerStyleObject(layer: VectorLayer, isClustered?: boolean): any {
    if (!layer) {
      return;
    }
    if (this.isVectorLayer(layer)) {
      let style: any;
      if (
        (isClustered !== undefined && isClustered) ||
        layer.getSource()?.getSource
      ) {
        style = getHsOriginalStyle(layer);
      } else {
        style = layer.getStyle();
      }
      if (style !== undefined) {
        if (typeof style == 'function') {
          return style(new Feature())[0];
        } else {
          return style;
        }
      }
    }
  }
  hasFeatures(layer: VectorLayer, isClustered: boolean): boolean {
    if (this.isVectorLayer(layer)) {
      const src = this.getLayerSource(layer, isClustered);
      if (src?.getFeatures().length > 0) {
        return true;
      } else {
        return false;
      }
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
  getImageStyle(image: any): any {
    if (image === undefined) {
      return;
    }
    const imageStyle: any = {};
    if (image.type === 'icon' && image.src) {
      if (
        typeof image.src == 'string' &&
        image.src.slice(0, 10) === 'data:image'
      ) {
        const encodedIconData = image.src.replace(
          'data:image/svg+xml;base64,',
          ''
        );
        const decodedIcon: any = this.decodeToUnicode(encodedIconData);
        const icon: any = this.getIconStyleFromLayer(decodedIcon);
        const serialized_icon: any = image.src;
        icon.serialized_icon = serialized_icon;
        imageStyle.icon = icon;
      } else {
        //TODO Check if this is even necessary
        //this.iconSelected(image.getSrc());
      }
    }
    if (image.type === 'circle') {
      const circle: any = {};
      if (image.radius) {
        circle.radius = image.radius;
      }
      if (image.stroke?.width) {
        circle.iconlinewidth = image.stroke.width;
      }
      if (image.fill) {
        circle.iconfillcolor = image.fill;
      }
      if (image.stroke?.color) {
        circle.iconlinecolor = image.stroke.color;
      }
      imageStyle.circle = circle;
    }
    return imageStyle;
  }
  getIconStyleFromLayer(decodedIcon: any): any {
    const iconStyle: any = {};
    const iconimage: any = this.sanitizer.bypassSecurityTrustHtml(decodedIcon);
    iconStyle.iconimage = iconimage;
    const parser = new DOMParser();
    const doc = parser.parseFromString(decodedIcon, 'image/svg+xml');
    const svgPath: any = doc.querySelectorAll('path');
    if (!svgPath) {
      return;
    } else {
      const path = svgPath[0];
      if (path.style?.stroke) {
        iconStyle.iconlinecolor = path.style.stroke;
      }
      if (path.style?.fill) {
        iconStyle.iconfillcolor = path.style.fill;
      }
      if (path.style?.strokeWidth) {
        iconStyle.iconlinewidth = path.style.strokeWidth;
      }
    }
    return iconStyle;
  }
}
