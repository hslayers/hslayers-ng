import {Injectable} from '@angular/core';

import {Geometry} from 'ol/geom';
import {Observable, Subject, Subscription} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import SparqlJson from '../../common/layers/hs.source.SparqlJson';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLegendDescriptor} from '../legend/legend-descriptor.interface';
import {HsLegendLayerStaticService} from '../legend/legend-layer-static/legend-layer-static.service';
import {HsLegendService} from '../legend/legend.service';
import {HsMapService} from '../map/map.service';
import {HsShareThumbnailService} from '../permalink/share-thumbnail.service';
import {LegendObj} from './types/legend-object.type';

export class PrintLegendParams {
  legendWidth: number;
  loadingExternalImages = false;
  cancelRequest: Subject<void> = new Subject<void>();
  subscriptions: Subscription[] = [];
}
@Injectable({
  providedIn: 'root',
})
export class HsPrintLegendService {
  apps: {
    [id: string]: PrintLegendParams;
  } = {default: new PrintLegendParams()};
  constructor(
    private hsMapService: HsMapService,
    private hsLegendService: HsLegendService,
    private hsLegendLayerStaticService: HsLegendLayerStaticService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsShareThumbnailService: HsShareThumbnailService
  ) {}
  /**
   * Initialize the print legend service data and subscribers
   * @param app - App identifier
   */
  init(app: string): void {
    const appRef = this.get(app);
    appRef.cancelRequest.subscribe(() => {
      appRef.loadingExternalImages = false;
      for (const subs of appRef.subscriptions) {
        subs.unsubscribe();
        appRef.subscriptions.splice(appRef.subscriptions.indexOf(subs), 1);
      }
    });
  }

  /**
   * Get the params saved by the print legend service for the current app
   * @param app - App identifier
   */
  get(app: string): PrintLegendParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new PrintLegendParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Convert svg to image
   * @param svgSource - Svg source
   * @param app - App identifier
   */
  svgToImage(svgSource: string, app: string): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
      const obs = new Observable<HTMLImageElement>((subscriber) => {
        const img = new Image();
        img.onload = function () {
          subscriber.next(img);
          subscriber.complete();
        };
        img.onerror = function (event) {
          subscriber.next();
          subscriber.complete();
        };
        if (
          svgSource?.indexOf('data') !== 0 &&
          img.getAttribute('crossOrigin') !== undefined
        ) {
          img.setAttribute('crossOrigin', 'anonymous');
        }
        img.src = svgSource;
      });
      this.get(app).subscriptions.push(
        obs.subscribe((img) => {
          resolve(img);
        })
      );
    });
  }

  /**
   * Draw legend canvas
   * @param legendObj - Legend object
   * @param app - App identifier
   */
  async drawLegendCanvas(
    legendObj: LegendObj,
    app: string
  ): Promise<HTMLCanvasElement> {
    const appRef = this.get(app);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    appRef.legendWidth = legendObj.width || 200; //Needs to have some default width if none is set
    const legendImages = await this.getLegendImages(app);
    if (legendImages?.length > 0) {
      const canvasHeight = legendImages
        .map((img) => img.height)
        .reduce((height, img) => height + img);
      this.hsShareThumbnailService.setCanvasSize(
        canvas,
        appRef.legendWidth,
        canvasHeight
      );
      this.styleLegendCanvas(canvas, legendObj);
      await this.fillLegendCanvas(ctx, legendImages);
      return canvas;
    }
  }

  /**
   * Fill legend canvas with images
   * @param ctx - Legend canvas context
   * @param legendImages - All available legend images
   */
  private async fillLegendCanvas(
    ctx: CanvasRenderingContext2D,
    legendImages: HTMLImageElement[]
  ): Promise<void> {
    let height = 0;
    for (const img of legendImages) {
      ctx.drawImage(img, 0, height);
      height += img.height;
    }
  }

  /**
   * Style legend canvas background
   * @param canvas - Legend canvas
   * @param legendObj - Legend object
   */
  private styleLegendCanvas(
    canvas: HTMLCanvasElement,
    legendObj: LegendObj
  ): void {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = legendObj.bcColor || 'white';
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Get legend images from layer legend descriptors
   * @param app - App identifier
   */
  private async getLegendImages(app: string): Promise<HTMLImageElement[]> {
    const svgSources: string[] = [];
    const images: HTMLImageElement[] = [];
    const layers = this.hsMapService
      .getLayersArray(app)
      .filter((l) => l.getVisible());
    for (const layer of layers) {
      let svgSource: string;
      const desc = await this.hsLegendService.getLayerLegendDescriptor(
        layer,
        app
      );
      if (desc) {
        switch (desc.type) {
          case 'vector':
            svgSource = await this.getVectorSvgSource(desc, app);
            break;
          case 'wms':
            for (const sublayer of desc.subLayerLegends) {
              const wmsSvg = await this.legendImageToSvg(
                sublayer,
                this.hsLayerUtilsService.translateTitle(desc.title, app),
                app
              );
              if (wmsSvg) {
                svgSources.push(wmsSvg);
              }
            }
            break;
          case 'static':
            svgSource = await this.getStaticSvgSource(desc, app);
            break;
          default:
            return;
        }
        if (svgSource) {
          svgSources.push(svgSource);
        }
      }
    }
    this.get(app).loadingExternalImages = false;
    if (svgSources?.length > 0) {
      {
        for (const source of svgSources) {
          const image = await this.svgToImage(source, app);
          if (image) {
            images.push(image);
          }
        }
      }
    }
    return images;
  }

  /**
   * Get Vector layer legend svg source
   * @param desc - HsLegendDescriptor
   * @param app - App identifier
   */
  private async getVectorSvgSource(
    desc: HsLegendDescriptor,
    app: string
  ): Promise<string> {
    let svgSource = '';
    if (!desc.svg) {
      return;
    }
    if (desc.autoLegend) {
      const legendSource = await this.hsLegendService.getVectorLayerLegendSvg(
        desc.lyr as VectorLayer<VectorSource<Geometry>>
      );
      if (!legendSource) {
        return;
      }
      svgSource = this.legendToSvg(
        legendSource,
        this.hsLayerUtilsService.translateTitle(desc.title, app),
        app
      );
    } else {
      for (const category of (desc.lyr.getSource() as SparqlJson)
        .legend_categories) {
        svgSource = this.sparqlJsonToSvg(category, desc.title, app);
      }
    }
    return svgSource;
  }

  /**
   * Get Static layer legend svg source
   * @param desc - HsLegendDescriptor
   * @param app - App identifier
   */
  private async getStaticSvgSource(
    desc: HsLegendDescriptor,
    app: string
  ): Promise<string> {
    let svgSource = '';
    const layerLegend = this.hsLegendLayerStaticService.fillContent(desc.lyr);
    switch (layerLegend.legendType) {
      case 'image':
        svgSource = await this.legendImageToSvg(
          layerLegend.lastLegendImage,
          this.hsLayerUtilsService.translateTitle(desc.title, app),
          app
        );
        break;
      case 'svg':
        svgSource = this.legendToSvg(
          layerLegend.lastLegendImage,
          this.hsLayerUtilsService.translateTitle(desc.title, app),
          app
        );

        break;
      default:
        return;
    }
    return svgSource;
  }

  /**
   * Create svg from legend source and layer title
   * @param source - Legend source
   * @param layerTitle - Layer title
   * @param app - App identifier
   */
  private legendToSvg(source: string, layerTitle: string, app: string): string {
    const heightRegex = /height="([0-9]+)"/;
    const height = Number(source.match(heightRegex)[1]) ?? 70;
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${
      this.get(app).legendWidth
    }' height='${height + 12}px'>
            <foreignObject width='100%' height='100%'>
              <div xmlns='http://www.w3.org/1999/xhtml'>
                ${layerTitle}
              </div>
            ${source.replace(/&nbsp;/g, '')}
            </foreignObject>
        </svg>`;
    const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
    return svg;
  }

  /**
   * Create svg from sparqlJson source and layer title
   * @param category - Category property for sparqlJson layer
   * @param layerTitle - Layer title
   * @param app - App identifier
   */
  private sparqlJsonToSvg(
    category: any,
    layerTitle: string,
    app: string
  ): string {
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${
      this.get(app).legendWidth
    }' height='70px'>
            <foreignObject width='100%' height='100%'>
            <div xmlns='http://www.w3.org/1999/xhtml'>
              ${layerTitle}
              <p>
                <span style="background-color: ${
                  category.color
                }" xml:space="preserve"></span>${category.name}
              </p>
            </div>
            </foreignObject>
        </svg>`;
    const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
    return svg;
  }

  /**
   * Create svg from image url (external source) and layer title
   * @param imageUrl - Image url
   * @param layerTitle - Layer title
   * @param app - App identifier
   */
  private legendImageToSvg(
    imageUrl: string,
    layerTitle: string,
    app: string
  ): Promise<string> {
    const appRef = this.get(app);
    return new Promise(async (resolve, reject) => {
      const obs = new Observable<string>((subscriber) => {
        appRef.loadingExternalImages = true;
        const img = new Image();
        const width = appRef.legendWidth;
        if (
          imageUrl?.indexOf('data') !== 0 &&
          img.getAttribute('crossOrigin') !== undefined
        ) {
          img.setAttribute('crossOrigin', 'anonymous');
        }
        img.onload = () => {
          const canvas = document.createElement('canvas');
          this.hsShareThumbnailService.setCanvasSize(
            canvas,
            appRef.legendWidth,
            img.height
          );
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          ctx.font = '14px sans-serif';
          const additionalHeight =
            Math.ceil(ctx.measureText(layerTitle).width) > width ? 40 : 20;
          const dataURL = canvas.toDataURL('image/png');
          const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${
            canvas.height + additionalHeight
          }'>
            <foreignObject width='100%' height='100%'>
                <div xmlns='http://www.w3.org/1999/xhtml'>
                    ${layerTitle}
                </div>
              <svg width='${width}' height='${
            canvas.height
          }'><image href="${dataURL}"></image></svg>
            </foreignObject>
        </svg>`;
          const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
          subscriber.next(svg);
          subscriber.complete();
        };
        img.onerror = function () {
          subscriber.next();
          subscriber.complete();
        };
        img.src = imageUrl;
      });
      appRef.subscriptions.push(
        obs.subscribe((svg) => {
          resolve(svg);
        })
      );
    });
  }
}
