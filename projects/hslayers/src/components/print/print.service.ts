import {Injectable} from '@angular/core';

import {from, takeUntil} from 'rxjs';

import {HsMapService} from '../map/map.service';
import {HsPrintImprintService} from './print-imprint.service';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintTitleService} from './print-title.service';
import {HsShareThumbnailService} from '../permalink/share-thumbnail.service';
import {PrintModel} from './types/print-object.type';
import {xPos, yPos} from './types/XY-positions.type';

@Injectable({
  providedIn: 'root',
})
export class HsPrintService {
  constructor(
    private hsMapService: HsMapService,
    private hsShareThumbnailService: HsShareThumbnailService,
    private hsPrintLegendService: HsPrintLegendService,
    private hsPrintScaleService: HsPrintScaleService,
    private hsPrintTitleService: HsPrintTitleService,
    private hsPrintImprintService: HsPrintImprintService
  ) {}

  /**
   * Print styled print layout
   * @param print - Print object
   * @param complete - If true, generated image will be opened and printing interface will be created
   */
  async print(
    print: PrintModel,
    app: string,
    complete?: boolean
  ): Promise<void> {
    const obs = from(
      new Promise<string>(async (resolve, reject) => {
        const img = await this.createMapImage(print, app);
        resolve(img);
      })
    );
    obs
      .pipe(takeUntil(this.hsPrintLegendService.cancelRequest))
      .subscribe((img) => {
        const win = window.open();
        const html = `<html><head></head><style>body{background-color:white !important;}@page { size: landscape; }</style><body><img src='${img}'/></body></html>`;
        if (!win) {
          return;
        }
        win.document.write(html);
        setTimeout(() => {
          if (complete) {
            win.print();
          }
          //win.location.reload();
        }, 250);
      });
  }

  /**
   * Download map print layout as png image
   * @param print - Print object
   */
  async download(print: PrintModel, app: string): Promise<void> {
    const img = await this.createMapImage(print, app);
    if (!document) {
      return;
    }
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = img;
    a.download = 'HSL-map';
    a.click();
    window.URL.revokeObjectURL(img);
    a.remove();
  }

  /**
   * Create map image with additional styled text, optional scale, legend or imprint
   * @param print - Print object
   */
  async createMapImage(print: PrintModel, app: string): Promise<string> {
    await this.hsMapService.loaded(app);
    const canvases = this.hsMapService.getCanvases(app);
    const composition = document.createElement('canvas');
    const ctx = composition.getContext('2d');
    const res = [canvases[0].clientWidth, canvases[0].clientHeight];
    this.hsShareThumbnailService.setCanvasSize(composition, res[0], res[1]);
    canvases.forEach((canvas) => {
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        ctx.drawImage(canvas, 0, 0);
      }
    });

    if (print.titleObj?.text) {
      const tCanvas = await this.hsPrintTitleService.drawTitleCanvas(
        print.titleObj.text,
        print.titleObj.textStyle
      );
      if (tCanvas) {
        const textPos = this.getChildPosition(
          composition,
          tCanvas,
          print.titleObj.textStyle.posX,
          print.titleObj.textStyle.posY ?? 'top'
        );
        ctx.drawImage(tCanvas, textPos[0], textPos[1]);
      }
    }
    if (print.scaleObj?.include) {
      const sCanvas = await this.hsPrintScaleService.drawScaleCanvas(
        print.scaleObj,
        app
      );
      if (sCanvas) {
        ctx.drawImage(sCanvas, 3, composition.height - sCanvas.height);
      }
    }

    if (print.legendObj?.include) {
      const lCanvas = await this.hsPrintLegendService.drawLegendCanvas(
        print.legendObj,
        app
      );
      if (lCanvas) {
        const legendPos = this.getChildPosition(
          composition,
          lCanvas,
          print.legendObj.posX ?? 'right',
          print.legendObj.posY ?? 'bottom'
        );
        ctx.drawImage(lCanvas, legendPos[0], legendPos[1]);
      }
    }
    if (print.imprintObj?.author || print.imprintObj?.abstract) {
      const iCanvas = await this.hsPrintImprintService.drawImprintCanvas(
        print.imprintObj
      );
      if (iCanvas) {
        const imprintPos = this.getChildPosition(
          composition,
          iCanvas,
          print.imprintObj.textStyle.posX ?? 'center',
          print.imprintObj.textStyle.posY ?? 'bottom'
        );
        ctx.drawImage(iCanvas, imprintPos[0], imprintPos[1]);
      }
    }
    return composition.toDataURL('image/png');
  }

  /**
   * Get child canvas position relative to parent canvas
   * @param parentC - Parent HTMLCanvasElement
   * @param childC - Child HTMLCanvasElement
   * @param xPos - X pixels
   * @param yPos - Y pixels
   */
  private getChildPosition(
    parentC: HTMLCanvasElement,
    childC: HTMLCanvasElement,
    xPos: xPos,
    yPos: yPos
  ): number[] {
    const pos = [0, 0];
    if (!xPos && !yPos) {
      return pos;
    }
    switch (xPos) {
      case 'right':
        pos[0] = parentC.width - childC.width;
        break;
      case 'left':
        pos[0] = 0;
        break;
      case 'center':
      default:
        pos[0] = (parentC.width - childC.width) / 2;
    }

    switch (yPos) {
      case 'middle':
        pos[1] = (parentC.height - childC.height) / 2;
        break;
      case 'bottom':
        pos[1] = parentC.height - childC.height;
        break;
      case 'top':
      default:
        pos[1] = 0;
        break;
    }
    return pos;
  }
}
