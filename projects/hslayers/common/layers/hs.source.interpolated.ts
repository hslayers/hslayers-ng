import IDW from 'ol-ext/source/IDW';
import colormap from 'colormap';
import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {LoadingStrategy} from 'ol/source/Vector';
import {Projection} from 'ol/proj';
import {Subject} from 'rxjs';
import {Vector as VectorSource} from 'ol/source';
import {containsExtent, equals} from 'ol/extent';

export const NORMALIZED_WEIGHT_PROPERTY_NAME = 'hs_normalized_IDW_value';

export interface IDWImageData {
  type: 'image';
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface InterpolatedSourceOptions {
  min?: number;
  max?: number;
  features?: Feature<Geometry>[];
  weight: string;
  loader?(params: any): Promise<Feature[]>;
  colorMap?: ((v: number) => number[]) | string;
  strategy?: LoadingStrategy;
  maxFeaturesInExtent?: number;
  maxFeaturesInCache?: number;
}

export class InterpolatedSource extends IDW {
  featureCache: VectorSource = new VectorSource({});
  cancelUrlRequest: Subject<void> = new Subject();
  colorMapChanged: Subject<void> = new Subject();
  geoJSONFeatures: string[] = [];

  constructor(public options: InterpolatedSourceOptions) {
    super({
      // Source that contains the data
      workers: false,
      source: new VectorSource({
        strategy:
          options.strategy != undefined
            ? options.strategy
            : (extent: number[], resolution) => {
                const extentCache = super
                  .getSource()
                  .loadedExtentsRtree_.getAll()
                  .map((item) => item.extent);
                const toRemove = extentCache.filter(
                  //Delete cached extents which contain this extent because they have their feature counts limited
                  (cachedExt) =>
                    !equals(cachedExt, extent) &&
                    containsExtent(cachedExt, extent),
                );
                for (const extToRemove of toRemove) {
                  super.getSource().removeLoadedExtent(extToRemove);
                }
                return [extent];
              },
        loader: async (extent, resolution, projection, success, failure) => {
          if (options.loader) {
            this.fillFeatures(
              await options.loader({
                extent,
                resolution,
                projection,
                success,
                failure,
              }),
              extent,
            );
          }
        },
      }),
      weight: NORMALIZED_WEIGHT_PROPERTY_NAME,
      getColor: getColorMapFromOptions(options),
    });

    if (options.features) {
      this.fillFeatures(options.features);
    }
  }

  /*
   * Display data when ready
   */
  onImageData(imageData: IDWImageData) {
    // Calculation canvas at small resolution
    const canvas = <HTMLCanvasElement>document.createElement('CANVAS');
    (this as any)._internal = canvas;

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');

    if (this.isImageDataMostlyEmpty(imageData)) {
      this.drawNoData(ctx, canvas);
    } else {
      ctx.putImageData(
        new ImageData(imageData.data, imageData.width, imageData.height),
        0,
        0,
      );
    }

    // Draw full resolution canvas
    (this as any)._canvas
      .getContext('2d')
      .drawImage(
        canvas,
        0,
        0,
        (this as any)._canvas.width,
        (this as any)._canvas.height,
      );
  }

  /**
   * Get Minimum boundary used in normalization. Values under this minimum are set to it (clamped)
   */
  get min(): number {
    return this.options.min;
  }

  /**
   * Set Minimum boundary used in normalization. Values under this minimum are set to it (clamped)
   */
  set min(value: number) {
    this.options.min = value;
    this.normalizeWeight(this.weight);
    super.changed();
  }

  /**
   * Get Maximum boundary used in normalization. Values over this minimum are set to it (clamped)
   */
  get max(): number {
    return this.options.max;
  }

  /**
   * Set Maximum boundary used in normalization. Values over this minimum are set to it (clamped)
   */
  set max(value: number) {
    this.options.max = value;
    this.normalizeWeight(this.weight);
    super.changed();
  }

  get colorMap() {
    return this.options.colorMap;
  }

  set colorMap(value: ((v: number) => number[]) | string) {
    this.options.colorMap = value;
    super.getColor = getColorMapFromOptions(this.options);
    this.colorMapChanged.next();
    super.changed();
  }

  /**
   * Get the feature attribute used to get the values interpolated
   */
  get weight(): string {
    return this.options.weight;
  }

  /**
   * Set the feature attribute used to get the values interpolated
   */
  set weight(value: string) {
    this.options.weight = value;
    this.normalizeWeight(this.weight);
    super.changed();
  }

  /**
   * Fill Interpolated source features
   * @param features - Parsed Ol features from get request
   * @param extent - Current map extent
   */
  fillFeatures(features: Feature<Geometry>[], extent?: number[]) {
    if (!features) {
      return;
    }
    const featsCached = this.featureCache.getFeatures();
    const cacheLimit = this.options.maxFeaturesInCache;
    if (cacheLimit < featsCached.length + features.length) {
      const cntToRemove = featsCached.length - (cacheLimit - features.length);
      featsCached
        .slice(0, cntToRemove)
        .forEach((f) => this.featureCache.removeFeature(f));
    }
    const countToAdd = cacheLimit ?? Number.MAX_VALUE;
    this.featureCache.addFeatures(features.slice(0, countToAdd));
    this.normalizeWeight(this.options.weight);
    const src = super.getSource();
    if (extent) {
      src.clear();
      const limitInExt = this.options.maxFeaturesInExtent ?? Number.MAX_VALUE;
      src.addFeatures(
        this.featureCache.getFeaturesInExtent(extent).slice(0, limitInExt),
      );
    } else {
      src.addFeatures(features);
    }
  }

  /**
   * Parse features from get request
   * @param collection - Get request response feature collection
   * @param mapProjection - Map projection
   */
  parseFeatures(collection: any, mapProjection: string | Projection): void {
    if (collection?.features?.length > 0) {
      const dataProj = (collection.crs || collection.srs) ?? 'EPSG:4326';
      collection.features = collection.features.filter(
        (f) => !this.geoJSONFeatures.includes(f),
      );
      this.geoJSONFeatures = this.geoJSONFeatures.concat(collection.features);
      collection.features = new GeoJSON().readFeatures(collection, {
        dataProjection: dataProj,
        featureProjection: mapProjection,
      });
      collection.features = collection.features.filter((f) => {
        const value = f.get(this.options.weight);
        if (value && !isNaN(parseInt(value))) {
          return f;
        }
      });
      return collection.features;
    }
  }

  /**
   * Create url for get request including current map extent
   * @param url - external source URL
   * @param extent - Current map extent
   */
  createIDWSourceUrl(url: string, extent: number[]): string {
    if (!url) {
      return;
    } else if (extent) {
      const extentObj = [
        {ref: 'minx', value: extent[0].toFixed(1)},
        {ref: 'miny', value: extent[1].toFixed(1)},
        {ref: 'maxx', value: extent[2].toFixed(1)},
        {ref: 'maxy', value: extent[3].toFixed(1)},
      ];
      const matches = url.match(/{.+?}/g);
      if (matches?.length > 0 && matches?.length <= 4) {
        for (const m of matches) {
          const ix = matches.indexOf(m);
          const key = m.replace(/[{}]/g, '').toLowerCase();
          const coord = extentObj.find((e) => e.ref === key) ?? extentObj[ix];
          url = url.replace(m, coord.value);
        }
      }
    }
    return url;
  }
  /**
   * Normalize weight values to be between 0 and 100
   * //https://www.statology.org/normalize-data-between-0-and-100/
   * @param weight - Weight property name
   */
  normalizeWeight(weight: string): void {
    const features = this.featureCache.getFeatures();
    const weightValues = features.map((f) => parseFloat(f.get(weight)));
    const min = this.options.min ?? Math.min(...weightValues);
    const max = this.options.max ?? Math.max(...weightValues);

    features.forEach((f) => {
      const val = Math.min(Math.max(f.get(weight), min), max); //https://www.webtips.dev/webtips/javascript/how-to-clamp-numbers-in-javascript
      const normalizedWeight = Math.ceil(((val - min) / (max - min)) * 99);
      f.set(NORMALIZED_WEIGHT_PROPERTY_NAME, normalizedWeight, true);
    });
  }

  /**
   * Determine whether the IDW canvas displays data or not
   * by checking 4 pixels in predefined image areas
   */
  isImageDataMostlyEmpty(imageData: IDWImageData) {
    const {width, height, data} = imageData;
    const positions = [
      // Corners
      {x: 0, y: 0},
      {x: width - 2, y: 0},
      {x: 0, y: height - 2},
      {x: width - 2, y: height - 2},
      // Edges
      {x: Math.floor(width / 2), y: 0},
      {x: Math.floor(width / 2), y: height - 2},
      {x: 0, y: Math.floor(height / 2)},
      {x: width - 2, y: Math.floor(height / 2)},
      // Center
      {x: Math.floor(width / 2), y: Math.floor(height / 2)},
      // Quadrants
      {x: Math.floor(width / 4), y: Math.floor(height / 4)},
      {x: Math.floor((3 * width) / 4), y: Math.floor(height / 4)},
      {x: Math.floor(width / 4), y: Math.floor((3 * height) / 4)},
      {x: Math.floor((3 * width) / 4), y: Math.floor((3 * height) / 4)},
    ];

    // Define offsets to check neighboring pixels
    const offsets = [
      {dx: 0, dy: 0},
      {dx: 1, dy: 0},
      {dx: 0, dy: 1},
      {dx: 1, dy: 1},
    ];

    for (const pos of positions) {
      for (const offset of offsets) {
        const x = pos.x + offset.dx;
        const y = pos.y + offset.dy;

        // Ensure x and y are within bounds
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = (y * width + x) * 4;

          if (
            data[index] !== 0 || // Red component
            data[index + 1] !== 0 || // Green component
            data[index + 2] !== 0 // Blue component
            //data[index + 3] !== 255 // Alpha component
          ) {
            return false; // Found a pixel with data
          }
        }
      }
    }

    return true;
  }

  /**
   * Draw 'NO DATA' label over layers canvas
   */
  drawNoData(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Set the desired canvas size
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    // Get the device pixel ratio
    const scale = window.devicePixelRatio || 1;

    // Set the canvas width and height for high DPI
    canvas.width = originalWidth * scale;
    canvas.height = originalHeight * scale;

    // Scale the context to match the canvas size
    ctx.scale(scale, scale);

    const text = 'NO DATA';
    let fontSize = 30;
    ctx.font = `${fontSize}px Arial`;

    // Measure the text width with padding (10px on each side)
    let textWidth = ctx.measureText(text).width + 20;

    // Adjust font size to fit within the canvas
    while (
      textWidth > originalWidth * 0.9 * scale ||
      fontSize > originalHeight * 0.9 * scale
    ) {
      fontSize -= 2;
      ctx.font = `${fontSize}px Arial`;
      textWidth = ctx.measureText(text).width + 20;
    }

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the text
    ctx.fillText(text, originalWidth / 2, originalHeight / 2);
  }
}
/**
 * Gets predefined colorMap array based on name and number of shades.
 * If you want to reverse defined color map add '-reverse' to the map name
 * @param name - Predefined color map name [https://github.com/bpostlethwaite/colormap]
 * @param nshades - Number of shades [default = 100]
 * @returns Array of colors
 */
function generateColormap(name: string, nshades: number = 100): number[] {
  const reverse = name.includes('-reverse');
  name = reverse ? name.split('-reverse')[0] : name;
  const cmap = colormap({
    colormap: name,
    nshades,
    format: 'rgb',
    alpha: 255,
  }).map((v) => {
    v[3] = 255;
    return v;
  });
  return reverse ? cmap.reverse() : cmap;
}

/**
 * Creates a function to return value from predefined color maps if name of color map is provided
 */
function getColorMap(mapName: string): (v: number) => number | number[] {
  const clrMap = generateColormap(mapName);
  return (v) => {
    const black = [0, 0, 0, 255];
    if (isNaN(v)) {
      return black;
    }
    if (v > 99) {
      v = 99;
    }
    if (v < 0) {
      v = 0;
    }
    v = Math.floor(v);
    return clrMap[v];
  };
}

/**
 * Assingns colorMap function based on colorMap option used.
 * Predefined color maps if name of color map is provided
 * or uses the passed function directly.
 * @param options
 */
function getColorMapFromOptions(
  options: InterpolatedSourceOptions,
): (v: number) => number | number[] {
  let getColor;
  if (typeof options.colorMap == 'string') {
    getColor = getColorMap(options.colorMap);
  } else {
    getColor = options.colorMap;
  }
  return getColor;
}

export default InterpolatedSource;
