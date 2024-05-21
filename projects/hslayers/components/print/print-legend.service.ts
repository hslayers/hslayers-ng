import {Injectable} from '@angular/core';

import {Observable, Subject, Subscription} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLegendDescriptor} from 'hslayers-ng/components/legend';
import {HsLegendLayerStaticService} from 'hslayers-ng/components/legend';
import {HsLegendService} from 'hslayers-ng/components/legend';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsShareThumbnailService} from 'hslayers-ng/services/share';
import {LegendObj} from './types/legend-object.type';
import {SparqlJson} from 'hslayers-ng/common/layers';

export class PrintLegendParams {
  legendWidth: number;
  loadingExternalImages = false;
  cancelRequest: Subject<void> = new Subject<void>();
  subscriptions: Subscription[] = [];
}

@Injectable({
  providedIn: 'root',
})
export class HsPrintLegendService extends PrintLegendParams {
  constructor(
    private hsMapService: HsMapService,
    private hsLegendService: HsLegendService,
    private hsLegendLayerStaticService: HsLegendLayerStaticService,
    private hsLanguageService: HsLanguageService,
    private hsShareThumbnailService: HsShareThumbnailService,
  ) {
    super();
    this.cancelRequest.subscribe(() => {
      this.loadingExternalImages = false;
      for (const subs of this.subscriptions) {
        subs.unsubscribe();
        this.subscriptions.splice(this.subscriptions.indexOf(subs), 1);
      }
    });
  }
  /**
   * Convert svg to image
   * @param svgSource - Svg source
   */
  svgToImage(svgSource: string): Promise<HTMLImageElement> {
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
      this.subscriptions.push(
        obs.subscribe((img) => {
          resolve(img);
        }),
      );
    });
  }

  /**
   * Draw legend canvas
   * @param legendObj - Legend object
   */
  async drawLegendCanvas(legendObj: LegendObj): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    this.legendWidth = legendObj.width;
    const legendImages = await this.getLegendImages();
    if (legendImages?.length > 0) {
      const canvasHeight = legendImages
        .map((img) => img.height)
        .reduce((height, img) => height + img);
      this.hsShareThumbnailService.setCanvasSize(
        canvas,
        this.legendWidth,
        canvasHeight,
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
    legendImages: HTMLImageElement[],
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
    legendObj: LegendObj,
  ): void {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = legendObj.bcColor;
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Get legend images from layer legend descriptors
   */
  private async getLegendImages(): Promise<HTMLImageElement[]> {
    const svgSources: string[] = [];
    const images: HTMLImageElement[] = [];
    const layers = this.hsMapService
      .getLayersArray()
      .filter((l) => l.getVisible());
    for (const layer of layers) {
      let svgSource: string;
      const desc = await this.hsLegendService.getLayerLegendDescriptor(layer);
      if (desc) {
        switch (desc.type) {
          case 'vector':
            svgSource = await this.getVectorSvgSource(desc);
            break;
          case 'wms':
            for (const sublayer of desc.subLayerLegends) {
              const wmsSvg = await this.legendImageToSvg(
                sublayer,
                this.hsLanguageService.getTranslationIgnoreNonExisting(
                  'LAYERS',
                  desc.title,
                  undefined,
                ),
              );
              if (wmsSvg) {
                svgSources.push(wmsSvg);
              }
            }
            break;
          case 'static':
            svgSource = await this.getStaticSvgSource(desc);
            break;
          default:
            return;
        }
        if (svgSource) {
          svgSources.push(svgSource);
        }
      }
    }
    this.loadingExternalImages = false;
    if (svgSources?.length > 0) {
      {
        for (const source of svgSources) {
          const image = await this.svgToImage(source);
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
   */
  private async getVectorSvgSource(desc: HsLegendDescriptor): Promise<string> {
    let svgSource = '';
    if (!desc.svg) {
      return;
    }
    if (desc.autoLegend) {
      const legendSource = await this.hsLegendService.getVectorLayerLegendSvg(
        desc.lyr as VectorLayer<VectorSource>,
      );
      if (!legendSource) {
        return;
      }
      svgSource = this.legendToSvg(
        legendSource,
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'LAYERS',
          desc.title,
          undefined,
        ),
      );
    } else {
      for (const category of (desc.lyr.getSource() as SparqlJson)
        .legend_categories) {
        svgSource = this.sparqlJsonToSvg(category, desc.title);
      }
    }
    return svgSource;
  }

  /**
   * Get Static layer legend svg source
   * @param desc - HsLegendDescriptor
   */
  private async getStaticSvgSource(desc: HsLegendDescriptor): Promise<string> {
    let svgSource = '';
    const layerLegend = this.hsLegendLayerStaticService.fillContent(desc.lyr);
    switch (layerLegend.legendType) {
      case 'image':
        svgSource = await this.legendImageToSvg(
          layerLegend.lastLegendImage,
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'LAYERS',
            desc.title,
            undefined,
          ),
        );
        break;
      case 'svg':
        svgSource = this.legendToSvg(
          layerLegend.lastLegendImage,
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'LAYERS',
            desc.title,
            undefined,
          ),
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
   */
  private legendToSvg(source: string, layerTitle: string): string {
    const heightRegex = /height="([0-9]+)"/;
    const height = Number(source.match(heightRegex)[1]) ?? 70;
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${
      this.legendWidth
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
   */
  private sparqlJsonToSvg(category: any, layerTitle: string): string {
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${this.legendWidth}' height='70px'>
            <foreignObject width='100%' height='100%'>
            <div xmlns='http://www.w3.org/1999/xhtml'>
              ${layerTitle}
              <p>
                <span style="background-color: ${category.color}" xml:space="preserve"></span>${category.name}
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
   */
  private legendImageToSvg(
    imageUrl: string,
    layerTitle: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const obs = new Observable<string>((subscriber) => {
        this.loadingExternalImages = true;
        const img = new Image();
        const width = this.legendWidth;
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
            this.legendWidth,
            img.height,
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
      this.subscriptions.push(
        obs.subscribe((svg) => {
          resolve(svg);
        }),
      );
    });
  }
}
