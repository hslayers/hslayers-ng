import {Injectable} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';

import SparqlJson from '../../common/layers/hs.source.SparqlJson';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLegendDescriptor} from '../legend/legend-descriptor.interface';
import {HsLegendLayerStaticService} from '../legend/legend-layer-static/legend-layer-static.service';
import {HsLegendService} from '../legend/legend.service';
import {HsMapService} from '../map/map.service';
import {HsShareService} from '../permalink/share.service';
import {LegendObj} from './models/legend-object.model';

@Injectable({
  providedIn: 'root',
})
export class HsPrintLegendService {
  legendWidth: number;
  constructor(
    private hsMapService: HsMapService,
    private hsLegendService: HsLegendService,
    private hsLegendLayerStaticService: HsLegendLayerStaticService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsShareService: HsShareService
  ) {}

  svgToImage(svgSource: string): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      try {
        img.onload = function () {
          resolve(img);
        };
        img.onerror = function () {
          reject();
        };
        img.src = svgSource;
      } catch (error) {
        console.log(error);
        reject();
      }
    });
  }

  async drawLegendCanvas(legendObj: LegendObj): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    this.legendWidth = legendObj?.width ?? 200; //Needs to have some default width if none is set
    const legendImages = await this.getLegendImages();
    if (legendImages?.length > 0) {
      const canvasHeight = legendImages
        .map((img) => img.height)
        .reduce((height, img) => height + img);
      this.hsShareService.setCanvasSize(canvas, this.legendWidth, canvasHeight);
      this.styleLegendCanvas(canvas, legendObj);
      await this.fillLegendCanvas(ctx, legendImages);
      return canvas;
    }
  }

  /**
   * Fill canvas with legend images
   * @param ctx - Legend canvas context
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

  styleLegendCanvas(canvas: HTMLCanvasElement, legendObj: LegendObj): void {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = legendObj.bcColor ?? 'white';
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async getLegendImages(): Promise<HTMLImageElement[]> {
    let svgSource: string;
    const images: HTMLImageElement[] = [];
    const layers = this.hsMapService
      .getLayersArray()
      .filter((l) => l.getVisible());
    for (const layer of layers) {
      const desc = await this.hsLegendService.getLayerLegendDescriptor(layer);
      if (desc) {
        switch (desc.type) {
          case 'vector':
            svgSource = await this.getVectorSvgSource(desc);
            break;
          case 'wms':
            for (const sublayer of desc.subLayerLegends) {
              svgSource = await this.legendImageToSvg(
                sublayer,
                this.hsLayerUtilsService.translateTitle(desc.title)
              );
            }
            break;
          case 'static':
            svgSource = await this.getStaticSvgSource(desc);
            break;
          default:
            return;
        }

        if (svgSource) {
          const image = await this.svgToImage(svgSource);
          if (image) {
            images.push(image);
          }
        }
      }
    }
    return images;
  }

  private async getVectorSvgSource(
    descriptor: HsLegendDescriptor
  ): Promise<string> {
    let svgSource = '';
    if (!descriptor.svg) {
      return;
    }
    if (descriptor.autoLegend) {
      const legendSource = await this.hsLegendService.getVectorLayerLegendSvg(
        descriptor.lyr as VectorLayer<VectorSource<Geometry>>
      );
      svgSource = this.legendToSvg(
        legendSource,
        this.hsLayerUtilsService.translateTitle(descriptor.title)
      );
    } else {
      for (const category of (descriptor.lyr.getSource() as SparqlJson)
        .legend_categories) {
        svgSource = this.sparqlJsonToSvg(category, descriptor.title);
      }
    }
    return svgSource;
  }

  private async getStaticSvgSource(desc: HsLegendDescriptor): Promise<string> {
    let svgSource = '';
    const layerLegend = this.hsLegendLayerStaticService.fillContent(desc.lyr);
    switch (layerLegend.legendType) {
      case 'image':
        svgSource = await this.legendImageToSvg(
          layerLegend.lastLegendImage,
          this.hsLayerUtilsService.translateTitle(desc.title)
        );
        break;
      case 'svg':
        svgSource = this.legendToSvg(
          layerLegend.lastLegendImage,
          this.hsLayerUtilsService.translateTitle(desc.title)
        );

        break;
      default:
        return;
    }
    return svgSource;
  }

  private legendToSvg(source: string, layerTitle: string): string {
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${this.legendWidth}' height='70px'>
            <foreignObject width='100%' height='100%'>
            ${layerTitle}
            ${source}
            </foreignObject>
        </svg>`;
    const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
    return svg;
  }

  private sparqlJsonToSvg(category: any, layerTitle: string): string {
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${this.legendWidth}' height='70px'>
            <foreignObject width='100%' height='100%'>
            <div xmlns='http://www.w3.org/1999/xhtml'>
              ${layerTitle}
              <p>
                <span style="background-color: ${category.color}">&nbsp;&nbsp;&nbsp;</span>&nbsp;${category.name}
              </p>
            </div>
            </foreignObject>
        </svg>`;
    const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
    return svg;
  }

  private async legendImageToSvg(
    imageUrl: string,
    layerTitle: string
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      const width = this.legendWidth;
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${
          canvas.height + 40
        }'>
            <foreignObject width='100%' height='100%'>
              ${layerTitle}
              <svg><image href="${dataURL}"></image></svg>
            </foreignObject>
        </svg>`;
        const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
        resolve(svg);
      };
      img.src = imageUrl;
    });
  }
}
