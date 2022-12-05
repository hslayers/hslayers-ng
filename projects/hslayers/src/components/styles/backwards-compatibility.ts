import SLDParser from 'geostyler-sld-parser';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {
  FillSymbolizer,
  IconSymbolizer,
  LineSymbolizer,
  MarkSymbolizer,
  Symbolizer,
  SymbolizerKind,
} from 'geostyler-style';

export async function parseStyle(j): Promise<{sld?: string; style: Style}> {
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
  const sld = await convertHsStyleToSld(j);
  return {style: new Style(style_json), sld};
}

/**
 * We get serialized layer definition including style definition in custom JSON format.
 * This we need to convert to SLD xml text
 * @param json - Serialized layer which we get from hslayers-ng
 * @param layer - Vector layer to get title from
 */
async function convertHsStyleToSld(json: any): Promise<string> {
  const symbolizers: Symbolizer[] = [];
  if (json.image?.type == 'circle') {
    symbolizers.push(createCircleSymbol(json));
  }
  if (json.image?.type == 'icon') {
    symbolizers.push(createIconSymbol(json));
  }
  if (json.fill) {
    symbolizers.push(createPolygonSymbol(json));
  } else if (json.stroke) {
    symbolizers.push(createLineSymbol(json));
  }
  if (symbolizers.length > 0) {
    const name = 'rule';
    const sldModel = {
      name,
      rules: [{name, symbolizers}],
    };
    const parser = (SLDParser as any).default
      ? new (SLDParser as any).default()
      : new SLDParser();
    const result = await parser.writeStyle(sldModel);
    return result.output;
  }
}

/**
 * Create polygon symbolizer configuration from which the
 * geostyler-sld-parser library will generate SLD xml
 * @param json -
 * @returns
 */
function createPolygonSymbol(json: any): FillSymbolizer {
  const tmp: FillSymbolizer = {
    kind: 'Fill',
    color: json.fill.color,
  };
  if (json.stroke) {
    Object.assign(tmp, {
      outlineColor: json.stroke.color,
      outlineWidth: json.stroke.width,
    });
  }
  return tmp;
}

/**
 * Create line symbolizer configuration from which the
 * geostyler-sld-parser library will generate SLD xml
 * @param json -
 * @returns
 */
function createLineSymbol(json: any): LineSymbolizer {
  const tmp: LineSymbolizer = {
    kind: 'Line',
    color: json.stroke.color,
    width: json.stroke.width,
  };
  return tmp;
}

/**
 * Create circle symbolizer configuration from which the
 * geostyler-sld-parser library will generate SLD xml
 * @param json -
 * @returns
 */
function createCircleSymbol(json: any): MarkSymbolizer {
  const tmp: MarkSymbolizer = {
    kind: 'Mark',
    wellKnownName: 'circle',
    color: json.image.fill.color || json.fill,

    radius: json.image.radius,
  };
  if (json.image.stroke) {
    tmp.strokeColor = json.image.stroke.color;
  } else {
    tmp.strokeColor = json.stroke.color;
  }
  if (json.stroke) {
    tmp.strokeWidth = json.stroke.width;
  }
  return tmp;
}

/**
 * Create icon symbolizer configuration from which the
 * geostyler-sld-parser library will generate SLD xml.
 * It must include embedded base64 encoded svg image
 * @param json -
 * @returns
 */
function createIconSymbol(json: any): IconSymbolizer {
  return {
    kind: 'Icon',
    offset: [0, 0],
    image:
      json.image.src.replace('data:image/svg+xml;base64,', 'base64:') +
      `?fill=${encodeURIComponent(
        json.fill
      )}&fill-opacity=1&outline=${encodeURIComponent(
        json.stroke.color
      )}&outline-opacity=1&outline-width=${json.stroke.width}`,
  };
}
