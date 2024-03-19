import {Injectable} from '@angular/core';

import {HsPrintLegendService} from './print-legend.service';
import {HsShareThumbnailService} from 'hslayers-ng/services/share';
import {ImprintObj} from './types/imprint-object.type';
import {TextStyle} from './types/text-style.type';

@Injectable({
  providedIn: 'root',
})
export class HsPrintImprintService {
  constructor(
    private hsPrintLegendService: HsPrintLegendService,
    private hsShareThumbnailService: HsShareThumbnailService,
  ) {}

  /**
   * Draw imprint canvas
   * @param imprintObj - Imprint object
   */
  drawImprintCanvas(imprintObj: ImprintObj): Promise<HTMLCanvasElement> {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = await this.hsPrintLegendService.svgToImage(
        this.imprintToSvg(imprintObj),
      );
      if (img) {
        this.hsShareThumbnailService.setCanvasSize(
          canvas,
          img.width,
          img.height,
        );
        ctx.drawImage(img, 0, 0);
      }
      resolve(canvas);
    });
  }

  /**
   * Convert imprint styles and text to an svg
   * @param imprintObj - Imprint object
   */
  private imprintToSvg(imprintObj: ImprintObj): string {
    const styles = this.getStyles(imprintObj.textStyle);
    const height = imprintObj.height;
    const width = imprintObj.width;
    const svgSource = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}px' height='${height}px'>
            <foreignObject width='100%' height='100%'>
              <div xmlns='http://www.w3.org/1999/xhtml' style="${styles}">
                <div>${imprintObj.author}</div>
                ${imprintObj.abstract}
              </div>
            </foreignObject>
        </svg>`;
    const svg = 'data:image/svg+xml,' + encodeURIComponent(svgSource);
    return svg;
  }

  /**
   * Get styles string from textStyle object for the svg
   * @param textStyle - TextStyle object
   */
  private getStyles(textStyle: TextStyle): string {
    let tmpStyle = 'padding: 5px;';
    if (textStyle.posX === 'right') {
      tmpStyle += 'text-align:end;';
    } else if (textStyle.posX === 'left') {
      tmpStyle += 'text-align:start;';
    } else {
      tmpStyle += 'text-align:center;';
    }

    if (textStyle.bcColor) {
      tmpStyle += `background-color: ${textStyle.bcColor};`;
    }
    tmpStyle += `font:${textStyle.fontStyle.concat(
      ' ',
      textStyle.textSize,
      ' ',
      textStyle.fontFamily,
    )};`;

    return tmpStyle;
  }
}
