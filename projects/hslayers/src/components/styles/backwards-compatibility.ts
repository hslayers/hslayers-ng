import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {getHsOriginalStyle} from '../../common/layer-extensions';

export function parseStyle(j) {
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

/**
 * @description Gets layers style object for any vector layer.
 * @param isClustered
 * @param {VectorLayer} layer Any vector layer
 * @returns {any} Returns layer style object
 */
export function getLayerStyleObject(
  layer: VectorLayer,
  isClustered?: boolean
): any {
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
